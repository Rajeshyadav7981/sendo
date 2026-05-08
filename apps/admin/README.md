# sendo-ui-vite

Vite + React 18 + TypeScript port of the legacy `sendo-ui` (CRA) admin app.

## Stack
- **Bundler:** Vite 5
- **UI:** React 18, antd 5 (yellow + black theme tokens), Tailwind 3
- **Server state:** TanStack Query 5 (devtools in dev)
- **Client state:** Zustand (with persistence for auth)
- **Routing:** React Router 6 (lazy routes)
- **HTTP:** axios with `withCredentials: true`, response unwrapping for the new Nest envelope, 401 → redirect

## Folder layout
```
src/
  app/                  # bootstrap, providers, route table
  config/               # env access (typed)
  features/             # feature modules — colocate api/hooks/pages
    auth/
    home/
    drivers/
    vehicles/
    vendors/
    customers/
    employees/
    expenses/
    tracker/
    help/
  shared/
    api/                # axios client, query client, error helpers
    components/common/  # PageContainer, ProtectedRoute, ErrorBoundary, etc.
    hooks/              # useMobile
    layouts/            # DashboardLayout, AuthLayout, Navbar, Sidebar
    lib/                # toast (antd message wrapper)
    types/              # API envelope types
  store/                # Zustand stores (auth, ui)
  styles/               # tailwind.css + theme.css + index.css + mobile.css
  main.tsx
```

## Local dev
```bash
cp .env.example .env       # set VITE_API_BASE to your Nest backend URL
npm install
npm run dev                # http://localhost:3000
```

The dev server proxies `/api`, `/onboarding`, `/vehicle`, `/trip`, `/attendance`,
`/advance`, `/payment`, `/customer`, `/home`, `/send-otp`, `/driver`, `/uploads`
and `/socket.io` to the backend when `VITE_USE_PROXY=true`.

## Migration status
- ✅ Auth flow (login / sign-up / forgot-password / verify-OTP / reset)
- ✅ Layout (Navbar, Sidebar, ProtectedRoute, ErrorBoundary)
- ✅ All 60+ admin routes registered (route table in `src/app/routes.tsx`)
- ✅ TanStack Query hooks for every backend endpoint group
- ✅ Tailwind + antd themes preserve the legacy yellow/black palette
- 🟡 Page components: most routes render `<StubPage>` until ported.
  Each stub references the legacy `.jsx` filename to copy from.

## Porting a screen
1. Open the legacy `.jsx` file referenced by the `StubPage`.
2. Create the matching feature page under `features/<area>/pages/`.
3. Replace ad-hoc `axios`/`fetch` calls with the typed hooks already in
   `features/<area>/*.api.ts` (and add `useQuery` / `useMutation` wrappers
   in a `*.hooks.ts` file alongside).
4. Swap `useState(...)` form data for `react-hook-form` + `zod` where forms
   are non-trivial.
5. Replace the `Component: stub(...)` entry in `src/app/routes.tsx` with a
   `lazy(() => import(...))` of your new page.

## Build
```bash
npm run build              # tsc -b && vite build
npm run preview            # serve dist/
```
