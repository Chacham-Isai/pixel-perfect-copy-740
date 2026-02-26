# Halevai.ai — Project Handoff Document

> **Last Updated:** 2026-02-26
> **Live URL:** https://halevai.lovable.app
> **Preview URL:** https://id-preview--55444805-7741-45de-a724-d19bffc88aa1.lovable.app

---

## 1. What Is Halevai?

Halevai.ai is a **full-stack AI-powered marketing & recruitment automation platform** for home care agencies. It manages the entire caregiver acquisition funnel — from sourcing candidates, running multi-platform ad campaigns, generating landing pages, tracking enrollment, to AI-driven strategic recommendations.

The name "Halevai" (הלוואי) is Hebrew for "if only" / "hopefully" — reflecting the aspiration to make caregiver recruitment effortless.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui components |
| **State** | TanStack React Query v5 |
| **Routing** | React Router v6 |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Backend** | Lovable Cloud (Supabase under the hood) |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth (email/password) |
| **Edge Functions** | Deno (Supabase Edge Functions) — 15 deployed |
| **AI Models** | Google Gemini 3 Flash Preview (text), Gemini 2.5 Flash Image (images) via Lovable AI Gateway |
| **Web Scraping** | Firecrawl (connected via Lovable connector) |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Forms** | React Hook Form + Zod validation |
| **Scheduling** | pg_cron + pg_net (automated daily jobs) |

### Design System

- **Theme:** Dark-first (no light mode). Navy/cyan/purple palette.
- **Fonts:** Space Grotesk (headings), IBM Plex Mono (data labels)
- **CSS Variables (HSL):**
  - `--primary: 195 100% 50%` (cyan)
  - `--accent: 270 80% 60%` (purple)
  - `--background: 225 25% 6%` (deep navy)
  - `--card: 225 25% 9%`
  - `--border: 225 20% 16%`
- **Custom classes:** `halevai-bg-gradient`, `halevai-glow`, `halevai-text`, `halevai-border`

---

## 3. Database Schema (30+ Tables)

### Core Agency Tables
| Table | Purpose |
|-------|---------|
| `agencies` | Multi-tenant root. Has `name`, `slug`, `states[]`, `logo_url` |
| `agency_members` | User ↔ Agency mapping with `role` enum (`owner`/`admin`) |
| `profiles` | Extended user info (`full_name`, `email`, `avatar_url`) |
| `business_config` | Branding: colors, logo, tagline, social URLs. One per agency |
| `onboarding` | Onboarding wizard state & AI strategy output |
| `locations` | Office locations with service counties |
| `notifications` | In-app notification queue (realtime enabled) |

### Caregiver Pipeline
| Table | Purpose |
|-------|---------|
| `caregivers` | **Main CRM table.** 50+ columns: lead info, patient info, UTM tracking, enrollment status, scoring |
| `caregiver_activities` | Activity log per caregiver (calls, emails, status changes) |

### Marketing & Campaigns
| Table | Purpose |
|-------|---------|
| `campaigns` | All campaign types. Has `campaign_type` enum: `recruitment`/`marketing`/`social`/`community`. Tracks spend, clicks, conversions, CPA |
| `content_posts` | Social media posts with `platform`, `scheduled_date`, `hashtags[]`, AI generation flag |
| `landing_pages` | Full structured pages: hero, benefits (jsonb), testimonials (jsonb), FAQ (jsonb), slug for public URL |
| `landing_page_events` | Analytics: `page_view`/`form_start`/`form_submit` with UTM params |
| `ad_creatives` | Generated ad images + copy. Linked to campaigns |
| `saved_campaign_templates` | Reusable campaign content with tags, performance rating |
| `campaign_packages` | Multi-platform ad packages with UTM params and tracking URLs |
| `referral_sources` | AI-discovered marketing channels (churches, Facebook groups, etc.) |

### Sequences (Automated Outreach)
| Table | Purpose |
|-------|---------|
| `campaign_sequences` | Multi-step automated messaging sequences |
| `sequence_steps` | Individual steps: channel (sms/email), delay, subject, body |
| `sequence_enrollments` | Caregivers enrolled in sequences with progress tracking |

