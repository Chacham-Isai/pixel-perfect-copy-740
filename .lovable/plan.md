

## Fix: Browser Tab Title Bug (Root Cause Confirmed)

The user's uploaded document correctly identifies the root cause. `AppLayout` is not a shared wrapper — each page renders its own `<AppLayout>`, so on navigation the old instance unmounts and a new one mounts, causing the `useLayoutEffect` title update to fire with stale timing.

### Step 1: Create `src/components/PageTitleManager.tsx`
A renderless component placed once inside `<BrowserRouter>` in `App.tsx`. Contains the `PAGE_TITLES` map and a `useEffect` on `location.pathname` that sets `document.title`. Mounts once, never unmounts, reacts instantly to route changes.

### Step 2: Add `<PageTitleManager />` to `App.tsx`
Place it as a direct child of `<BrowserRouter>`, before `<Routes>`.

### Step 3: Clean up `AppLayout.tsx`
- Remove `PAGE_TITLES` constant (lines 40-60)
- Remove `useLayoutEffect` title block (lines 81-86)
- Remove `useLayoutEffect` from the import on line 1

### Step 4: Delete `src/hooks/usePageTitle.ts`
Dead code — no longer imported anywhere.

**Files changed:**
- `src/components/PageTitleManager.tsx` (new)
- `src/App.tsx` (add import + component)
- `src/components/AppLayout.tsx` (remove title logic)
- `src/hooks/usePageTitle.ts` (delete)

