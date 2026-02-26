

## Comprehensive Upgrade Plan — Halevai.ai

This is a massive scope. I recommend implementing in **3 rounds** (each round = one conversation). Attempting everything at once risks exceeding output limits and producing incomplete code. Here's the full plan broken into implementable rounds.

---

### Round 1: Messaging Infrastructure + API Keys (Phases 1 & 5 partial)

**Database Migration — 3 new tables:**

1. **`api_keys`** — stores per-agency Twilio/SendGrid/Clay/GHL/Bland credentials
   - Columns: id, agency_id, key_name, key_value, connected, last_tested_at, created_at, updated_at
   - UNIQUE(agency_id, key_name)
   - RLS: agency membership for SELECT; owner/admin only for INSERT/UPDATE/DELETE (these are sensitive credentials)

2. **`message_log`** — unified log of all SMS/email/in-app messages
   - Columns: id, agency_id, channel, to_contact, subject, body, status, external_id, template, related_type, related_id, error_message, created_at
   - RLS: agency membership SELECT; owner/admin INSERT

3. **`agent_activity_log`** — recruitment agent audit trail
   - Columns: id, agency_id, agent_type, action, entity_type, entity_id, details, metadata, success, error_message, created_at
   - RLS: agency membership check
   - Enable Realtime

**New Edge Function: `send-message`**
- Accepts channel (sms/email/in_app), to, subject, body, template, related info
- Looks up agency's Twilio/SendGrid keys from api_keys
- SMS → Twilio REST API; Email → SendGrid API with branded HTML from business_config; In-App → notifications table
- Graceful degradation: if no keys, logs as 'pending' with `mock: true`
- All sends logged to message_log

**Update: `run-automations`**
- `follow_up_reminders` → calls send-message instead of just creating notifications
- `lead_scoring` (HOT leads) → sends welcome SMS via send-message
- `stale_enrollment_alerts` → sends reminder SMS/email via send-message

**Settings Page: New "Integrations" tab**
- Twilio: Account SID, Auth Token, Phone Number inputs
- SendGrid: API Key input
- Clay, GoHighLevel, Bland AI: placeholder sections
- Password-masked inputs with show/hide toggle
- Connection status indicator (green/red dot)
- "Test Connection" button per service
- "Save" button → upserts to api_keys

**New hooks in useAgencyData.ts:**
- `useApiKeys()`, `useMessageLog()`, `useSaveApiKey()`, `useTestConnection()`

**Roles:** `operations_manager` and `intake_coordinator` already partially addressed — will add to enum and update RLS for api_keys (owner/admin only)

---

### Round 2: Recruitment Agent APIs + Phone Screening (Phases 2 & 3)

**New Edge Function: `source-candidates`**
- Search mode: calls Clay API with sourcing campaign criteria, maps results to sourced_candidates, runs match scoring
- Enrich mode: enriches pending candidates via Clay
- Mock mode if no Clay key (generates 5 sample candidates)
- Logs to agent_activity_log

**New Edge Function: `trigger-outreach`**
- Creates/updates contacts in GoHighLevel
- Adds to GHL workflow based on sequence_type (caregiver_cold or poaching)
- Pre-built 5-step sequences for each type stored as constants
- Updates outreach_status, logs to agent_activity_log
- Mock mode if no GHL key

**New Edge Function: `ai-phone-screen`**
- Calls Bland AI to initiate screening call with 7-question script
- Creates phone_screens record
- Polls for completion, saves transcript
- Uses Lovable AI (Gemini) to analyze transcript → ai_summary, ai_score, ai_recommendation, screening_answers
- Auto-promotes candidates scoring ≥70 to caregivers table
- Mock mode if no Bland AI key

**Talent Sourcing Page Updates:**
- Campaigns tab: "Run Now" button → calls source-candidates; "Enrich All" button
- Candidates tab: "Queue for Outreach" bulk action with sequence type modal
- New "Agent Activity" tab: real-time feed from agent_activity_log via Supabase Realtime
- New "Outreach Sequences" tab: read-only preview of pre-built sequences
- New "Phone Screening" tab: table with call status, AI score, recommendation badges; expandable rows with transcript, summary, recording player; "Schedule Call" and "Bulk Screen" buttons

**New hooks:**
- `useAgentActivityLog()`, `usePhoneScreens()`

---

### Round 3: Notifications, Dashboard, Chat, Automations (Phases 4, 6, 7, 8)

**Real-time Notifications:**
- Enable Realtime on notifications, activity_log, agent_activity_log
- Notification bell in app header: Supabase Realtime subscription, unread badge count, dropdown panel with type-based icons, "Mark All Read", click-to-navigate

**Dashboard Enhancements:**
- New "Messaging Stats" card: messages sent this week, SMS/email breakdown, failed count
- Wire recruitment agent stats to live queries (sourced this week, outreach sent, screens done, auto-promoted)
- Integration status indicator row: Twilio/SendGrid/Clay/GHL/Bland AI connection icons

**Halevai Chat Context Expansion:**
- Add to existing context queries: sourcing_campaigns stats, sourced_candidates by outreach_status, phone_screens stats (last 7 days), agent_activity_log (last 5), api_keys connected status, message_log stats by channel
- Update system prompt to reference recruitment and messaging data

**Automation Engine Expansion:**
- Insert 9 new automation configs per agency: auto_welcome_sms, auto_followup_sms, process_sequences, auto_source_candidates, auto_outreach_high_match, auto_screen_responded, auto_review_request, background_check_reminder, auth_expiry_alert
- Extend run-automations to handle all new keys, calling send-message/source-candidates/trigger-outreach/ai-phone-screen as appropriate
- Automations page: group by category (Messaging, Recruitment, Enrollment, Reviews, Intelligence)

---

### Technical Details

**Security considerations:**
- api_keys table stores credentials in plaintext (Supabase encrypts at rest). RLS restricts to owner/admin only — viewers and other roles cannot see API keys
- All edge functions validate auth headers before accessing agency data
- External API calls wrapped in try/catch with error logging

**Existing code impact:**
- No existing tables modified
- `run-automations` edge function extended (not replaced)
- `halevai-chat` edge function extended (not replaced)
- Settings page gets new tab (existing tabs untouched)
- TalentSourcing page gets new tabs and buttons (existing functionality preserved)
- Dashboard gets new cards (existing cards preserved)
- `useAgencyData.ts` gets new hooks appended (existing hooks untouched)

**Pattern compliance:**
- All new tables use agency_id + RLS pattern
- Edge functions use verify_jwt = false + manual auth
- Lovable AI Gateway for AI analysis (phone screen transcript)
- TanStack React Query for all data fetching
- Dark theme with existing design system classes

---

### Recommended Implementation Order

**Start with Round 1** (this session) — it unblocks everything else since send-message and api_keys are dependencies for Rounds 2 and 3.

Shall I proceed with Round 1 implementation?