### Talent Sourcing
| Table | Purpose |
|-------|---------|
| `sourcing_campaigns` | Automated candidate discovery campaigns |
| `sourced_candidates` | Candidates found, with match scores, enrichment status, outreach status |
| `phone_screens` | AI phone screening results with transcripts and scoring |

### Intelligence
| Table | Purpose |
|-------|---------|
| `competitors` | Competitor tracking: pay rates, ratings, spend estimates |
| `reviews` | Agency reviews from Google, Indeed, etc. with AI response drafting |
| `review_requests` | Review solicitation tracking (sent → clicked → completed) |
| `pay_rate_intel` | AI-analyzed competitive pay rates, Medicaid reimbursement ceilings, recommended rates by state/county |

### AI & Strategy
| Table | Purpose |
|-------|---------|
| `halevai_conversations` | Chat conversation threads |
| `halevai_messages` | Individual messages (user/assistant roles) |
| `halevai_recommendations` | AI-generated action items with priority, status, impact estimates |
| `growth_playbooks` | Pre-built marketing playbook templates (10+ seeded) |
| `daily_briefings` | Daily performance summaries (jsonb content) |
| `activity_log` | System-wide audit trail |
| `automation_configs` | Toggle-able automation rules |

### Messaging & Integrations
| Table | Purpose |
|-------|---------|
| `api_keys` | Per-agency integration credentials (Twilio, SendGrid, Clay, GHL, Bland AI). Encrypted key storage with connection status |
| `message_log` | Full message audit trail: channel (sms/email/in_app), status, external_id, template, related entities |
| `agent_activity_log` | AI agent execution log: action, agent_type, success/error, entity references |

### RLS Pattern
All tables use Row Level Security. Standard pattern:
```sql
agency_id IN (
  SELECT agency_id FROM agency_members
  WHERE user_id = auth.uid()
)
```
Exceptions:
- `landing_page_events` allows public INSERT (for anonymous page view tracking) with field validation
- `agencies` INSERT scoped to `TO authenticated` role only (for onboarding)
- `growth_playbooks` allows SELECT when `agency_id IS NULL` (shared system templates)
- `api_keys` restricted to owner/admin roles only
- `message_log` INSERT restricted to owner/admin; SELECT for all members

### Key Enums
- `lead_status`: new → contacted → intake_started → enrollment_pending → authorized → active → inactive → rejected
- `lead_source`: landing_page, facebook, google, indeed, referral, walk_in, other
- `campaign_type`: recruitment, marketing, social, community
- `agency_role`: owner, admin

---

## 4. Edge Functions (15 Deployed)

All use `verify_jwt = false` in config.toml with manual auth validation inside the function.

### `halevai-chat`
- **Purpose:** Conversational AI assistant with full agency context
- **Model:** `google/gemini-3-flash-preview`
- **Context:** Loads agency data, caregivers, campaigns, competitors, reviews, recommendations
- **Features:** Tool-calling for structured actions, conversation persistence

### `campaign-optimizer`
- **Purpose:** Multi-mode marketing brain
- **Modes:**
  - `template` — Platform-specific ad copy generation
  - `optimization` — Campaign performance analysis & recommendations
  - `initial_strategy` — Full marketing strategy from onboarding data
  - `full_package` — Campaign Builder Step 3: generates per-platform content (headlines, descriptions, CTAs, UTM params, keywords)
  - `playbook_execution` — Executes growth playbooks, creates campaigns & recommendations
- **Model:** `google/gemini-3-flash-preview` with tool-calling

### `generate-content`
- **Purpose:** Social media content generation
- **Output:** Structured posts with title, body, hashtags, image_prompt, platform-specific formatting
- **Model:** `google/gemini-3-flash-preview`

### `generate-landing-content`
- **Purpose:** Landing page AI generation
- **Output:** Hero section, benefits array, testimonials, FAQ, pay rate highlight, meta tags
- **Customization:** State/county/language specific

