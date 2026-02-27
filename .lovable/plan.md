
Implementation steps
1) Stabilize browser tab titles from a single source
- Keep title updates only in `src/components/AppLayout.tsx`.
- Change title effect from `useEffect` to `useLayoutEffect` to prevent one-navigation lag.
- Add a route-title resolver that normalizes pathname (trailing slash) and supports exact + prefix matches.
- Remove `usePageTitle(...)` imports/calls from all AppLayout-backed pages so no child component can overwrite titles after navigation.

2) Remove competing title writers in page files
- Update these files to drop `usePageTitle` usage:
  - `src/pages/Dashboard.tsx`
  - `src/pages/Caregivers.tsx`
  - `src/pages/Campaigns.tsx`
  - `src/pages/TalentSourcing.tsx`
  - `src/pages/HalevaiChat.tsx` (if present)
  - `src/pages/Enrollment.tsx`
  - `src/pages/Competitors.tsx`
  - `src/pages/Reviews.tsx`
  - `src/pages/Recommendations.tsx`
  - `src/pages/Playbooks.tsx`
  - `src/pages/Briefing.tsx`
  - `src/pages/ContentCalendar.tsx`
  - `src/pages/LandingPages.tsx`
  - `src/pages/AdCreatives.tsx`
  - `src/pages/Automations.tsx`
  - `src/pages/Inbox.tsx`
- Keep explicit title handling for non-AppLayout routes (`/`, `/auth`, `/reset-password`, 404/public pages) so those never inherit stale titles.

3) Harden Talent Sourcing validation UX
- In `src/pages/TalentSourcing.tsx`, replace single `nameError` string flow with explicit validation state (`touched/submitted` + derived invalid).
- Keep Create button enabled unless `creating === true` (no empty-name disable).
- Force visible invalid styling when empty:
  - input classes include `!border-destructive` and destructive focus ring when invalid.
  - inline message always renders after blur or submit attempt when empty.
  - label keeps required asterisk.
- Add semantic validation attributes:
  - `required`
  - `aria-invalid`
  - `aria-describedby` linked to inline error text.
- Reset validation state when dialog opens/closes and after successful create.
- Wrap create async flow in `try/catch/finally` so `creating` always resets (prevents sticky disabled button).

4) Regression verification (post-implementation)
- Navigate rapidly between 6+ routes (sidebar + browser back/forward) and confirm tab title always matches current page, never previous page.
- Validate Talent Sourcing dialog:
  - Open dialog with empty name: click Create → inline error + red border visible.
  - Blur empty field → inline error visible.
  - Enter valid name → red border/error clear.
  - Click Create with valid data → button disables only during request/spinner, then re-enables.

Technical details
- Primary root cause for title lag: multiple title writers (`AppLayout` + page-level `usePageTitle`) using passive effects.
- Primary root cause for validation inconsistency: not all invalid states were guaranteed to produce persistent visual feedback and creating-state recovery wasn’t fully guarded.
- Targeted files:
  - `src/components/AppLayout.tsx`
  - `src/pages/TalentSourcing.tsx`
  - all pages currently importing `usePageTitle`
  - optionally `src/hooks/usePageTitle.ts` (deprecate/no-op or keep only for non-AppLayout pages)
