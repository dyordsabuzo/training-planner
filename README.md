# Training Planner

A web app for planning training programs and running through workouts: define
exercises, group them into supersets, organize supersets into sessions, and
schedule sessions across a multi-week plan. During a workout, the app walks
you through each exercise, tracks sets, and runs rest/work timers between
exercises.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): components, data model, id references, access and caching
- [DEPLOYMENT.md](DEPLOYMENT.md): CI deploys, secrets, manual deploys and data migrations

Firestore security rules for this project live in the
[`dragonbeat`](https://github.com/dyordsabuzo/dragonbeat) repo, not here.

## Tech stack

- React 18 + TypeScript
- [Vite](https://vitejs.dev/) for dev server and build, [Vitest](https://vitest.dev/) for tests
- Tailwind CSS for styling, with light/dark theme support
- [Firebase](https://firebase.google.com/) (Auth + Firestore)
- [Storybook](https://storybook.js.org/) for the shared component library

## Getting started

Requires Node 22 and Yarn 1, pinned in `.tool-versions`. Newer Node releases
fail `firebase-tools`' engine check on `yarn install`.

```bash
yarn install
cp .env.example .env   # then fill in the Firebase config values
yarn dev
```

The app runs at http://localhost:3000.

### Environment variables

Firebase config is read from `VITE_`-prefixed env vars (see `.env.example`):

- `VITE_FBASE_APIKEY`
- `VITE_FBASE_AUTHDOMAIN`
- `VITE_FBASE_PROJECTID`
- `VITE_FBASE_APPID`

By default, `yarn dev` connects to the local Auth/Firestore emulators (see
`yarn firebase:emulators`). Set `VITE_USE_FIREBASE_EMULATOR=false` in `.env` to
connect local dev to the live Firebase project instead — useful for verifying
against real data, but be aware any writes during testing hit production.

## Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start the Vite dev server |
| `yarn build` | Production build, output to `build/` |
| `yarn preview` | Serve the production build locally |
| `yarn test` | Run the test suite once (Vitest) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn storybook` | Run Storybook locally |
| `yarn build-storybook` | Build a static Storybook site |
| `yarn lint` | Lint `src/` and auto-fix what it can (ESLint 9 flat config in `eslint.config.mjs`) |
| `yarn format` | Format the codebase with Prettier |
| `yarn firebase:emulators` | Run local Firebase emulators (Auth, Firestore, Functions) |
| `yarn firebase:deploy` | Build and deploy Firebase Hosting only |
| `yarn firebase:deploy:functions` | Deploy Cloud Functions from `functions/` |

## Deployment

The app is deployed as a static site to GitHub Pages via
[`deploy-static-site.yml`](.github/workflows/deploy-static-site.yml) on every
push to `main`, and Firebase Hosting previews are built per pull request via
[`firebase-hosting-pull-request.yml`](.github/workflows/firebase-hosting-pull-request.yml).
Firebase Hosting config (build output directory, SPA rewrites) lives in
`firebase.json`. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.