### `generate-creative`
- **Purpose:** Ad image + copy generation
- **Step 1:** Generate ad copy via `gemini-3-flash-preview` (tool-calling)
- **Step 2:** Generate image via `gemini-2.5-flash-image`
- **Step 3:** Upload to `ad-creatives` storage bucket
- **Output:** headline, body_copy, image_url

### `discover-sources`
- **Purpose:** AI-powered referral source discovery
- **Output:** Relevant marketing channels (Facebook groups, churches, cultural centers) for agency's markets
- **Model:** `google/gemini-3-flash-preview`

### `post-to-ads`
- **Purpose:** Multi-platform posting infrastructure
- **Current:** Returns manual posting instructions with pre-formatted content
- **Future:** Direct API integration with ad platforms

### `score-leads`
- **Purpose:** AI-powered lead scoring for caregivers
- **Logic:** Weighted scoring based on contact info, caregiving experience, Medicaid status, recency
- **Output:** `lead_score` (0-100), `lead_tier` (HOT/WARM/COLD)

### `analyze-pay-rates`
- **Purpose:** AI + web scraping competitive pay rate analysis
- **Integration:** Firecrawl for web scraping competitor job postings & Medicaid rates
- **Model:** `google/gemini-2.5-flash` for analysis
- **Output:** Recommended rate, market min/avg/max, Medicaid reimbursement ceiling, analysis summary
- **Storage:** Results saved to `pay_rate_intel` table

### `run-automations`
- **Purpose:** Execute all active automation rules for an agency
- **Automations (27 supported keys):**
  - `lead_scoring` — Re-score unscored caregivers
  - `follow_up_reminders` — Flag stale contacts (3+ days), create notifications
  - `performance_alerts` — Campaign spend threshold alerts
  - `stale_enrollment_alerts` — Enrollment stuck >14 days alerts
  - `auto_welcome_sms` — Automated welcome message on new caregiver
  - `auto_source_candidates` — Trigger candidate sourcing
  - `auto_outreach_high_match` — Auto-outreach for high match scores
  - `auto_screen_responded` — Auto-screen candidates who responded
  - `auto_review_request` — Automated review solicitation
  - `background_check_reminder` — Background check follow-up
  - `auth_expiry_alert` — Authorization expiry warnings
  - Plus 16 more keys for comprehensive automation coverage
- **Multi-agency:** Supports `agencyId: "all"` for cron-triggered batch processing
- **Error isolation:** Each automation runs independently; failures don't block others

### `generate-briefing`
- **Purpose:** Generate daily performance briefing for an agency
- **Output:** Pipeline stats, campaign performance, action items, wins
- **Multi-agency:** Supports `agencyId: "all"` for cron-triggered batch processing
- **Deduplication:** Skips if briefing already exists for today

### `send-message`
- **Purpose:** Unified messaging gateway for SMS, email, and in-app notifications
- **Channels:**
  - `sms` — Via Twilio (account SID, auth token, phone number from `api_keys`)
  - `email` — Via SendGrid with branded HTML templates (business_config branding)
  - `in_app` — Direct insert into `notifications` table
- **Features:** Branded email HTML builder, message logging to `message_log`, graceful fallback when provider not configured (mock mode)
- **Output:** `{ success, message_id, status, mock, error }`

### `source-candidates`
- **Purpose:** AI-powered candidate sourcing and enrichment
- **Integration:** Uses Clay API for candidate discovery
- **Output:** Enriched candidate profiles saved to `sourced_candidates`

### `trigger-outreach`
- **Purpose:** Push candidates into outreach workflows
- **Integration:** GoHighLevel (GHL) API for automated sequences
- **Output:** Updated outreach status on candidates

### `ai-phone-screen`
- **Purpose:** AI-powered phone screening via Bland AI
- **Features:** Automated screening calls, transcript capture, AI scoring
- **Output:** Phone screen results with `ai_score`, `ai_summary`, `ai_recommendation`

---

## 5. Scheduled Jobs (pg_cron)

