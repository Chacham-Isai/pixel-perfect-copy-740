

## Plan: Fix 3 Remaining UI Bugs

### Bug 1: Browser tab titles off by one page
**Status**: Still an issue. Each page calls `usePageTitle("X")` individually, but during route transitions the timing can cause the wrong title to display.

**Fix**: Add a centralized title manager in `AppLayout.tsx` that sets `document.title` based on `location.pathname`. This fires reliably after navigation. Remove individual `usePageTitle` calls from pages (or keep them as a no-op fallback — the centralized one will win).

**Files**: `src/components/AppLayout.tsx` — add a `useEffect` with `location.pathname` dependency and a pathname-to-title map.

### Bug 2: Recommendations Approved tab empty state
**Status**: Already fixed. Lines 136-142 of `Recommendations.tsx` already have the empty state with `CheckCircle` icon, heading, and description. No changes needed.

### Bug 3: Talent Sourcing "Create Campaign" — no visible validation
**Status**: The button is disabled when name is empty (`!form.name.trim()` on line 286), so clicking does nothing. Zod validation (line 97-99) fires a toast but only if the button is clickable. No inline error or required indicator.

**Fix**:
1. Add a red asterisk `*` next to the "Campaign Name" label
2. Add a `nameError` state that shows inline red text "Campaign name is required" when the user tries to submit or blurs the field with an empty value
3. Make the button always enabled, rely on the existing zod validation toast + add the inline error
4. Add red border (`border-red-500`) to the input when error is shown

**Files**: `src/pages/TalentSourcing.tsx` — add validation state, asterisk on label, inline error text, red border on input.

### Summary
- 1 centralized fix in `AppLayout.tsx` for page titles
- 1 fix in `TalentSourcing.tsx` for validation feedback
- Bug 2 already resolved, no action needed

