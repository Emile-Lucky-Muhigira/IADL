# @iadl/web

Next.js 14 (App Router) web client for IADL Center EMIS. TypeScript, Tailwind,
React Query, Radix UI, and NextAuth.

Runs on **port 3000**.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Next/ESLint |

## Layout

```
src/
├── app/
│   ├── login/                # Auth entry
│   ├── dashboard/            # One subtree per role:
│   │   ├── super-admin/  adl-admin/  gatekeeper/
│   │   ├── trainer/  student/  parent/  finance/  auditor/
│   │   └── notifications/
│   ├── certificates/verify/  # Public certificate verification
│   └── api/auth/[...nextauth] # NextAuth route
├── components/               # Layout + shared UI
├── lib/
│   ├── api.ts                # Axios client + typed API modules
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Formatting helpers
└── middleware.ts             # Role-based route protection
```

## Conventions

- **All** data fetching goes through `src/lib/api.ts` (Axios instance that
  attaches the bearer token and unwraps the API response envelope). Never call
  the backend directly from components.
- Use **React Query** for fetching/caching; invalidate queries after mutations.
- `middleware.ts` enforces role-based access to `/dashboard/*` routes; the API
  remains the source of truth for authorization.

## Environment

- `NEXT_PUBLIC_API_URL` — API base URL (e.g. `http://localhost:3001/api/v1`).
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — NextAuth configuration.
