# Alban Falahi HR Migration

## Current state
- Existing AppDeploy HR application remains untouched.
- HR application source is staged under `hr-app/` on branch `app-migration`.
- New Supabase project: `Alban Falahi HR` (`roycuuyceopmlmkjllrt`) is healthy.
- HR schema is present: employees, branches, attendance, overtime, money, audit, dashboard_accounts, dashboard_sessions, employee_accounts, employee_sessions.
- Added compatibility fields/indexes needed by the existing HR UI (employee schedule/pay fields, attendance timing fields, overtime approval fields, money reason/date fields, and session lookup indexes).
- Deployed Supabase Edge Function `hr-api` as the new privileged API layer. It implements the main dashboard login/session, employee login/session, attendance, employee summary, generic CRUD, dashboard accounts, and employee-account operations.
- Added `src/lib/hrApi.ts` as the frontend adapter for the new Supabase API endpoint.

## Data migration gate
The old AppDeploy database contents are not exposed through the available migration tooling as a PostgreSQL dump/export. Therefore no employee, attendance, payroll, account, or audit records are being fabricated or copied from guesses.

Before cutover:
1. Obtain a real export/dump from the current HR database.
2. Import it into the matching Supabase tables.
3. Compare row counts and key relationships.
4. Finish replacing the remaining AppDeploy frontend imports with `hrApi.ts`.
5. Test dashboard login, employee login, attendance, payroll, money records, and reports.
6. Configure Cloudflare Pages against `hr-app/` using Vite (`npm run build` -> `dist`) and Supabase environment configuration.
7. Only after the replacement is verified should the production frontend/backend be switched.

## Security gate
The ten HR tables currently have RLS disabled. Do not enable RLS without policies because that can block application access. The Edge Function currently uses the Supabase service role server-side, so the public frontend should not receive that key. RLS policies must be designed and enabled before production cutover.

## Cutover rule
The current AppDeploy application is the fallback and must remain available until the Supabase/Cloudflare replacement passes functional verification.