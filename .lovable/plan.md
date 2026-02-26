

# Halevai Phase 3: Production-Ready Polish

This document covers 7 major workstreams from the uploaded Phase 3 prompt. Given the scope, I recommend tackling them in priority order across multiple implementation rounds.

---

## Section 1: Cron Trigger Edge Function (Highest Priority)

Lovable Cloud does not expose pg_cron directly. We will use the fallback approach:

- **Create `supabase/functions/cron-trigger/index.ts`** — a dispatcher edge function that accepts `?job=automations|briefing|sequences|scoring` with `x-cron-secret` header verification
- **Add config.toml entry** for `cron-trigger`
- **Add "Automation Schedule" card** to the top of `/automations` page showing the 4 scheduled jobs, their recommended cadence, last run timestamp (from `agent_activity_log`), and a setup guide with the cron URLs for external services like cron-job.org

## Section 2: White-Label Completion

- **PublicLandingPage.tsx audit** — replace any hardcoded Halevai branding with dynamic `business_config` values (logo, colors, phone, footer, meta tags)
- **send-message edge function** — update email HTML template to pull agency branding from `business_config`
- **Settings → Branding tab** — verify/add all fields (logo upload, colors, tagline, social URLs, email sender name, hide branding toggle) with live preview card

## Section 3: Sequence Builder Visual Polish

- **Node styling** — color-coded borders (cyan=message, purple=condition, amber=action, gray=wait) with appropriate lucide icons
- **Node editor panel** — side panel/modal with channel select, merge fields, condition config, action config
- **Toolbar** — add node buttons, AI Generate, templates dropdown, save/activate/pause/delete
- **Integration** — verify builder opens from Campaigns → Sequences and Talent Sourcing → Sequences

## Section 4: Ad Metrics Sync

- **New edge function `sync-ad-metrics/index.ts`** — pulls Facebook/Google Ads metrics back into `campaigns` table
- **UI sync button** on campaign cards with `external_id`
- **Add `sync-ads` case** to cron-trigger
- **Performance tab** — "Last Synced" indicator and "Sync All" button

## Section 5: UX Hardening (Large Scope)

- **5A: Loading states audit** — verify `states.tsx` skeletons on all 15+ pages
- **5B: Empty states audit** — meaningful empty states with CTAs on every data section
- **5C: Form validation** — Zod inline errors, required asterisks, submit button states, destructive action confirmations via AlertDialog
- **5D: Breadcrumbs** — add to caregiver detail, campaign builder, landing page detail, sequence builder, settings sub-tabs
- **5E: Responsive/mobile** — table card layouts, kanban scroll, touch targets
- **5F: Formatters audit** — ensure `formatters.ts` utilities used consistently
- **5G: Pagination** — add `.range()` pagination to caregivers, message_log, inbound_messages, sourced_candidates
- **5H: Optimistic updates** — automation toggle, kanban drag, notification read, inbox read
- **5I: Command palette** — wire `Cmd+K` to `command.tsx` with cross-entity search in `AppLayout.tsx`

## Section 6: Halevai Chat Context

- **Add missing context queries** to `halevai-chat/index.ts`: `conversation_threads` unread count, `inbound_messages` recent replies, `sequence_enrollments` active/completion stats
- **Update system prompt** with these new data sections

## Section 7: Dashboard Polish

- **Integration status row** — small icons with green/gray dots from `api_keys`, click navigates to Settings, gated by `manage_api_keys` permission
- **Verify live data wiring** — funnel, KPI cards, recruitment agent stats, activity feed all pulling real data
- **Quick launch actions** — verify all 6 buttons work and navigate correctly

---

## Recommended Implementation Order

Given this is too large for a single pass, I recommend splitting into rounds:

1. **Round 1:** Section 1 (cron-trigger) + Section 7 (dashboard polish) + Section 6 (chat context)
2. **Round 2:** Section 5A-5C (loading/empty/validation) + Section 5I (command palette)
3. **Round 3:** Section 2 (white-label) + Section 3 (sequence builder)
4. **Round 4:** Section 5D-5H (breadcrumbs, mobile, pagination, optimistic) + Section 4 (ad sync)

Which round should I start with, or would you like me to begin with Round 1?

