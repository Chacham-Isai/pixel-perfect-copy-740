
Implementation steps
1. Remove the global title manager
- Delete `src/components/PageTitleManager.tsx`.
- In `src/App.tsx`, remove:
  - `import { PageTitleManager } from "@/components/PageTitleManager";`
  - `<PageTitleManager />` from inside `<BrowserRouter>`.

2. Move title updates into `AppSidebar` with post-commit timing
- In `src/components/AppSidebar.tsx`:
  - Add `useEffect` import from React.
  - Change router import to include `useLocation`.
  - Add `const location = useLocation();` inside `AppSidebar`.
  - Add a `useEffect` keyed by `location.pathname` that:
    - normalizes the path (`replace(/\/+$/, "") || "/"`)
    - resolves title from `PAGE_TITLES`
    - updates `document.title` inside `setTimeout(() => ..., 0)`
    - clears timeout in cleanup to avoid stale writes on rapid route changes.

3. Keep page-title mapping aligned with sidebar routes
- Use route keys matching current protected routes:
  `/dashboard`, `/inbox`, `/caregivers`, `/campaigns`, `/campaign-builder`, `/talent-sourcing`, `/halevai`, `/reviews`, `/competitors`, `/content`, `/landing-pages`, `/creatives`, `/enrollment`, `/automations`, `/playbooks`, `/recommendations`, `/briefing`, `/settings`, `/onboarding`.
- Keep “Daily Briefing” label for `/briefing`.

4. Prevent stale titles on non-sidebar routes after removing `PageTitleManager`
- Add explicit title effects in public/non-AppSidebar routes:
  - `src/pages/Index.tsx` → `Halevai.ai`
  - `src/pages/Auth.tsx` → `Sign In | Halevai.ai` (or auth-specific default)
  - `src/pages/ResetPassword.tsx` → `Reset Password | Halevai.ai`
  - `src/pages/PublicLandingPage.tsx` → page-derived title (fallback `Halevai.ai`)
- Keep existing `NotFound` title effect as-is.

5. Regression verification
- While signed in, navigate quickly: Dashboard → Inbox → Caregivers → Talent Sourcing → back/forward.
- Confirm tab title always matches current route with no one-page lag.
- Sign out to `/auth` and verify title is not stuck on the last protected page.
- Check `/`, `/reset-password`, and one `/lp/:slug` route for correct title behavior.

Technical details
- Files to change:
  - delete `src/components/PageTitleManager.tsx`
  - edit `src/App.tsx`
  - edit `src/components/AppSidebar.tsx`
  - edit `src/pages/Index.tsx`
  - edit `src/pages/Auth.tsx`
  - edit `src/pages/ResetPassword.tsx`
  - edit `src/pages/PublicLandingPage.tsx`
- Keep title writing single-source per route context:
  - protected routes via `AppSidebar`
  - public routes via local page effects
- Use timeout cleanup pattern:
```text
const id = window.setTimeout(() => { document.title = ... }, 0);
return () => window.clearTimeout(id);
```
