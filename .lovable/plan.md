

# Halevai.ai Phase 2 Mega Upgrade — Implementation Plan

This is a very large scope covering 5 major sections. Following the prompt's recommended implementation order, here's the plan broken into deployable rounds.

---

## Round 1: UX Polish & Foundation (Section 5)

### Database Changes
- Add columns to `campaigns`: `external_id`, `external_url`, `posted_at`, `platform_status`, `last_synced_at`
- Add columns to `business_config`: `hide_halevai_branding`, `custom_domain`, `email_from_name`, `email_reply_to`

### New Files
- `src/lib/permissions.ts` — Role permission matrix with `hasPermission(role, action)` function
- `src/lib/formatters.ts` — Shared utilities: `normalizePhone()`, `formatPhone()`, `formatCurrency()`, `formatTimeAgo()`
- `src/hooks/usePageTitle.ts` — Sets `document.title` per page

### Modified Files (UX fixes across all pages)
- **Every data page** — Add proper loading skeletons (matching content shape), empty states with icon + headline + CTA button, and error states with retry
- **All forms** — Add Zod validation, red asterisks on required fields, disable submit buttons during mutations
- **Caregiver add dialog** — Add duplicate phone/email detection warning
- **Destructive actions** — Add AlertDialog confirmations for deletes
- **Search inputs** — Add 300ms debounce (Caregivers, Campaigns, Inbox)
- **Caregivers kanban** — Add status transition validation (prevent invalid moves)
- **Toast consistency** — Standardize all toast messages

### Pages to audit for empty/loading/error states:
Dashboard, Caregivers, Campaigns (all 8 tabs), Landing Pages, Content Calendar, Ad Creatives, Talent Sourcing (5 tabs), Competitors, Reviews, Recommendations, Enrollment, Automations, Briefing, Playbooks

---

## Round 2: Inbound Webhooks & Inbox (Section 1)

### Database Changes (migration)
- Create `inbound_messages` table with agency_id, channel, from_contact, to_contact, subject, body, external_id, caregiver_id, sourced_candidate_id, matched, read, metadata, created_at
- Create `conversation_threads` table with agency_id, contact_phone, contact_email, contact_name, caregiver_id, sourced_candidate_id, channel, last_message_at, last_message_preview, unread_count, status, created_at
- RLS policies for both tables
- Enable Supabase Realtime on `inbound_messages`

### New Edge Function
- `webhook-inbound` — Public endpoint accepting Twilio SMS webhooks and SendGrid Inbound Parse webhooks. Detects channel, matches to agency via `api_keys`, matches to caregiver/candidate, inserts to `inbound_messages`, creates notification, auto-detects keywords (YES/STOP/UNSUBSCRIBE), updates conversation threads

### New Page
- `src/pages/Inbox.tsx` — Two-panel messaging inbox (thread list + conversation view) with real-time updates, compose bar, channel toggle, contact info, and "Link to Caregiver" for unmatched contacts

### Modified Files
- `src/App.tsx` — Add `/inbox` route
- `src/components/AppSidebar.tsx` — Add "Inbox" nav item under CORE with unread badge
- `src/hooks/useAgencyData.ts` — Add `useInboundMessages()`, `useConversationThreads()`, `useThreadMessages()`, `useUnreadCount()` hooks
- `src/pages/Caregivers.tsx` — Add "Messages" section in caregiver detail sheet
- `src/components/IntegrationsTab.tsx` — Add webhook URL display + copy button for Twilio and SendGrid setup
- `supabase/config.toml` — Add `webhook-inbound` function config

---

## Round 3: Advanced Sequence Branching (Section 2)

### Database Changes
- Add columns to `sequence_steps`: `step_type`, `condition_type`, `condition_value`, `true_next_step_id`, `false_next_step_id`, `action_type`, `action_config`

### Modified Edge Function
- `run-automations` — Update sequence processing to handle condition nodes (check replied/no_reply/keyword_match/status_changed/score thresholds), action nodes (update_status, create_notification, enroll/remove from sequence, update_score), and wait nodes

### New Component
- `src/components/SequenceBuilder.tsx` — Visual flow builder with canvas area showing connected nodes (message/condition/action/wait), editor side panel, toolbar with node type buttons + AI Generate, and 3 pre-built smart sequence templates (Smart Nurture, Hot Lead Fast Track, Competitor Poach)

### Modified Files
- `src/pages/Campaigns.tsx` — Replace SequencesTab inline editor with new SequenceBuilder
- `src/pages/TalentSourcing.tsx` — Same SequenceBuilder in Sequences tab
- `src/hooks/useAgencyData.ts` — Add `useSequenceStepsByFlow()` and `useSaveSequenceFlow()` hooks

---

## Round 4: White-Label & Expanded Roles (Section 4)

### Database Changes
- Add `operations_manager`, `intake_coordinator` values to `agency_role` enum (note: `viewer` already exists based on code)
- Update RLS policies to enforce role-based write restrictions

### Modified Files
- `src/lib/permissions.ts` — Already created in Round 1, now fully enforced
- `src/hooks/useAuth.tsx` — Expose full `agencyRole` for permission checks
- `src/components/TeamMembers.tsx` — Upgrade: avatar/initials, role badges, invite flow with email + role select, role editing (owner only), member removal with confirmation, transfer ownership
- `src/components/IntegrationsTab.tsx` — Hide for non-admin roles
- `src/pages/Settings.tsx` — Add branding fields (hide_halevai_branding toggle, email_from_name, email_reply_to, custom_domain)
- `src/pages/PublicLandingPage.tsx` — Verify full white-label: agency colors, logo, name throughout; conditionally hide "Built with Halevai.ai"
- All pages with write actions — Wrap in permission checks, show "View Only" badge for viewer role

---

## Round 5: Ad Platform API Integration (Section 3)

### Modified Files
- `src/components/IntegrationsTab.tsx` — Add Facebook, Google Ads, Indeed API key fields
- `supabase/functions/post-to-ads/index.ts` — Upgrade to use per-agency `api_keys` table for Facebook/Google/Indeed credentials (instead of env vars), implement real Facebook Marketing API posting, Google Ads REST API posting, Indeed Sponsored Jobs API
- `src/pages/Campaigns.tsx` — Add platform status indicators on campaign cards, "Post Now" button, "View on Platform" link, "Sync Stats" button
- `src/pages/CampaignBuilder.tsx` — Add "Create & Post" button in Step 4 with per-platform result indicators

---

## Technical Notes

- All new tables use `agency_id` column with standard RLS pattern
- No new npm dependencies needed (uses existing @dnd-kit, shadcn/ui, lucide-react)
- Edge functions follow existing pattern: Deno, `verify_jwt = false`, service_role_key for DB writes
- All hooks follow existing `useAgencyQuery` pattern in `useAgencyData.ts`
- Design system unchanged: dark theme, cyan primary, purple accent, Space Grotesk + IBM Plex Mono

Each round is independently deployable. Approve to begin with Round 1 (UX Polish).