| Job | Schedule | Function | Description |
|-----|----------|----------|-------------|
| `run-automations-daily` | `0 7 * * *` (7:00 AM UTC) | `run-automations` | Processes all agencies' active automations |
| `generate-briefing-daily` | `5 7 * * *` (7:05 AM UTC) | `generate-briefing` | Generates daily briefings for all agencies |

Both jobs use `pg_net` HTTP POST to invoke edge functions with `agencyId: "all"`.

---

## 6. Application Pages & Wireframes

### Navigation Structure (Sidebar)

```
CORE
├── Dashboard (/dashboard)
├── Halevai AI (/halevai)
├── Recommendations (/recommendations)
├── Playbooks (/playbooks)
└── Daily Briefing (/briefing)

PIPELINE
├── Caregivers (/caregivers)
├── Enrollment Tracker (/enrollment)
├── Campaigns (/campaigns)
├── Campaign Builder (/campaign-builder)
├── Landing Pages (/landing-pages)
├── Content Calendar (/content)
└── Ad Creatives (/creatives)

RECRUITMENT AGENTS
└── Talent Sourcing (/talent-sourcing)

INTEL
├── Competitors (/competitors)
└── Reviews (/reviews)

SYSTEM
├── Automations (/automations)
└── Settings (/settings)
```

### Page Details

#### Dashboard (`/dashboard`)
- Greeting banner with pipeline & spend summary
- Caregiver funnel visualization (New → Contacted → Intake → Enrollment → Authorized → Active)
- KPI cards: Total Spend, New This Week, **Recommended Rate** (from pay rate intel), Enrollment Rate
- Quick Launch grid (6 actions: Add Caregiver, New Campaign, Source Candidates, Ask Halevai, View Pipeline, Daily Briefing)
- Recruitment Agents stats panel (Sourced, Outreach Sent, Responded, Promoted)
- Recent Activity feed

#### Halevai AI Chat (`/halevai`)
- Multi-conversation sidebar
- Streaming AI responses with markdown rendering
- Full agency context injection
- Conversation persistence

#### Campaigns (`/campaigns`) — 8-Tab Hub
1. **Recruitment** — Card grid, inline metric editing, AI Optimize button
2. **Marketing** — Same layout for marketing campaigns
3. **Social** — Social campaign cards
4. **Community** — Event-style community campaign cards
5. **Sources** — Referral sources table + "Discover Sources" AI button
6. **Performance** — Recharts dashboard: spend by channel (bar), CPA trend (line), conversions (pie), date range selector
7. **Templates** — Saved campaign template grid with search/filter
8. **Sequences** — Inline step editor, AI step generation, enrollment tracking

#### Campaign Builder (`/campaign-builder`) — 4-Step Wizard
1. **Select Platforms** — 16+ platform cards (Indeed, ZipRecruiter, Care.com, Facebook, Instagram, Google Ads, etc.), multi-select
2. **Campaign Details** — Full form: name, type, states, counties, language, budget, dates, target CPA, auto-pause threshold
3. **AI Generation** — Calls `campaign-optimizer` in `full_package` mode, collapsible per-platform results, inline editing
4. **Review & Launch** — Summary view, Create Campaign / Save Draft / Download Package buttons

#### Ad Creatives (`/creatives`)
- Creative card grid with image previews
- Generate modal: prompt input, auto-prompt, platform size selector
- A/B comparison mode (select 2 creatives for side-by-side)
- Download and delete actions

#### Content Calendar (`/content`)
- Calendar view (month grid) + List view toggle
- Generate modal: platform multi-select, topic, state, language, count
- Bulk actions in list view: multi-select → schedule/publish/delete
- Post detail cards with status badges

#### Landing Pages (`/landing-pages`)
- Page card grid with views/submissions stats
- AI builder modal (title, state, county, language → generates full page)
- Per-page analytics panel: views over time chart, UTM source/medium breakdown
- Publish/unpublish toggle, copy public URL
- **Public route:** `/lp/:slug` renders full landing page with:
  - Hero section with pay rate badge
  - Benefits grid
  - Testimonials
  - Application form (creates caregiver lead)
  - FAQ accordion
  - Agency footer
  - Automatic `landing_page_events` tracking

