# AGENTS.md

## Scope

- Treat this directory (`LaundryKu/`) as the project root. The parent folder also contains sibling material; run frontend commands from this directory.
- This is an Expo Router React Native app (`package.json` main = `expo-router/entry`) with strict TypeScript and npm lockfile.

## Commands

- Install: `npm install`
- Dev server: `npx expo start` (`--web` / `--android` as needed)
- Lint: `npm run lint` (`expo lint`)
- Typecheck: `npx tsc --noEmit` (there is no package script for this)
- There is no configured test runner in `package.json`; use typecheck + lint + manual Expo smoke for verification.
- If an RTK wrapper misparses `npx expo ...`, rerun the Expo command directly with `npx expo ...`.

## Environment

- Required `.env` keys are public Expo vars:
  - `EXPO_PUBLIC_API_URL=http://localhost:3000`
  - `EXPO_PUBLIC_USE_DUMMY_PAYMENT=true` for dummy payment UI.
- Android emulator backend URL should be `http://10.0.2.2:3000`; physical devices need the laptop LAN IP.
- Backend API must be running before meaningful manual QA; frontend defaults to `http://localhost:3000` in `services/api.ts`.

## Architecture

- `app/_layout.tsx` wraps navigation in `AlertProvider` → `AuthProvider` → React Navigation theme, then registers route groups.
- Route groups are role-based: `(auth)`, `(admin)`, `(customer)`, `(owner)`, `(courier)`.
- Protect role screens with `components/ProtectedRoute.tsx`; owner/courier users who are not verified are redirected to `/(auth)/waiting-verification`.
- `contexts/AuthContext.tsx` owns session state, profile loading, logout, and 401 auto-logout wiring.
- `services/api.ts` is the only Axios client. It attaches bearer tokens, stores tokens in memory + SecureStore on native or localStorage on web, and handles 401 callbacks.
- API calls should go through `services/*Service.ts`; UI should not call Axios directly.

## UI and data conventions

- Use path alias `@/*` from `tsconfig.json`; do not add long relative imports for shared app modules.
- Use `LaundryColors` from `constants/colors.ts`; role colors are already defined (`rolePelanggan*`, `roleMitra*`, `roleKurir*`).
- Use `constants/orderStatus.ts` helpers for order labels, colors, and the 9-step timeline.
- Use `utils/crossAlert.ts` for alerts so web and native both work; root layout already mounts `AlertProvider`.
- Customer pickup location uses `expo-location`; keep manual coordinate input gated behind `EXPO_PUBLIC_ALLOW_MANUAL_COORDS=true`.
- For unverified owner/courier screens, show verification-required UI and avoid repeatedly calling protected endpoints that will 403.

## Verification expectations

- After TS/TSX changes, run `npx tsc --noEmit` and `lsp_diagnostics` on changed files.
- For UI or routing changes, start Metro with `npx expo start --clear`; success is reaching `Waiting on http://localhost:8081`.
- Current Expo smoke may warn that patch versions should be updated; that warning is compatibility noise unless package versions are part of the task.

## Files not to treat as source

- Do not edit `.expo/`, `node_modules/`, `dist/`, `web-build/`, generated native `ios/` or `android/` folders.
- `.env` exists locally and should not be committed or exposed.
