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
| **Edge Functions** | Deno (Supabase Edge Functions) |
| **AI Models** | Google Gemini 3 Flash Preview (text), Gemini 2.5 Flash Image (images) via Lovable AI Gateway |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Forms** | React Hook Form + Zod validation |

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

## 3. Database Schema (28 Tables)

### Core Agency Tables
| Table | Purpose |
|-------|---------|
| `agencies` | Multi-tenant root. Has `name`, `slug`, `states[]`, `logo_url` |
| `agency_members` | User ↔ Agency mapping with `role` enum (`owner`/`admin`) |
| `profiles` | Extended user info (`full_name`, `email`, `avatar_url`) |
| `business_config` | Branding: colors, logo, tagline, social URLs. One per agency |
| `onboarding` | Onboarding wizard state & AI strategy output |
| `locations` | Office locations with service counties |
| `notifications` | In-app notification queue |

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

### AI & Strategy
| Table | Purpose |
|-------|---------|
| `halevai_conversations` | Chat conversation threads |
| `halevai_messages` | Individual messages (user/assistant roles) |
| `halevai_recommendations` | AI-generated action items with priority, status, impact estimates |
| `growth_playbooks` | Pre-built marketing playbook templates (10 seeded) |
| `daily_briefings` | Daily performance summaries (jsonb content) |
| `activity_log` | System-wide audit trail |
| `automation_configs` | Toggle-able automation rules |

### RLS Pattern
All tables use Row Level Security. Standard pattern:
```sql
agency_id IN (
  SELECT agency_id FROM agency_members
  WHERE user_id = auth.uid()
)
```
Exception: `landing_page_events` allows public INSERT (for anonymous page view tracking).

### Key Enums
- `lead_status`: new → contacted → intake_started → enrollment_pending → authorized → active → inactive → rejected
- `lead_source`: landing_page, facebook, google, indeed, referral, walk_in, other
- `campaign_type`: recruitment, marketing, social, community
- `agency_role`: owner, admin

---

## 4. Edge Functions (6 Deployed)

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

---

## 5. Application Pages & Wireframes

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
- KPI cards: Total Caregivers, Active Campaigns, Avg Review Rating, Sourced Candidates
- Visual recruitment funnel (New → Contacted → Intake → Enrollment → Authorized → Active)
- Quick action grid (6 actions)
- Recent activity feed
- Alert cards for stuck enrollments & underperforming campaigns

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
- Sourcing campaign management (create, toggle active/paused)
- Candidate cards with match scores
- Outreach status tracking
- "Promote to Pipeline" action (creates caregiver from candidate)

#### Settings (`/settings`)
- Agency Profile tab (name, email, phone, website, states)
- Branding tab (colors, logo, tagline, social URLs)
- Notifications tab

#### Automations (`/automations`)
- Toggle-able automation cards
- Action count and last run timestamps

---

## 6. Authentication Flow

1. **Sign Up:** Email + password → email verification required
2. **Sign In:** Email + password
3. **Password Reset:** Email-based reset flow (`/reset-password`)
4. **Post-Auth:** Check for agency membership → if none, redirect to `/onboarding`
5. **Onboarding:** 5-step wizard: Agency Name → States & Counties → Programs & Rates → Goals & Budget → AI Strategy Generation
6. **Protected Routes:** All app routes wrapped in `<ProtectedRoute>` component

---

## 7. Data Flow Architecture

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

### Key Patterns
- **Agency scoping:** All queries filter by `agencyId` from `useAuth()` hook
- **Generic query hook:** `useAgencyQuery<T>(key, table, options)` handles all standard table queries
- **Mutations:** Direct Supabase SDK calls with manual `queryClient.invalidateQueries()`
- **Edge function calls:** `supabase.functions.invoke("function-name", { body: {...} })`

---

## 8. File Structure

```
src/
├── assets/                  # Logo, brand images
├── components/
│   ├── ui/                  # shadcn/ui components (50+ files)
│   ├── AppLayout.tsx        # Main layout with sidebar
│   ├── AppSidebar.tsx       # Navigation sidebar
│   ├── NavLink.tsx          # Active-aware nav link
│   └── ProtectedRoute.tsx   # Auth guard
├── hooks/
│   ├── useAuth.tsx          # Auth context (user, agencyId, signIn, signOut)
│   ├── useAgencyData.ts     # All data hooks (20+ exports)
│   └── use-mobile.tsx       # Mobile breakpoint detection
├── integrations/
│   └── supabase/
│       ├── client.ts        # Auto-generated Supabase client
│       └── types.ts         # Auto-generated TypeScript types
├── pages/                   # 20 page components
├── lib/utils.ts             # cn() utility
├── index.css                # Design tokens & custom styles
└── main.tsx                 # Entry point

supabase/
├── config.toml              # Edge function configuration
├── functions/
│   ├── campaign-optimizer/  # Multi-mode marketing AI
│   ├── generate-content/    # Social content generation
│   ├── generate-landing-content/  # Landing page AI
│   ├── generate-creative/   # Ad image + copy generation
│   ├── post-to-ads/         # Platform posting
│   ├── discover-sources/    # Referral source discovery
│   └── halevai-chat/        # Conversational AI
└── migrations/              # Database migrations (read-only)
```

---

## 9. Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `ad-creatives` | AI-generated ad images | Public read, authenticated write |

---

## 10. Environment Variables

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Auto-configured |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-configured |
| `SUPABASE_URL` | Available in edge functions |
| `SUPABASE_ANON_KEY` | Available in edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Available in edge functions |
| `LOVABLE_API_KEY` | Lovable AI Gateway key (edge functions) |

---

## 11. What's Complete ✅

- [x] All 28 database tables with RLS policies
- [x] 6 edge functions deployed and functional
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
- [x] Enrollment tracker with stage advancement
- [x] Settings with branding configuration
- [x] Competitor intelligence tracking

## 12. Potential Future Enhancements

- [ ] Canvas compositing for logo overlays on ad images
- [ ] Direct API integration with ad platforms (Facebook Ads, Google Ads)
- [ ] SMS/email sending via Twilio or SendGrid for sequences
- [ ] Real-time notifications via Supabase Realtime
- [ ] Multi-language UI (Hebrew, Spanish, Creole)
- [ ] Role-based permissions (viewer, editor, admin, owner)
- [ ] Billing & subscription management
- [ ] White-label / agency branding on public pages
- [ ] Mobile-responsive optimization
- [ ] Automated daily briefing generation via cron
- [ ] Phone screening integration (Bland AI or similar)
- [ ] Candidate enrichment via third-party data APIs

---

*Generated for project handoff context. This document reflects the complete state of halevai.ai as of February 2026.*