#### Competitors (`/competitors`)
- **Pay Rate Intelligence panel** — AI-recommended rate, Medicaid ceiling, market range, competitor count, margin analysis
- "Analyze Pay Rates" button → triggers `analyze-pay-rates` edge function (Firecrawl + AI)
- Competitor tracker table: name, state, rating, reviews, pay range, est. spend, threat level

#### Reviews (`/reviews`)
- Review cards with star ratings
- Solicitation tab: select caregivers → send review requests
- AI response drafting for each review
- Dashboard: rating distribution chart, response rate stats

#### Recommendations (`/recommendations`)
- Pending/Approved tabs
- One-click "Approve & Launch" (creates campaign from recommendation)
- Dismiss with reason selection
- Campaign Packages tab with Overview/Tracking/Launch Guide detail view

#### Playbooks (`/playbooks`)
- 10 pre-built playbook cards with category filtering
- Search functionality
- Execute button → calls `campaign-optimizer` in `playbook_execution` mode
- Execution result dialog showing created campaigns & recommendations
- Categories: recruitment, marketing, community, competitive, retention, operations

#### Enrollment Tracker (`/enrollment`)
- Pipeline stages with counts
- Advance caregivers through stages
- Background check status dropdown
- Edit dialog for patient/representative details
- Stuck enrollment alerts (>30 days)

#### Talent Sourcing (`/talent-sourcing`)
- 5 tabs: Campaigns, Candidates, Agent Activity, Sequences, Phone Screening
- Sourcing campaign management (create, toggle active/paused)
- Candidate cards with match scores
- Outreach status tracking
- "Promote to Pipeline" action (creates caregiver from candidate)
- AI phone screening with transcript and scoring display

#### Caregivers (`/caregivers`)
- Kanban-style pipeline view by status (New, Contacted, Intake Started, Enrollment Pending, Authorized, Active)
- Search + filters (state, county, tier, source)
- Add Caregiver dialog
- Export CSV
- Detail sheet with: contact info, lead score/tier, patient info, enrollment timeline, **Suggested Offer Rate** (from pay rate intel), activity log
- Drag cards between columns to update status
- Compose SMS/Email dialog with message logging

#### Automations (`/automations`)
- Toggle-able automation cards with descriptions
- Active/inactive badge and last run timestamp
- Actions this week counter
- "Run Now" button to trigger all automations immediately

#### Settings (`/settings`)
- Agency Profile tab (name, email, phone, website, states)
- Branding tab (colors, logo, tagline, social URLs)
- **Integrations tab** — API key management for:
  - Twilio (SMS): Account SID, Auth Token, Phone Number
  - SendGrid (Email): API Key
  - Clay (Candidate Sourcing): API Key
  - GoHighLevel (CRM & Outreach): API Key, Sub-Account ID
  - Bland AI (Phone Screening): API Key
  - Per-key status indicators: Connected / Saved (untested) / Not configured
  - Show/hide toggle for sensitive values
- Notifications tab
- Team Members tab

---

## 7. Authentication Flow

1. **Sign Up:** Email + password → email verification required (auto-confirm disabled)
2. **Sign In:** Email + password
3. **Password Reset:** Email-based reset flow (`/reset-password`)
4. **Post-Auth:** Check for agency membership → if none, redirect to `/onboarding`
5. **Onboarding:** 5-step wizard: Agency Name → States & Counties → Programs & Rates → Goals & Budget → AI Strategy Generation
6. **Protected Routes:** All app routes wrapped in `<ProtectedRoute>` component
7. **Anonymous signup:** Disabled

---

## 8. Data Flow Architecture

```
User Action
    ↓
React Component (TanStack Query)
    ↓
Supabase Client SDK
    ↓
PostgreSQL (RLS enforced)
    ↓
Edge Function (for AI operations)
    ↓
Lovable AI Gateway (Gemini models)
    ↓
Response → DB persist → Query invalidation → UI update
```

