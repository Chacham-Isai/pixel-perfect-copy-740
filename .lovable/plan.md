

## Plan: Database Migration + Seed Data + UI Bug Fixes

### Task 1: Run `handle_new_user()` migration

Execute the provided SQL migration to replace `handle_new_user()` with the version that auto-creates `agencies`, `agency_members`, `business_config`, and `automation_configs` rows. Also includes the backfill for existing users. The SQL is correct as-provided and will be run via the migration tool.

**One fix needed**: The `agencies` table requires a `slug` column (NOT NULL). The migration must generate a slug from the agency name (e.g., `lower(replace(v_agency_name, ' ', '-'))`).

### Task 2: Run seed data (with corrections)

The provided seed SQL has several schema mismatches that must be fixed before running:

1. **`growth_playbooks`**: Table has columns `name`, `estimated_results`, `best_for`, `active` — NOT `title`, `estimated_impact`, `priority`, `status`. Fix column names in the INSERT.

2. **`sequences`**: Table is actually `campaign_sequences` with columns: `name`, `trigger_type`, `active`, `target_state`, `target_language`, `agency_id`. It does NOT have `description`, `category`, or `status` columns. Fix accordingly.

3. **`sequence_steps`**: Requires `agency_id` (NOT NULL), uses `channel` not nullable, and `delay_hours` not `delay_hours` as integer. Does not have a `step_type` column — uses `action_type` instead. Also doesn't have a standalone `step_type` of `'condition'` — conditions use `condition_type` and `condition_value`. Fix column mapping.

The corrected seed SQL will be run via the migration tool.

### Task 3: UI Bug Fixes (7 items)

**Bug 1 — Page title off-by-one**: The `usePageTitle` hook is fine — it uses `useEffect` with `[title]` dependency. The real issue is likely the cleanup function resetting the title to "Halevai.ai" during route transitions, which briefly shows the wrong title. Fix: Remove the cleanup return, and instead just set the title. Each page calls `usePageTitle` which will override.

**Bug 2 — Recommendations Approved empty state**: In `src/pages/Recommendations.tsx`, the Approved `TabsContent` (around line 98) has no empty state. Add an empty state block with `CheckCircle` icon + message when `all.filter(r => r.status === "approved").length === 0`.

**Bug 3 — Playbooks empty state**: In `src/pages/Playbooks.tsx` line 105, replace the plain text `<p>` with a rich empty state using `BookOpen` icon + heading + description, matching other pages' patterns.

**Bug 4 — Briefing save feedback**: In `src/pages/Briefing.tsx`, the `handleGenerateBriefing` function already has a toast on line 50 (`toast.success("Briefing generated and saved!")`). Verify it's actually firing — likely the edge function is erroring silently. The button already shows a spinner via `generating` state. This may already work; will verify and ensure error handling surfaces.

**Bug 5 — Campaign Builder validation**: In `src/pages/CampaignBuilder.tsx` line 390, the Next button is already disabled when `selectedPlatforms.length === 0` on step 0. But clicking it should also toast. Add validation: step 0 → toast if no platforms; step 1 → validate campaign name before proceeding.

**Bug 6 — Talent Sourcing validation**: In `src/pages/TalentSourcing.tsx` line 96-110, the `handleCreate` already validates via `sourcingCampaignSchema`. The schema requires `name` min 2 chars. This should already show a toast error. Verify the form name field maps correctly.

**Bug 7 — Caregivers add button for view-only**: In `src/pages/Caregivers.tsx` line 260, `canEdit` already gates the Add Caregiver button via conditional rendering. If `!canEdit`, the button isn't shown at all. But there's no else branch. Add an else: show the button disabled with a tooltip "You don't have permission to add caregivers."

### Files to modify:
- `src/hooks/usePageTitle.ts` — Remove cleanup function
- `src/pages/Recommendations.tsx` — Add approved tab empty state
- `src/pages/Playbooks.tsx` — Rich empty state
- `src/pages/CampaignBuilder.tsx` — Add step validation toasts
- `src/pages/Caregivers.tsx` — Add disabled button with tooltip for view-only users
- Database migration for `handle_new_user()` + corrected seed data

