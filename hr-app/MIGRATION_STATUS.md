# Alban Falahi HR Migration

## Current state
- Existing AppDeploy HR application remains untouched.
- HR application source is staged under `hr-app/` on branch `app-migration`.
- New Supabase project: `Alban Falahi HR`.
- Supabase project is healthy and contains the HR schema: employees, branches, attendance, overtime, money, audit, dashboard_accounts, dashboard_sessions, employee_accounts, employee_sessions.

## Data migration gate
The old AppDeploy database contents are not exposed through the available migration tooling as a PostgreSQL dump/export. Therefore no employee, attendance, payroll, account, or audit records are being fabricated or copied from guesses.

Before cutover:
1. Obtain a real export/dump from the current HR database.
2. Import it into the matching Supabase tables.
3. Compare row counts and key relationships.
4. Test dashboard login, employee login, attendance, payroll, money records, and reports.
5. Only after the replacement is verified should the production frontend/backend be switched.

## Security gate
The ten HR tables currently have RLS disabled. Do not enable RLS without policies because that can block application access. The production architecture should put privileged database access behind the server/Edge Function layer and expose only authorized application operations.

## Cutover rule
The current AppDeploy application is the fallback and must remain available until the Supabase/Cloudflare replacement passes functional verification.