### Messaging Flow
```
ComposeMessageDialog → supabase.functions.invoke("send-message")
    ↓
send-message Edge Function
    ├── SMS → Twilio API (api_keys lookup)
    ├── Email → SendGrid API (branded HTML, api_keys lookup)
    └── In-App → notifications table insert
    ↓
message_log INSERT (audit trail)
    ↓
Response → UI toast
```

### Talent Sourcing Flow
```
Source Candidates → source-candidates Edge Function → Clay API
    ↓
sourced_candidates table
    ↓
Trigger Outreach → trigger-outreach Edge Function → GoHighLevel API
    ↓
AI Phone Screen → ai-phone-screen Edge Function → Bland AI
    ↓
phone_screens table (transcript, score, recommendation)
    ↓
Promote to Pipeline → caregivers table
```

### Automated Flow (Cron)
```
pg_cron (7:00 AM UTC daily)
    ↓
pg_net HTTP POST → Edge Function
    ↓
Iterates all agencies
    ↓
Executes automations / generates briefings
    ↓
Creates notifications, updates scores, flags stale records
```

### Key Patterns
- **Agency scoping:** All queries filter by `agencyId` from `useAuth()` hook
- **Generic query hook:** `useAgencyQuery<T>(key, table, options)` handles all standard table queries
- **Mutations:** Direct Supabase SDK calls with manual `queryClient.invalidateQueries()`
- **Edge function calls:** `supabase.functions.invoke("function-name", { body: {...} })`
- **Multi-agency batch:** Edge functions accept `agencyId: "all"` for cron-triggered processing

---

## 9. File Structure

```
src/
├── assets/                  # Logo, brand images
├── components/
│   ├── ui/                  # shadcn/ui components (50+ files)
│   ├── AppLayout.tsx        # Main layout with sidebar
│   ├── AppSidebar.tsx       # Navigation sidebar
│   ├── ComposeMessageDialog.tsx  # SMS/Email message composition
│   ├── IntegrationsTab.tsx  # API key management for integrations
│   ├── NavLink.tsx          # Active-aware nav link
│   ├── NotificationBell.tsx # Real-time notification indicator
│   ├── ProtectedRoute.tsx   # Auth guard
│   └── TeamMembers.tsx      # Team member management
├── hooks/
│   ├── useAuth.tsx          # Auth context (user, agencyId, role, signIn, signOut)
│   ├── useAgencyData.ts     # All data hooks (30+ exports)
│   ├── use-mobile.tsx       # Mobile breakpoint detection
│   └── use-toast.ts         # Toast notification hook
├── integrations/
│   └── supabase/
│       ├── client.ts        # Auto-generated Supabase client
│       └── types.ts         # Auto-generated TypeScript types
├── pages/                   # 24 page components
├── lib/utils.ts             # cn() utility
├── index.css                # Design tokens & custom styles
└── main.tsx                 # Entry point

supabase/
├── config.toml              # Edge function configuration (15 functions)
├── functions/
│   ├── ai-phone-screen/     # AI phone screening via Bland AI
│   ├── analyze-pay-rates/   # AI + Firecrawl pay rate analysis
│   ├── campaign-optimizer/  # Multi-mode marketing AI
│   ├── discover-sources/    # Referral source discovery
│   ├── generate-briefing/   # Daily briefing generation
│   ├── generate-content/    # Social content generation
│   ├── generate-creative/   # Ad image + copy generation
│   ├── generate-landing-content/  # Landing page AI
│   ├── halevai-chat/        # Conversational AI
│   ├── post-to-ads/         # Platform posting
│   ├── run-automations/     # Automation execution engine (27 keys)
│   ├── score-leads/         # Lead scoring
│   ├── send-message/        # Unified messaging (SMS/email/in-app)
│   ├── source-candidates/   # Clay-powered candidate sourcing
│   └── trigger-outreach/    # GHL outreach automation
└── migrations/              # Database migrations (read-only)
```

---

## 10. Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `ad-creatives` | AI-generated ad images | Public read, authenticated write |

---

## 11. External Integrations

