# Alban Falahi HR Migration

This folder is reserved for migrating the Alban Falahi HR / Accountant application away from AppDeploy hosting.

## Current source
- AppDeploy app: `alban-falahi-attendance-payroll-kcldie`
- Current working snapshot: `1789155450043`
- Migration branch: `app-migration`

## Target architecture
- GitHub: source control
- Cloudflare Pages: web frontend and previews
- Supabase: persistent HR data/auth/backend services

## Important
The existing AppDeploy application is not modified by this migration. The current production app remains the source of truth until the replacement is fully tested.

The HR frontend currently calls AppDeploy APIs and the backend imports `@appdeploy/sdk`, so the backend must be migrated before the project can be deployed as a standalone Cloudflare Pages application.
