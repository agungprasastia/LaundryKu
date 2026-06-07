# AGENTS.md

## Scope

- Treat this directory (`LaundryKu/`) as the project root. The parent folder also contains sibling material; run frontend commands from this directory.
- This is an Expo Router React Native app (`package.json` main = `expo-router/entry`) with strict TypeScript and npm lockfile.

## Commands

- Install: `npm install`
- Dev server: `npx expo start` (`--web` / `--android` / `--ios` as needed). If wrappers misparse Expo flags, rerun directly as `npx expo start --clear --web`.
- Lint: `npm run lint` (`expo lint`)
- Typecheck app code: `npm run typecheck` or `npx tsc --noEmit`
- Tests: `npm test -- --runInBand`; Jest uses `tsconfig.spec.json` for test globals.
- Main `tsconfig.json` deliberately excludes `__tests__` and `*.test.*`; do not remove those excludes unless you also keep `npx tsc --noEmit` green.

## Environment

- Required `.env` keys are public Expo vars:
  - `EXPO_PUBLIC_API_URL=http://localhost:3000`
  - `EXPO_PUBLIC_USE_DUMMY_PAYMENT=true` for dummy payment UI.
  - `EXPO_PUBLIC_ALLOW_MANUAL_COORDS=true` only when showing the development manual-coordinate fallback.
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
- Google auth is intentionally not implemented; keep login/register Google buttons as explicit Coming Soon unless backend/OAuth support is added.
- Owner service active state is controlled via the existing deactivate/delete flow; do not add a fake `is_active` toggle unless the backend update contract is verified.
- Customer order tracking polls every 8s only while detail modal is open; courier auto-location updates every 12s and must clear its interval on stop/unmount/task completion.

## Verification expectations

- After TS/TSX changes, run `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, and `lsp_diagnostics` on changed files.
- For UI or routing changes, start Metro with `npx expo start --clear --web`; success is reaching `Waiting on http://localhost:8081`.
- Current Expo smoke may warn that patch versions should be updated; that warning is compatibility noise unless package versions are part of the task.

## Files not to treat as source

- Do not edit `.expo/`, `node_modules/`, `dist/`, `web-build/`, generated native `ios/` or `android/` folders.
- `.env` exists locally and should not be committed or exposed.
