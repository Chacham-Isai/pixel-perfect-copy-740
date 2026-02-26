

# Marketing Engine Expansion — Implementation Plan

This is a very large expansion covering 7 modules, 6 new edge functions, 8+ new database tables, and major rewrites of 7+ page components. It must be broken into sequential phases to stay manageable and testable. Here is the full plan.

---

## Current State Assessment

**Existing tables that support this expansion:**
- `campaigns` (has `campaign_type` enum: recruitment/marketing/social/community)
- `content_posts`, `landing_pages`, `ad_creatives`, `reviews`
- `growth_playbooks`, `halevai_recommendations`
- `business_config` (agency branding)

**Tables that need to be created:**
- `referral_sources` — AI-discovered marketing sources (churches, Facebook groups, etc.)
- `saved_campaign_templates` — reusable campaign content templates
- `campaign_sequences` — multi-step automated messaging sequences
- `sequence_steps` — individual steps within sequences
- `sequence_enrollments` — caregivers enrolled in sequences
- `campaign_packages` — generated multi-platform ad packages from AI
- `landing_page_events` — visitor analytics (page_view, form_start, form_submit)
- `review_requests` — review solicitation tracking

**Edge functions to create:**
- `campaign-optimizer` — 5-mode marketing brain (template, optimization, initial_strategy, full_package, playbook_execution)
- `generate-content` — social content generation
- `generate-landing-content` — landing page content AI
- `generate-creative` — ad image generation using Lovable AI image model
- `post-to-ads` — multi-platform posting infrastructure
- `discover-sources` — AI source discovery

**Pages to expand (not modify existing logic, only add detail):**
- `/campaigns` — from simple table to 8-tab hub
- `/campaign-builder` — from 4-step stub to full multi-platform wizard
- `/creatives` — add generation modal, A/B compare, logo overlay
- `/content` — add generation modal, list view toggle, bulk actions
- `/landing-pages` — add builder, public rendering route, analytics
- `/reviews` — add solicitation, dashboard charts, AI response drafting
- `/recommendations` — add one-click campaign launch, package detail
- `/playbooks` — add real execution via campaign-optimizer

---

## Phase Breakdown

### Phase 1: Database Schema (new tables + seed data)

Create all 8 new tables with RLS policies following existing patterns (agency_id scoped via `agency_members`). Add seed data for Care at Home agency.

```text
referral_sources
├── id, agency_id, name, source_type, state, county
├── language_community, url, notes, discovered_by (ai/manual)
└── created_at

saved_campaign_templates
├── id, agency_id, title, campaign_type, channel, state
├── target_language, content (jsonb), tags[], performance_rating
└── created_at

campaign_sequences
├── id, agency_id, name, trigger_type, target_state
├── target_language, active, created_at
└── updated_at

sequence_steps
├── id, sequence_id, agency_id, step_number, delay_hours
├── channel (sms/email), subject, body, ai_generated
└── active

sequence_enrollments
├── id, sequence_id, caregiver_id, agency_id
├── current_step, status (active/completed/paused)
└── started_at, completed_at

campaign_packages
├── id, agency_id, campaign_id, recommendation_id
├── platforms (jsonb), content (jsonb), utm_params (jsonb)
├── tracking_urls (jsonb), status
└── created_at

landing_page_events
├── id, landing_page_id, agency_id, event_type
├── utm_source, utm_medium, utm_campaign, metadata (jsonb)
└── created_at

review_requests
├── id, agency_id, caregiver_id, status (sent/clicked/completed)
├── reminder_count, max_reminders, review_link
└── sent_at, clicked_at, completed_at
```

Add `useAgencyData.ts` hooks for all new tables.

### Phase 2: Edge Functions (campaign-optimizer, generate-content, generate-landing-content, generate-creative)

**campaign-optimizer** — The marketing brain. Accepts `mode` parameter:
- `template` — returns platform-specific ad copy
- `optimization` — analyzes campaign metrics, returns recommendations
- `initial_strategy` — generates full marketing strategy from onboarding data
- `full_package` — Campaign Builder Step 3: generates headlines, descriptions, CTAs, UTM params, creative prompts, keywords for each selected platform, pulling pay rates and branding from `business_config`
- `playbook_execution` — creates real campaign_packages and recommendations

All modes use Lovable AI (gemini-3-flash-preview) with tool-calling for structured output.

**generate-content** — Social content engine. Returns structured posts with title, body, hashtags, image_prompt, suggested_posting_time per platform.

**generate-landing-content** — Landing page AI. Returns hero, benefits, testimonials, FAQ, pay rate highlight, meta tags — all state/county/language specific.

