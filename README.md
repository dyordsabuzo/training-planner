# Training Planner

A web app for planning training programs and running through workouts: define
exercises, group them into supersets, organize supersets into sessions, and
schedule sessions across a multi-week plan. During a workout, the app walks
you through each exercise, tracks sets, and runs rest/work timers between
exercises.

## Tech stack

- React 18 + TypeScript
- [Vite](https://vitejs.dev/) for dev server and build, [Vitest](https://vitest.dev/) for tests
- Tailwind CSS for styling, with light/dark theme support
- [Firebase](https://firebase.google.com/) (Auth + Firestore)
- [Storybook](https://storybook.js.org/) for the shared component library

## Getting started

Requires Node 22.22.3+ and Yarn (see `.tool-versions`).

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
| `yarn lint` / `yarn format` | Lint / format the codebase |
| `yarn firebase:emulators` | Run local Firebase Auth/Firestore emulators |

## Deployment

The app is deployed as a static site to GitHub Pages via
[`deploy-static-site.yml`](.github/workflows/deploy-static-site.yml) on every
push to `main`, and Firebase Hosting previews are built per pull request via
[`firebase-hosting-pull-request.yml`](.github/workflows/firebase-hosting-pull-request.yml).
Firebase Hosting config (build output directory, SPA rewrites) lives in
`firebase.json`.
