

## Three changes requested

### 1. Auth.tsx logo fix (line 12)
Change `care-at-home-logo.png` to `halevai-logo.png`. Straightforward.

### 2. useAuth.tsx `.single()` → `.maybeSingle()` (line 60)
Prevents crash when a user has no `agency_members` row yet (e.g., during onboarding before the agency is created). Straightforward.

### 3. Onboarding.tsx — save to database on completion
The user provided a full replacement, but the pasted JSX got stripped by their editor. The intent is clear: wire up `handleComplete` to persist onboarding data. However, the user's code has several bugs that need fixing before implementation:

**Issues in the provided code that I will correct:**

| Issue | Fix |
|---|---|
| `onboarding` table has no `data` column — it has individual columns (`agency_name`, `states`, `program_types`, `primary_goal`, etc.) | Map form fields to the actual columns |
| `profiles` table has no `onboarded` column | Skip that update (or add a migration to add the column if desired) |
| `profiles.update().eq("id", ...)` — the profiles table keys on `user_id`, not `id` | Use `.eq("user_id", currentUser.id)` |
| `Record` without type params is invalid TypeScript | Use proper typing |
| `primary_state` set to `form.states` (an array) but column expects `text` | Use `form.states[0]` |

**Implementation plan:**

1. **`src/pages/Auth.tsx`** — Change import on line 12
2. **`src/hooks/useAuth.tsx`** — Change `.single()` to `.maybeSingle()` on line 60
3. **`src/pages/Onboarding.tsx`** — Add `handleComplete` function that:
   - Gets current user via `supabase.auth.getUser()`
   - Looks up `agency_members` to get `agency_id`
   - Updates `agencies` table with name, states, phone, primary_state
   - Upserts `business_config` with agency branding
   - Inserts into `onboarding` table using the correct individual columns
   - Navigates to `/dashboard`
   - Shows error toast on failure
   - The "Go to Dashboard" button calls `handleComplete` instead of just navigating
4. **Database migration** — Add `onboarded` boolean column to `profiles` table (so we can track completion), then update it in the handler

### Technical details

The `onboarding` table insert will use these column mappings:
- `agency_name` ← `form.agencyName`
- `states` ← `form.states`
- `program_types` ← `form.programTypes`
- `primary_goal` ← `form.primaryGoal`
- `budget_tier` ← `form.budgetTier`
- `monthly_caregiver_target` ← `form.caregiverTarget`
- `monthly_patient_target` ← `form.patientTarget`
- `unique_selling_points` ← `form.usps`
- `completed` ← `true`
- `completed_at` ← `new Date().toISOString()`
- `current_step` ← `6`

New imports needed in Onboarding.tsx: `supabase`, `toast` (from sonner), `useAuth`.

