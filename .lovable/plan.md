

## Plan: Security Hardening — Role-Based Access + Rate Limiting

### 1. Add `viewer` to the `agency_role` enum and create role-based RLS

**Migration:**
- Add `'viewer'` to `agency_role` enum
- Create a `get_user_agency_role()` SECURITY DEFINER function returning the user's role
- Add restrictive RLS policies on sensitive tables so `viewer` role gets SELECT-only:
  - `competitors`, `pay_rate_intel`, `campaigns` (financial/competitive data) — viewers can SELECT but not INSERT/UPDATE/DELETE
  - `automation_configs`, `business_config`, `agency_members` — viewers can SELECT only
- Keep existing ALL policies but scope them to `owner`/`admin` roles using `has_agency_role()`
- All other tables remain accessible to all members (operational necessity)

### 2. Rate-limit landing page event insertion

**Migration:**
- Create a PL/pgSQL trigger function `check_landing_page_event_rate_limit()` that counts recent inserts from the same IP/landing_page_id in the last minute (using `metadata->>'ip'` or just `landing_page_id` + time window)
- Since we don't have IP in metadata reliably, rate-limit by: max 60 events per `landing_page_id` per minute (prevents bot flooding)
- Attach a BEFORE INSERT trigger on `landing_page_events`

### 3. Fix React ref warning

- Wrap `App` component's `BrowserRouter` or `QueryClientProvider` usage — this is a known React 18 `StrictMode` warning, not actionable. Will note as non-issue.

### Technical Details

**Role hierarchy:** `owner` > `admin` > `viewer`
- `owner`: full access (create/update/delete agency, manage members)
- `admin`: full operational access (current behavior)
- `viewer`: read-only access to sensitive tables (competitors, pay rates, financials), read-write on operational tables (caregivers, content)

**Sensitive tables getting viewer restrictions:**
- `competitors` — competitive intel
- `pay_rate_intel` — rate strategy
- `campaigns` (spend data) — financial
- `business_config` — branding config
- `automation_configs` — system config

**Rate limiting approach:**
- Trigger-based: BEFORE INSERT on `landing_page_events`, reject if >60 rows exist for same `landing_page_id` in last 60 seconds

**Frontend changes:**
- Update `useAuth` hook to expose `agencyRole`
- Conditionally hide edit/delete buttons for `viewer` role in sensitive pages (Competitors, Settings, Automations)
- Add "Team Members" tab to Settings page showing members + roles (owner can change roles)