| Integration | Purpose | Auth Method |
|-------------|---------|-------------|
| **Firecrawl** | Web scraping for competitor pay rates & job postings | API key via Lovable connector (`FIRECRAWL_API_KEY`) |
| **Lovable AI Gateway** | AI model access (Gemini family) | `LOVABLE_API_KEY` (auto-provisioned) |
| **Twilio** | SMS messaging for caregiver outreach | Per-agency API keys in `api_keys` table |
| **SendGrid** | Branded email messaging | Per-agency API key in `api_keys` table |
| **Clay** | Candidate sourcing and enrichment | Per-agency API key in `api_keys` table |
| **GoHighLevel** | CRM workflows and outreach sequences | Per-agency API key + sub-account ID in `api_keys` table |
| **Bland AI** | AI phone screening calls | Per-agency API key in `api_keys` table |

---

## 12. Environment Variables

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Auto-configured |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-configured |
| `VITE_SUPABASE_PROJECT_ID` | Auto-configured |
| `SUPABASE_URL` | Available in edge functions |
| `SUPABASE_ANON_KEY` | Available in edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Available in edge functions |
| `LOVABLE_API_KEY` | Lovable AI Gateway key (edge functions) |
| `FIRECRAWL_API_KEY` | Firecrawl web scraping (managed by connector) |

---

## 13. Security Configuration

### RLS Policies
- All tables have Row Level Security enabled
- Standard pattern: agency membership check via `agency_members` join
- `agencies` INSERT restricted to `TO authenticated` role only
- `landing_page_events` INSERT open with NOT NULL field validation + rate limiting trigger (60/min)
- `profiles` restricted to own user only (`user_id = auth.uid()`)
- `api_keys` restricted to owner/admin roles for all operations
- `message_log` INSERT restricted to owner/admin; SELECT for all members

### Auth Configuration
- Email verification required (auto-confirm disabled)
- Anonymous signups disabled
- Password-based authentication only

### Database Functions (8 deployed)
- `get_user_agency_id()` — Returns current user's agency ID (SECURITY DEFINER)
- `is_agency_member(user_id, agency_id)` — Membership check
- `has_agency_role(user_id, agency_id, role)` — Role-based check
- `is_owner_or_admin(user_id, agency_id)` — Admin/owner check for sensitive operations
- `get_user_agency_role(user_id, agency_id)` — Returns user's role
- `handle_new_user()` — Auto-creates profile on signup (trigger)
- `update_updated_at_column()` — Timestamp trigger
- `check_landing_page_event_rate_limit()` — Rate limit trigger (60 events/min per page)

---

## 14. What's Complete ✅

- [x] All 30+ database tables with RLS policies
- [x] 15 edge functions deployed and functional
- [x] Full authentication flow with email verification
- [x] 5-step onboarding wizard with AI strategy generation
- [x] Dashboard with funnel visualization and KPIs
- [x] Halevai AI chat with full agency context
- [x] 8-tab Campaign Hub
- [x] 4-step Campaign Builder with AI content generation
- [x] Ad creative generation with real AI image output
- [x] Content calendar with bulk actions
- [x] Landing page builder + public rendering route (`/lp/:slug`)
- [x] Landing page analytics with UTM tracking
- [x] Review management with AI response drafting
- [x] Review solicitation tracking
- [x] Recommendation engine with approve & launch
- [x] Campaign package management
- [x] 10 pre-built growth playbooks with AI execution
- [x] Talent sourcing with promote-to-pipeline
- [x] AI phone screening (Bland AI integration)
- [x] Candidate outreach automation (GoHighLevel)
- [x] Enrollment tracker with stage advancement
- [x] Settings with branding configuration
- [x] **Integrations tab** — Twilio, SendGrid, Clay, GHL, Bland AI key management
- [x] Competitor intelligence tracking
- [x] **AI-powered competitive pay rate analysis** (Firecrawl + Gemini)
- [x] **Pay rate intelligence on Dashboard, Competitors, and Caregiver detail**
- [x] **Unified messaging gateway** (send-message edge function: SMS/email/in-app)
- [x] **Branded email templates** using business_config
- [x] **Message log** audit trail for all outbound communications
- [x] **Compose Message dialog** for SMS/email from caregiver profile
- [x] **Automated daily automations** (pg_cron at 7:00 AM UTC — 27 automation keys)
- [x] **Automated daily briefing generation** (pg_cron at 7:05 AM UTC)
- [x] **Lead scoring automation** with tier assignment (HOT/WARM/COLD)
- [x] **Follow-up reminder automation** (3+ day stale contacts)
- [x] **Performance alert automation** (spend threshold monitoring)
- [x] **Stale enrollment alert automation** (14+ day stuck enrollments)
- [x] **Auto welcome SMS, review request, background check reminders**
- [x] **Auth expiry alerts** for upcoming authorization expirations
- [x] **Agent activity logging** for all automation actions
- [x] **Notification bell** with real-time updates
- [x] **Team members** management component
- [x] **Security audit passed** — tightened RLS policies, disabled anon signups, rate limiting