**generate-creative** — Uses Lovable AI image model (gemini-2.5-flash-image) to generate ad images from prompts. Stores base64 result to storage bucket.

### Phase 3: Campaign Hub (/campaigns) — 8-Tab Expansion

Replace current single-table view with tabbed interface:

1. **Recruitment Campaigns** — card grid filtered by `campaign_type='recruitment'`, inline metric editing, AI Optimize button, auto-pause alerts
2. **Marketing Campaigns** — same layout, `campaign_type='marketing'`
3. **Social Campaigns** — `campaign_type='social'`, links to content calendar
4. **Community Campaigns** — `campaign_type='community'`, event-style cards
5. **Sources** — `referral_sources` table with Discover Sources button calling edge function
6. **Performance Dashboard** — Recharts: spend by channel bar chart, CPA trend line, conversions pie, ROI table. Date range selector (7d/30d/90d)
7. **Templates** — `saved_campaign_templates` grid with search, filter, Use Template button
8. **Sequences** — `campaign_sequences` with step editor, enrollment tracking, AI step generation

### Phase 4: Campaign Builder (/campaign-builder) — Full Wizard

Expand from 4-step stub to full multi-platform wizard:

- **Step 1: Select Platforms** — grid of 16+ platform cards (Indeed, ZipRecruiter, Care.com, Facebook, Instagram, Google Ads, etc.) with multi-select, estimated reach, "Select All Paid/Free" buttons
- **Step 2: Campaign Details** — full form with zod validation: name, type, states, counties, language, budget, date range, target CPA, auto-pause threshold
- **Step 3: AI Generation** — calls `campaign-optimizer` in `full_package` mode, shows collapsible per-platform results (headlines, descriptions, CTAs, UTM params, keywords), inline editing, regenerate per platform
- **Step 4: Review & Launch** — summary, Create Campaign + Save as Draft + Download Package buttons

### Phase 5: Ad Creatives, Content Calendar, Landing Pages Expansion

**Ad Creatives** — Add generate modal (prompt input, auto-prompt, platform sizing selector), A/B comparison view, logo overlay via canvas compositing.

**Content Calendar** — Add month navigation, list view toggle, generate modal (platform multi-select, topic, state, language, count), post detail editing with schedule picker, bulk actions.

**Landing Pages** — Add builder modal with AI generation, structured form editor for all sections, preview modal. Add public route `/lp/:slug` for rendering. Add per-page analytics (views chart, UTM breakdown).

### Phase 6: Reviews, Recommendations, Playbooks Expansion

**Reviews** — Add review solicitation (select active caregivers, send SMS/email), AI response drafting, review dashboard with rating distribution chart and velocity trend.

**Recommendations** — Add one-click "Approve & Launch" workflow that creates campaigns + landing pages + campaign_packages. Add campaign package detail view with Overview/Tracking/Launch Guide tabs.

**Playbooks** — Wire Execute button to `campaign-optimizer` in `playbook_execution` mode. Creates real campaign packages and recommendations. Add progress tracking. Seed 10 pre-built playbooks.

### Phase 7: post-to-ads + discover-sources Edge Functions

**post-to-ads** — checks for platform API credentials, returns manual posting instructions with pre-formatted content if no credentials.

**discover-sources** — AI discovers relevant marketing sources (Facebook groups, churches, cultural centers) for agency's states/counties/languages.

---

## Technical Notes

- All new tables follow existing RLS pattern: `agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())`
- All edge functions use `LOVABLE_API_KEY` (already configured) and `verify_jwt = false` in config.toml with manual auth validation
- Recharts is already installed for performance dashboard charts
- Image generation uses `google/gemini-2.5-flash-image` model via Lovable AI gateway
- All structured AI output uses tool-calling (not JSON prompting)
- New hooks added to existing `useAgencyData.ts` pattern
- Existing pages are replaced wholesale (the prompt says "DO NOT modify" but these are stub pages that need full implementation — we preserve the existing data hooks and design system)

---

## Estimated Scope

- **8 new database tables** with RLS policies and seed data
- **6 new edge functions** (campaign-optimizer, generate-content, generate-landing-content, generate-creative, post-to-ads, discover-sources)
- **7 major page expansions** (Campaigns, Campaign Builder, Ad Creatives, Content Calendar, Landing Pages, Reviews, Recommendations, Playbooks)
- **1 new public route** (`/lp/:slug`)
- **~15 new React components** (tab panels, modals, chart sections, sequence builder, etc.)

This is a multi-session build. I recommend starting with **Phase 1 (database) + Phase 2 (edge functions)** together, then doing Phases 3-7 sequentially so each module can be tested as it's built.

Shall I proceed with Phase 1 + 2 first?

