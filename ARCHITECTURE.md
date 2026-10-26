# Architecture

Training Planner is a client-only React single-page app backed by Firebase.
The browser talks to Firebase Auth and Firestore directly, and access is
enforced by Firestore security rules. Callable Cloud Functions handle the few
writes the client may not make itself: creating orgs, invites and
memberships, and setting the custom claims the rules check.

```mermaid
flowchart LR
  Browser["React SPA<br/>(Vite build)"] -->|sign-in| Auth["Firebase Auth"]
  Browser -->|reads / writes| Firestore["Cloud Firestore"]
  Hosting["Firebase Hosting<br/>+ GitHub Pages"] -->|serves build/| Browser
  Rules["Security rules<br/>(dragonbeat repo)"] -.->|enforce| Firestore
  Browser -->|callables| Functions["Cloud Functions<br/>(australia-southeast1)"]
  Functions -->|members, invites| Firestore
  Functions -->|custom claims| Auth
```

## External interfaces and dependencies

| Dependency | Used for |
| --- | --- |
| Firebase Auth | Email/password and Google sign-in |
| Cloud Firestore | All app data (see [Data model](#data-model)) |
| Cloud Functions | Org, invite and membership management; custom claims (see [Organisations](#organisations)) |
| Firebase Hosting / GitHub Pages | Serving the static build (see [DEPLOYMENT.md](DEPLOYMENT.md)) |
| `@dyordsabuzo/ui-components` | Shared UI library (GitHub Packages, needs `PACKAGES_READ_TOKEN`) |
| `@tanstack/react-query` | Data fetching and caching, persisted to IndexedDB |

**Firestore security rules are not in this repo.** They live in the
[`dragonbeat`](https://github.com/dyordsabuzo/dragonbeat) repo, which also
holds the Regatta app's rules for the same Firebase project
(`training-planner-387200`) and deploys them from CI. Never deploy rules from
here.

## Source layout

| Path | Contents |
| --- | --- |
| `src/context/` | App state providers: auth, settings, content (`SourceDataContext`), the running session (`SessionContext`), user management |
| `src/pages/` | Routed screens: home, training flow (`train/`, `timer/`), history, sharing |
| `src/management/` | Admin "Manage" screens: listings, relationship map, users |
| `src/forms/` | Create/edit forms for exercises, supersets, sessions, plans, users |
| `src/common/` | Pure helpers: Firestore access (`utils.ts`), references (`refs.ts`), plan cycles, stats, caching |
| `src/routes/` | Route table and app shell |
| `functions/` | Callable Cloud Functions for orgs, invites, members and claims |
| `scripts/` | One-off Admin SDK data migrations |

Providers are nested in `src/App.tsx`: Theme → Sidebar → Auth → AppSettings →
Session → SourceData → UserManagement → routes.

## Data model

Content is a hierarchy: **plan → sessions → supersets / exercise groups →
exercises**.

| Collection | Doc | Key fields |
| --- | --- | --- |
| `orgs/{orgId}/exercises` | one per exercise | `name`, `supersets[]`, `alternatives[]`, targets |
| `orgs/{orgId}/supersets` | one per superset | `name`, `exercises[]`, `sessions[]`, targets |
| `orgs/{orgId}/sessions` | one per session | `name`, `supersets[]`, `groups[]` (inline exercise groups, each with a stable `id`), share snapshot |
| `orgs/{orgId}/plans` | one per plan | `name`, `sessions[]`, `weeks{}`, cycle settings |
| `users` | `users/{uid}` | profile and access request |
| `userdata` | `userdata/{uid}` | `inProgress` for a run underway |
| `userdata/{uid}/plans` | `plans/{planId}` | `orgId` of the plan, plus that plan's logged progress |
| `settings` | `settings/app` | admin contact email |
| `settings` | `settings/platform` | billing guard state: `functionsSuspended`, `costAmount`, `allowedCost` |
| `orgs` | `orgs/{orgId}` | `name`, `code`, `ownerUid`, `status` (`active` / `suspended`), `contentVersion` |
| `orgs/{orgId}/members` | `members/{uid}` | `uid`, `role` (`owner` / `trainer` / `client`), `assignedPlanIds[]`, `trainerUids[]` (clients), `email`, `displayName` |
| `orgs/{orgId}/invites` | `invites/{token}` | `role`, `expiresAt`, `usesLeft` |

Before orgs, content lived in top-level collections and roles in
`users/{uid}.role` / `plans[]`. `scripts/migrate-orgs.ts` copied it all into
`orgs/default`, and `scripts/cleanup-top-level.ts` removes the old copies
and fields.

### References are ids, the UI uses names

Every reference between content items, and every key in logged progress, is
stored as a **Firestore doc id** (exercise groups use their stable group id).
Renaming an item therefore never breaks a reference or orphans history.

The UI works with names. `src/common/refs.ts` is the single translation
point:

```mermaid
flowchart LR
  FS["Firestore<br/>(id references)"] -->|getFromDB| Cache["Query cache<br/>(stored form)"]
  Cache -->|contentView / userdataView| UI["Screens and forms<br/>(names)"]
  UI -->|toStoredEntity / progressKeys| Save["saveToDB / SessionContext"]
  Save --> FS
```

- `SourceDataContext` reads the stored caches and exposes a name view.
  Content saves go through `toStoredEntity`.
- `SessionContext` writes progress with keys converted by `progressKeys`. Each
  finished run also saves `meta.labels` (id → name), so history can still
  name items that were since deleted.
- Lookups pass unknown values through and also match a name an item used to
  have (`previousNames`), so data saved before the id migration
  (`scripts/migrate-ids.ts`) still reads correctly.

Names stay unique within a collection (`src/common/nameValidation.ts`), which
keeps the mapping exact.

### Progress shape

```
userdata/{uid}
  inProgress { plan, week, session, data }
userdata/{uid}/plans/{planId}
  orgId               org the plan belongs to (never changes)
  {week}              "Week 1" ... or "Open" for open plans
    {sessionId}
      {unitId}        superset id or exercise-group id
        {exerciseId}
          {set}       { targetRep, targetWeight, ... }
      mood, meta { completedAt, startedAt, labels }
```

Each plan's progress is its own doc, tagged with its org, so a trainer can
read a client's progress for their org only. The app reads the active org's
plan docs (`where orgId ==`) and `assembleUserdata` (`refs.ts`) joins them
with `inProgress` into the single-doc shape the screens use. Before Phase 3a
all of this lived in `userdata/{uid}`; `scripts/split-userdata.ts` moved it.

## Access model

Everything is scoped to the user's **active org** (see
[Organisations](#organisations)). In the UI, an owner or trainer of the
active org has the `admin` role and a client has `user`
(`AuthContext.tsx`, from `useOrgMembership.ts`).

- Members of the org can read its exercises, supersets and sessions.
- Trainers see every plan. Clients query plans by `documentId() in` their
  member doc's `assignedPlanIds`.
- A user reads and writes only their own progress. A new plan doc must be
  tagged with an org they belong to, and its `orgId` can't change.
- Owners and trainers of an org can read (never write) their clients' plan
  docs tagged with that org. A list must filter on `orgId`. The root
  `userdata/{uid}` (`inProgress`) stays private to the user and the platform
  admin.
- "View as" shows the app as a member sees it, read-only. It uses the same
  per-org progress read, so it works for any trainer of the org.
- Trainers write content. Roles and plan assignments change only through
  Cloud Functions. App settings are for the platform admin.
- A shared session (`isShareable`) opens without signing in, through its
  self-contained `sharedSnapshot`. Share links are
  `/training-planner/share/{orgId}/{sessionId}`. Older links without an org
  id open from `orgs/default`.

### Organisations

Each user's ID token carries a custom claim `orgs: {[orgId]: role}` (and
`superAdmin` for platform admins). Only `functions/src/claims.ts` sets it,
rebuilding it from the user's member docs whenever a membership changes.
Suspended orgs are left out. The app reads the claim on sign-in, refreshing
the token once if it has no orgs yet. It remembers the active org on the
device, and the profile menu offers a switcher when there is more than one.
Under `orgs/{orgId}`:

How people get into an org:

- **Trainers** start their own from Home ("Start my organisation", which
  calls `createOrg`). Anyone signed in who isn't in an org sees it.
- **Clients and trainers** join through an invite link (with a QR code) made
  on the Clients screen: `/training-planner/join/{orgId}/{token}`
  (`acceptInvite`). Trainers can invite clients; only the owner invites
  trainers.
  A link opened while signed out is remembered, and Home returns to it
  after sign-in or sign-up.
- **The platform admin** can still add an existing account that asked for
  access (`addMember`, from the Clients screen).

Rules under `orgs/{orgId}`:

- Members read exercises, supersets and sessions. Owners and trainers write them.
- Clients read only the plans in their member doc's `assignedPlanIds`.
- Members and invites are written only by Cloud Functions. Owners change
  roles and assign trainers to clients. Trainers invite clients and assign
  plans. Anyone signed in can create an org.

| Callable | Who | Does |
| --- | --- | --- |
| `createOrg` | any signed-in user | creates an org, caller becomes `owner` |
| `createInvite` | owner (any role), trainer (`client` only) | invite token (expiry, max uses) |
| `acceptInvite` | any signed-in user | joins the org with the invite's role |
| `addMember` | owner | adds an existing account as `trainer` or `client` (used by the Users screen) |
| `setMemberRole` | owner | `trainer` ↔ `client` |
| `removeMember` | owner, or the member themselves | removes the membership |
| `setAssignedPlans` | owner, trainer | sets a member's `assignedPlanIds` |
| `setClientTrainers` | owner | sets a client's `trainerUids` (each must be a trainer or the owner) |
| `suspendOrg` | super admin | suspends or reactivates an org |

`billingGuard` isn't callable. It runs on Cloud Billing budget notifications
and closes the callables to the public once the project starts costing
money (see [DEPLOYMENT.md](DEPLOYMENT.md#cost-controls)). The app reads
`settings/platform.functionsSuspended` and shows "temporarily unavailable"
on the Clients screen instead of calling them.

### Trainers managing clients

- **Clients screen** (`/training-planner/admin`, `UserListing.tsx`): the
  active org's roster, filtered to Clients (optionally "My clients", from
  `trainerUids`), Trainers or All. Edit changes role, plans and, for the
  owner, a client's trainers (`UserForm.tsx`).
- **Client page** (`/training-planner/admin/clients/{uid}`,
  `ClientDetailPage.tsx`): assigned plans with progress (done and overdue
  sessions for open plans, completed sessions otherwise), recent sessions
  (`HistoryRunList.tsx`, read-only) and a "View as" shortcut. Progress comes
  from `useClientUserdata` (`SourceDataContext.tsx`), which shares the cache
  with "View as".
- Assigning trainers only labels the roster. Every trainer of the org can see
  every client.

## Caching and offline use

- React Query keeps fetched data in IndexedDB for up to 7 days
  (`src/common/queryCache.ts`), so the app opens instantly and works offline.
- Content queries are keyed by org (`["sourceData", collection, orgId, ...]`)
  and never go stale on their own. Each trainer edit writes a new
  `orgs/{orgId}.contentVersion`, and clients refetch that org's content only
  when the value changes. This costs no extra reads, since the org doc is
  read at startup anyway.
- Progress is keyed by user and org (`["sourceData", "userdata", uid, orgId]`)
  and refetches normally; switching org shows that org's progress only.
- The last known memberships are kept in localStorage, so a cold start
  offline still opens the right org's cached content.
- The cache is cleared on sign-out. Bump `CACHE_BUSTER` whenever the cached
  data's shape changes.
