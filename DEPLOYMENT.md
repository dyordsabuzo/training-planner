# Deployment

The app is a static build (`yarn build` → `build/`) deployed to two hosts by
GitHub Actions. Firestore security rules are deployed separately, from the
[`dragonbeat`](https://github.com/dyordsabuzo/dragonbeat) repo.

## Pull requests: Firebase Hosting preview

[`firebase-hosting-pull-request.yml`](.github/workflows/firebase-hosting-pull-request.yml)
builds every pull request from this repository and deploys it to a temporary
Firebase Hosting preview channel. The preview link is posted on the PR.

```mermaid
flowchart LR
  PR["Pull request"] --> Build["yarn install && yarn build"]
  Build --> Preview["Firebase Hosting<br/>preview channel"]
  Preview --> Comment["Preview URL<br/>commented on PR"]
```

## Merge to `main`: production

Two workflows run on every push to `main`:

- [`firebase-hosting-merge.yml`](.github/workflows/firebase-hosting-merge.yml)
  deploys to the **live** Firebase Hosting channel.
- [`deploy-static-site.yml`](.github/workflows/deploy-static-site.yml) deploys
  the same build to **GitHub Pages**.

```mermaid
flowchart LR
  Main["Push to main"] --> B1["Build"] --> Live["Firebase Hosting (live)"]
  Main --> B2["Build"] --> Pages["GitHub Pages"]
```

Both can also be started by hand (`workflow_dispatch`).

## Secrets

Repository secrets used by the workflows (values are never committed):

| Secret | Purpose |
| --- | --- |
| `VITE_FBASE_APIKEY`, `VITE_FBASE_AUTHDOMAIN`, `VITE_FBASE_PROJECTID`, `VITE_FBASE_APPID` | Firebase web config baked into the build |
| `PACKAGES_READ_TOKEN` | Installs `@dyordsabuzo/ui-components` from GitHub Packages |
| `FIREBASE_SERVICE_ACCOUNT_TRAINING_PLANNER_387200` | Deploys to Firebase Hosting |

## Manual deploys

| Command | Deploys |
| --- | --- |
| `yarn firebase:deploy` | Hosting only (builds first) |
| `yarn firebase:deploy:functions` | Cloud Functions in `functions/`. Set the region in `functions/src/index.ts` before the first deploy. Requires the Blaze plan. |

`firebase:deploy` is deliberately limited to Hosting so a deploy from this
repo can never overwrite the shared Firestore rules.

## Data migrations

One-off Admin SDK scripts live in `scripts/`. They target the emulator when
`FIRESTORE_EMULATOR_HOST` is set, and otherwise the real project using
Application Default Credentials (`gcloud auth application-default login`).
They write nothing unless `--apply` is passed, and save a JSON backup to
`scripts/backups/` first. Backups contain user data and are gitignored.

```mermaid
flowchart LR
  Dry["npx tsx scripts/NAME.ts<br/>(dry run: counts only)"] --> Check["Review counts"]
  Check --> Apply["... --apply<br/>(backup, then write)"]
```

### `migrate-ids.ts` (id references)

This converts content references and progress keys from names to doc ids,
and gives every session group a stable id. Run it **in the same window as
deploying the app version that reads ids**, while no admin is editing
content:

1. Merge to `main` and wait for the Hosting deploy to finish.
2. `npx tsx scripts/migrate-ids.ts`, then check the counts.
3. `npx tsx scripts/migrate-ids.ts --apply`

The script can be re-run safely. A second run reports 0 changes.