## 15. Potential Future Enhancements

- [ ] Canvas compositing for logo overlays on ad images
- [ ] Direct API integration with ad platforms (Facebook Ads, Google Ads)
- [ ] Real-time chat with caregivers via Twilio conversations
- [ ] Multi-language UI (Hebrew, Spanish, Creole)
- [ ] Role-based permissions (viewer, editor, admin, owner) with column-level RLS
- [ ] Billing & subscription management
- [ ] White-label / agency branding on public pages
- [ ] Webhook endpoints for inbound SMS/email replies
- [ ] Advanced sequence branching (if/then logic based on response)
- [ ] Caregiver mobile app or portal

---

## 16. Key Data Hooks Reference (`useAgencyData.ts`)

| Hook | Table | Returns |
|------|-------|---------|
| `useAgency()` | `agencies` | Single agency |
| `useCaregivers()` | `caregivers` | All caregivers |
| `useCampaigns()` | `campaigns` | All campaigns |
| `useCompetitors()` | `competitors` | All competitors |
| `useReviews()` | `reviews` | All reviews |
| `useContentPosts()` | `content_posts` | All content posts |
| `useLandingPages()` | `landing_pages` | All landing pages |
| `useSourcingCampaigns()` | `sourcing_campaigns` | All sourcing campaigns |
| `useSourcedCandidates()` | `sourced_candidates` | All sourced candidates |
| `useAutomations()` | `automation_configs` | All automation configs |
| `useRecommendations()` | `halevai_recommendations` | All recommendations |
| `usePlaybooks()` | `growth_playbooks` | All playbooks |
| `useActivityLog()` | `activity_log` | Recent 20 entries |
| `useAdCreatives()` | `ad_creatives` | All ad creatives |
| `useBusinessConfig()` | `business_config` | Single config |
| `useReferralSources()` | `referral_sources` | All referral sources |
| `useCampaignTemplates()` | `saved_campaign_templates` | All templates |
| `useCampaignSequences()` | `campaign_sequences` | All sequences |
| `useSequenceSteps(id)` | `sequence_steps` | Steps for sequence |
| `useSequenceEnrollments()` | `sequence_enrollments` | All enrollments |
| `useCampaignPackages()` | `campaign_packages` | All packages |
| `useLandingPageEvents()` | `landing_page_events` | All events |
| `useReviewRequests()` | `review_requests` | All review requests |
| `usePayRateIntel()` | `pay_rate_intel` | Latest analysis |
| `useAgencyMembers()` | `agency_members` | All agency members |
| `useApiKeys()` | `api_keys` | All integration keys |
| `useMessageLog(limit)` | `message_log` | Recent messages |
| `useAgentActivityLog()` | `agent_activity_log` | Recent 50 agent actions |
| `usePhoneScreens()` | `phone_screens` | All phone screens |
| `useToggleAutomation()` | `automation_configs` | Mutation: toggle active |
| `useSaveApiKey()` | `api_keys` | Mutation: upsert key |
| `useTestConnection()` | — | Mutation: test integration |
