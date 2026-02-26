# HALEVAI.AI — Complete Project Handoff Document
> Generated: 2026-02-26 | Supabase Project: `jpyjqnucuebmknnykmyf`
> Published URL: https://halevai.lovable.app

---

## Table of Contents
1. [File Tree](#1-file-tree)
2. [Route Map](#2-route-map)
3. [Component Dependency Graph](#3-component-dependency-graph)
4. [Core Source Files](#4-core-source-files)
5. [Edge Functions — Full Source](#5-edge-functions--full-source)
6. [Database Schema & RLS Policies](#6-database-schema--rls-policies)
7. [Supabase Types (auto-generated)](#7-supabase-types)
8. [Design System](#8-design-system)
9. [Edge Function Config (config.toml)](#9-edge-function-config)
10. [pg_cron Job SQL](#10-pg_cron-job-sql)
11. [Environment Variables per Function](#11-environment-variables-per-function)
12. [Edge Function Request/Response Contracts](#12-edge-function-requestresponse-contracts)

---

## 1. File Tree

```
src/
├── App.css
├── App.tsx
├── index.css
├── main.tsx
├── tailwind.config.lov.json
├── vite-env.d.ts
├── assets/
│   ├── abstract-brand.png
│   ├── care-at-home-logo.png
│   ├── geometric-pattern.png
│   ├── halevai-logo.png
│   └── logo-transparent.png
├── components/
│   ├── AppLayout.tsx
│   ├── AppSidebar.tsx
│   ├── ComposeMessageDialog.tsx
│   ├── IntegrationsTab.tsx
│   ├── NavLink.tsx
│   ├── NotificationBell.tsx
│   ├── PermissionGate.tsx
│   ├── ProtectedRoute.tsx
│   ├── SequenceBuilder.tsx
│   ├── TeamMembers.tsx
│   └── ui/
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── states.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       ├── tooltip.tsx
│       └── use-toast.ts
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   ├── useAgencyData.ts
│   ├── useAuth.tsx
│   ├── useDebouncedValue.ts
│   └── usePageTitle.ts
├── integrations/
│   ├── lovable/
│   │   └── index.ts
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── lib/
│   ├── formatters.ts
│   ├── permissions.ts
│   └── utils.ts
├── pages/
│   ├── AdCreatives.tsx
│   ├── Auth.tsx
│   ├── Automations.tsx
│   ├── Briefing.tsx
│   ├── CampaignBuilder.tsx
│   ├── Campaigns.tsx
│   ├── Caregivers.tsx
│   ├── Competitors.tsx
│   ├── ContentCalendar.tsx
│   ├── Dashboard.tsx
│   ├── Enrollment.tsx
│   ├── HalevaiChat.tsx
│   ├── Inbox.tsx
│   ├── Index.tsx
│   ├── LandingPages.tsx
│   ├── NotFound.tsx
│   ├── Onboarding.tsx
│   ├── PlaceholderPage.tsx
│   ├── Playbooks.tsx
│   ├── PublicLandingPage.tsx
│   ├── Recommendations.tsx
│   ├── ResetPassword.tsx
│   ├── Reviews.tsx
│   ├── Settings.tsx
│   └── TalentSourcing.tsx
└── test/
    ├── example.test.ts
    └── setup.ts

supabase/functions/
├── ai-phone-screen/index.ts
├── analyze-pay-rates/index.ts
├── campaign-optimizer/index.ts
├── cron-trigger/index.ts
├── discover-sources/index.ts
├── generate-briefing/index.ts
├── generate-content/index.ts
├── generate-creative/index.ts
├── generate-landing-content/index.ts
├── halevai-chat/index.ts
├── post-to-ads/index.ts
├── run-automations/index.ts
├── score-leads/index.ts
├── send-message/index.ts
├── source-candidates/index.ts
├── sync-ad-metrics/index.ts
├── trigger-outreach/index.ts
└── webhook-inbound/index.ts
```

---

## 2. Route Map

| Path | Component | Protected | Description |
|------|-----------|-----------|-------------|
| `/` | `Index` | No | Public landing / splash page |
| `/auth` | `Auth` | No | Login / signup form |
| `/reset-password` | `ResetPassword` | No | Password reset flow |
| `/lp/:slug` | `PublicLandingPage` | No | Public caregiver landing pages |
| `/onboarding` | `Onboarding` | **Yes** | Agency setup wizard |
| `/dashboard` | `Dashboard` | **Yes** | Main dashboard with KPIs |
| `/caregivers` | `Caregivers` | **Yes** | Kanban pipeline board |
| `/halevai` | `HalevaiChat` | **Yes** | AI strategy chat |
| `/enrollment` | `Enrollment` | **Yes** | Enrollment tracker |
| `/campaigns` | `Campaigns` | **Yes** | Campaign list & metrics |
| `/campaign-builder` | `CampaignBuilder` | **Yes** | AI campaign builder |
| `/competitors` | `Competitors` | **Yes** | Competitor intel |
| `/reviews` | `Reviews` | **Yes** | Review management |
| `/recommendations` | `Recommendations` | **Yes** | AI recommendations |
| `/playbooks` | `Playbooks` | **Yes** | Growth playbooks |
| `/briefing` | `Briefing` | **Yes** | Daily AI briefing |
| `/talent-sourcing` | `TalentSourcing` | **Yes** | Sourcing campaigns & candidates |
| `/content` | `ContentCalendar` | **Yes** | Content calendar |
| `/landing-pages` | `LandingPages` | **Yes** | Landing page manager |
| `/creatives` | `AdCreatives` | **Yes** | AI ad creative generator |
| `/automations` | `Automations` | **Yes** | Automation configs & cron jobs |
| `/settings` | `Settings` | **Yes** | Agency settings (profile, branding, team, integrations) |
| `/inbox` | `Inbox` | **Yes** | Unified inbox (SMS/email threads) |
| `*` | `NotFound` | No | 404 page |

---

## 3. Component Dependency Graph

### Layout Components
- **AppLayout** → `AppSidebar`, `NotificationBell`, `CommandDialog` (cmdk), `useNavigate`
- **AppSidebar** → `NavLink`, `useUnreadCount`, `useAuth`, `hasPermission`, lucide icons
- **ProtectedRoute** → `useAuth`, `Navigate`
- **PermissionGate** → `useAuth`, `hasPermission`

### Page → Component/Hook Dependencies

| Page | Components | Hooks |
|------|-----------|-------|
| Dashboard | AppLayout, Card, Badge, Skeleton | useAgency, useCaregivers, useCampaigns, useReviews, useAuth |
| Caregivers | AppLayout, Card, Badge, Dialog, Breadcrumb | useCaregivers, useAuth, useAgencyData |
| HalevaiChat | AppLayout, ScrollArea | useAuth, useAgencyData (conversations) |
| Campaigns | AppLayout, Card, Table | useCampaigns, useAuth |
| CampaignBuilder | AppLayout, Breadcrumb, Select, Card | useAuth, useCampaigns |
| Competitors | AppLayout, Card, Table | useCompetitors, useAuth |
| Reviews | AppLayout, Card, Badge | useReviews, useAuth |
| ContentCalendar | AppLayout, Card | useContentPosts, useAuth |
| LandingPages | AppLayout, Card | useLandingPages, useAuth |
| AdCreatives | AppLayout, Card | useAdCreatives, useAuth |
| Automations | AppLayout, Card, Switch | useAutomations, useToggleAutomation, useAuth |
| Settings | AppLayout, Tabs, Breadcrumb, TeamMembers, IntegrationsTab | useAuth, useAgency, useBusinessConfig |
| Inbox | AppLayout, Card, ScrollArea, ComposeMessageDialog | useConversationThreads, useThreadMessages, useAuth |
| TalentSourcing | AppLayout, Card | useSourcingCampaigns, useSourcedCandidates, useAuth |
| Enrollment | AppLayout, Card | useCaregivers, useAuth |
| Playbooks | AppLayout, Card | usePlaybooks, useAuth |
| Recommendations | AppLayout, Card | useRecommendations, useAuth |
| Briefing | AppLayout, Card | useAuth, useAgencyData |
| Onboarding | Card, Select | useAuth |
| PublicLandingPage | (standalone, no AppLayout) | useParams |

---

## 4. Core Source Files

### 4.1 useAuth.tsx

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import type { AgencyRole } from "@/lib/permissions";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  agencyId: string | null;
  agencyRole: AgencyRole | null;
  isViewer: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  agencyId: null,
  agencyRole: null,
  isViewer: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyRole, setAgencyRole] = useState<AgencyRole | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("agency_members")
        .select("agency_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          setAgencyId(data?.agency_id ?? null);
          setAgencyRole((data?.role as AgencyRole) ?? null);
        });
    } else {
      setAgencyId(null);
      setAgencyRole(null);
    }
  }, [user]);

  const isViewer = agencyRole === "viewer";

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, agencyId, agencyRole, isViewer, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 4.2 useAgencyData.ts

```ts
// Full source — see src/hooks/useAgencyData.ts
// Exports 30+ hooks. Key pattern:

function useAgencyQuery<T>(key, table, options?) {
  const { agencyId } = useAuth();
  // SELECT * FROM {table} WHERE agency_id = {agencyId} + optional filters/ordering/limit
}

// Exported hooks:
// useAgency, useCaregivers, useCampaigns, useCompetitors, useReviews,
// useContentPosts, useLandingPages, useSourcingCampaigns, useSourcedCandidates,
// useAutomations, useRecommendations, usePlaybooks, useActivityLog,
// useAdCreatives, useBusinessConfig, useReferralSources, useCampaignTemplates,
// useCampaignSequences, useSequenceSteps, useSequenceEnrollments,
// useCampaignPackages, useLandingPageEvents, useReviewRequests,
// useAgencyMembers, usePayRateIntel, useToggleAutomation,
// useApiKeys, useMessageLog, useSaveApiKey, useTestConnection,
// useAgentActivityLog, usePhoneScreens, useConversationThreads,
// useUnreadCount, useThreadMessages, useInboundMessages
```

### 4.3 permissions.ts

```ts
export type AgencyRole = "owner" | "admin" | "operations_manager" | "intake_coordinator" | "viewer";

export type PermissionAction =
  | "view_dashboard" | "edit_caregivers" | "send_messages"
  | "manage_campaigns" | "post_to_ads" | "run_automations"
  | "manage_api_keys" | "edit_branding" | "manage_team"
  | "invite_members" | "change_roles" | "delete_agency" | "transfer_ownership";

const PERMISSION_MATRIX: Record<PermissionAction, AgencyRole[]> = {
  view_dashboard: ["owner", "admin", "operations_manager", "intake_coordinator", "viewer"],
  edit_caregivers: ["owner", "admin", "operations_manager", "intake_coordinator"],
  send_messages: ["owner", "admin", "operations_manager", "intake_coordinator"],
  manage_campaigns: ["owner", "admin", "operations_manager"],
  post_to_ads: ["owner", "admin", "operations_manager"],
  run_automations: ["owner", "admin", "operations_manager"],
  manage_api_keys: ["owner", "admin"],
  edit_branding: ["owner", "admin"],
  manage_team: ["owner", "admin"],
  invite_members: ["owner", "admin"],
  change_roles: ["owner"],
  delete_agency: ["owner"],
  transfer_ownership: ["owner"],
};

export function hasPermission(role: string | null, action: PermissionAction): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[action]?.includes(role as AgencyRole) ?? false;
}

export function isWriteRole(role: string | null): boolean {
  return hasPermission(role, "edit_caregivers");
}

export const ROLE_LABELS: Record<AgencyRole, string> = {
  owner: "Owner", admin: "Admin", operations_manager: "Ops Manager",
  intake_coordinator: "Intake Coordinator", viewer: "Viewer",
};
```

### 4.4 formatters.ts

```ts
export function normalizePhone(input: string): string { /* +1XXXXXXXXXX */ }
export function formatPhone(e164: string): string { /* (XXX) XXX-XXXX */ }
export function formatCurrency(amount: number, style: "full"|"compact"|"rate"): string { /* $1,234.56 */ }
export function formatTimeAgo(date: string | Date): string { /* "2 minutes ago" */ }
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["contacted"],
  contacted: ["intake_started", "new"],
  intake_started: ["enrollment_pending", "contacted"],
  enrollment_pending: ["authorized", "intake_started"],
  authorized: ["active", "enrollment_pending"],
  active: [],
};
export function isValidStatusTransition(from: string, to: string): boolean { /* ... */ }
```

---

## 5. Edge Functions — Full Source

### 5.1 ai-phone-screen/index.ts (293 lines)
- **Purpose**: Initiates AI phone screening via Bland AI, polls for completion, analyzes transcript with AI, auto-promotes high-scoring candidates
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Agency keys**: `bland_ai_api_key`
- **Request**: `{ agency_id, sourced_candidate_id?, caregiver_id?, phone_number, state? }`
- **Response**: `{ success, mock, screen_id, call_id?, message? }`

### 5.2 analyze-pay-rates/index.ts (207 lines)
- **Purpose**: Competitive pay rate analysis using Firecrawl web scraping + AI analysis
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `FIRECRAWL_API_KEY`
- **Auth**: Bearer token required
- **Request**: `{ agency_id, state?, county? }`
- **Response**: `{ success, recommended_rate, medicaid_reimbursement_rate, market_avg_rate, market_min_rate, market_max_rate, analysis_summary, sources }`

### 5.3 campaign-optimizer/index.ts (268 lines)
- **Purpose**: AI-powered campaign optimization with 5 modes: template, optimization, full_package, initial_strategy, playbook_execution
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token required
- **Request**: `{ mode, agencyId, campaignId?, platforms?, campaignDetails?, playbookId? }`
- **Response**: Mode-dependent JSON with tool call results

### 5.4 cron-trigger/index.ts (107 lines)
- **Purpose**: Secure cron dispatcher that routes to other edge functions per agency
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- **Auth**: `x-cron-secret` header
- **Valid jobs**: `automations`, `briefing`, `scoring`, `sequences`, `sync-ads`
- **Request**: `?job=<job_type>` (query param)
- **Response**: `{ job, agencies_processed, results[] }`

### 5.5 discover-sources/index.ts (175 lines)
- **Purpose**: AI-powered discovery of community referral sources for caregiver recruitment
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token required
- **Request**: `{ agencyId, state?, county?, language?, sourceTypes? }`
- **Response**: `{ sources[], discovery_summary, total_discovered, total_saved, duplicates_skipped }`

### 5.6 generate-briefing/index.ts (114 lines)
- **Purpose**: Generates daily briefing with pipeline stats, campaign metrics, action items
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Request**: `{ agencyId, userId? }`
- **Response**: `{ results[{ agency, id?, error? }] }`

### 5.7 generate-content/index.ts (110 lines)
- **Purpose**: AI social media post generation for multiple platforms
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token required
- **Request**: `{ agencyId, platforms?, topic?, state?, language?, count? }`
- **Response**: `{ posts[{ platform, title, body, hashtags[], image_prompt, suggested_posting_time }] }`

### 5.8 generate-creative/index.ts (138 lines)
- **Purpose**: AI ad copy + image generation, uploads to `ad-creatives` storage bucket
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token (getUser)
- **Request**: `{ agencyId, prompt, platform?, campaignId? }`
- **Response**: `{ headline, body_copy, prompt, platform, image_url? }`

### 5.9 generate-landing-content/index.ts (107 lines)
- **Purpose**: AI landing page content generation (headlines, benefits, FAQ, testimonials)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token required
- **Request**: `{ agencyId, state?, county?, language? }`
- **Response**: `{ hero_headline, hero_subheadline, hero_cta_text, benefits[], testimonials[], faq[], pay_rate_highlight, meta_title, meta_description }`

### 5.10 halevai-chat/index.ts (315 lines)
- **Purpose**: AI strategy chat with full real-time agency data context (24 parallel DB queries)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token (getUser + agency_members lookup)
- **Request**: `{ messages[{ role, content }] }`
- **Response**: SSE stream (text/event-stream)

### 5.11 post-to-ads/index.ts (317 lines)
- **Purpose**: Post campaigns to ad platforms (Facebook, Google Ads, Indeed, Craigslist, ZipRecruiter)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
- **Auth**: Bearer token required
- **Request**: `{ action: "check_credentials"|"post", agencyId, campaignId?, platform?, content? }`
- **Response**: Platform-specific result with `{ success, externalId?, message?, mock? }`

### 5.12 run-automations/index.ts (679 lines)
- **Purpose**: Master automation engine with 13 handlers including sequence processing
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Request**: `{ agencyId }` (or `agencyId: "all"`)
- **Response**: `{ results[{ agency, results[{ key, actions }] }] }`
- **Automation keys**: `lead_scoring`, `follow_up_reminders`, `performance_alerts`, `stale_enrollment_alerts`, `auto_welcome_sms`, `auto_source_candidates`, `auto_outreach_high_match`, `auto_screen_responded`, `auto_review_request`, `background_check_reminder`, `auth_expiry_alert`, `process_sequences`

### 5.13 score-leads/index.ts (100 lines)
- **Purpose**: Rule-based lead scoring (0-100) with tier assignment (HOT/WARM/COLD)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Request**: `{ agencyId }`
- **Response**: `{ scored: number }`

### 5.14 send-message/index.ts (228 lines)
- **Purpose**: Unified messaging (SMS via Twilio, email via SendGrid, in-app notifications)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Agency keys**: `twilio_account_sid`, `twilio_auth_token`, `twilio_phone_number`, `sendgrid_api_key`
- **Request**: `{ agency_id, channel: "sms"|"email"|"in_app", to, subject?, body, template?, related_type?, related_id?, user_id? }`
- **Response**: `{ success, message_id, status, mock, error? }`

### 5.15 source-candidates/index.ts (230 lines)
- **Purpose**: Candidate sourcing via Clay API (with mock fallback)
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Agency keys**: `clay_api_key`
- **Request**: `{ agency_id, campaign_id, mode: "search"|"enrich" }`
- **Response**: `{ success, mock, candidates_created, candidates_enriched }`

### 5.16 sync-ad-metrics/index.ts (105 lines)
- **Purpose**: Syncs Facebook Ads metrics (spend, impressions, clicks, conversions) into campaigns table
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Agency keys**: `facebook_access_token`, `google_ads_api_key`
- **Request**: `{ agencyId, campaignId? }`
- **Response**: `{ synced, total, results[] }`

### 5.17 trigger-outreach/index.ts (158 lines)
- **Purpose**: Multi-step outreach sequences (caregiver_cold, poaching) via GHL + send-message
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Agency keys**: `ghl_api_key`, `ghl_subaccount_id`
- **Request**: `{ agency_id, sourced_candidate_ids[], sequence_type: "caregiver_cold"|"poaching" }`
- **Response**: `{ success, mock, sent }`

### 5.18 webhook-inbound/index.ts (318 lines)
- **Purpose**: Receives inbound SMS (Twilio) and email (SendGrid) webhooks, matches to contacts, creates conversation threads, detects keywords
- **Env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Request**: Twilio form-urlencoded or SendGrid JSON
- **Response**: `<Response></Response>` (TwiML) or `OK`

---

## 6. Database Schema & RLS Policies

### Tables (31 total)

| Table | RLS | Policy Pattern |
|-------|-----|----------------|
| `activity_log` | ✅ | ALL: `agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())` |
| `ad_creatives` | ✅ | ALL: agency_members subquery |
| `agencies` | ✅ | INSERT: `true` (authenticated), SELECT: `is_agency_member()`, UPDATE: `has_agency_role(owner)` |
| `agency_members` | ✅ | INSERT: `user_id = auth.uid()`, SELECT: `is_agency_member()`, UPDATE/DELETE: `has_agency_role(owner)` |
| `agent_activity_log` | ✅ | ALL: `is_agency_member()` |
| `api_keys` | ✅ | ALL: `is_owner_or_admin()` |
| `automation_configs` | ✅ | SELECT: `is_agency_member()`, ALL: `is_owner_or_admin()` |
| `business_config` | ✅ | SELECT: `is_agency_member()`, ALL: `is_owner_or_admin()` |
| `campaign_packages` | ✅ | ALL: agency_members subquery |
| `campaign_sequences` | ✅ | ALL: agency_members subquery |
| `campaigns` | ✅ | SELECT: `is_agency_member()`, ALL: `is_owner_or_admin()` |
| `caregiver_activities` | ✅ | ALL: agency_members subquery |
| `caregivers` | ✅ | ALL: agency_members subquery |
| `competitors` | ✅ | SELECT: `is_agency_member()`, ALL: `is_owner_or_admin()` |
| `content_posts` | ✅ | ALL: agency_members subquery |
| `conversation_threads` | ✅ | ALL: `is_agency_member()` |
| `daily_briefings` | ✅ | ALL: agency_members subquery |
| `growth_playbooks` | ✅ | ALL: `agency_id IS NULL OR agency_members subquery` |
| `halevai_conversations` | ✅ | ALL: agency_members subquery |
| `halevai_messages` | ✅ | ALL: nested conversation → agency_members subquery |
| `halevai_recommendations` | ✅ | ALL: agency_members subquery |
| `inbound_messages` | ✅ | SELECT/UPDATE: `is_agency_member()` (no INSERT/DELETE for users) |
| `landing_page_events` | ✅ | SELECT: agency_members subquery, INSERT: public with validation |
| `landing_pages` | ✅ | ALL: agency_members subquery |
| `locations` | ✅ | ALL: agency_members subquery |
| `message_log` | ✅ | SELECT: `is_agency_member()`, INSERT: `is_owner_or_admin()` |
| `notifications` | ✅ | ALL: `user_id = auth.uid()` |
| `onboarding` | ✅ | ALL: `user_id = auth.uid()` |
| `pay_rate_intel` | ✅ | SELECT: `is_agency_member()`, ALL: `is_owner_or_admin()` |
| `phone_screens` | ✅ | ALL: agency_members subquery |
| `profiles` | ✅ | INSERT: `user_id = auth.uid()`, SELECT/UPDATE: `user_id = auth.uid()` |
| `referral_sources` | ✅ | ALL: agency_members subquery |
| `review_requests` | ✅ | ALL: agency_members subquery |
| `reviews` | ✅ | ALL: agency_members subquery |
| `saved_campaign_templates` | ✅ | ALL: agency_members subquery |
| `sequence_enrollments` | ✅ | ALL: agency_members subquery |
| `sequence_steps` | ✅ | ALL: agency_members subquery |
| `sourced_candidates` | ✅ | ALL: agency_members subquery |
| `sourcing_campaigns` | ✅ | ALL: agency_members subquery |

### Database Functions

```sql
-- Agency membership checks
CREATE FUNCTION public.get_user_agency_id() RETURNS uuid;
CREATE FUNCTION public.is_agency_member(_user_id uuid, _agency_id uuid) RETURNS boolean;
CREATE FUNCTION public.has_agency_role(_user_id uuid, _agency_id uuid, _role agency_role) RETURNS boolean;
CREATE FUNCTION public.is_owner_or_admin(_user_id uuid, _agency_id uuid) RETURNS boolean;
CREATE FUNCTION public.is_write_role(_user_id uuid, _agency_id uuid) RETURNS boolean;
CREATE FUNCTION public.get_user_agency_role(_user_id uuid, _agency_id uuid) RETURNS agency_role;

-- Utility
CREATE FUNCTION public.handle_new_user() RETURNS trigger; -- auto-creates profile
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger;
CREATE FUNCTION public.check_landing_page_event_rate_limit() RETURNS trigger; -- 60/min limit
```

### Enums

```sql
CREATE TYPE public.agency_role AS ENUM ('owner', 'admin', 'operations_manager', 'intake_coordinator', 'viewer');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'intake_started', 'enrollment_pending', 'authorized', 'active');
CREATE TYPE public.lead_source AS ENUM ('facebook', 'google', 'indeed', 'craigslist', 'referral', 'landing_page', 'manual', 'walk_in', 'community_event', 'social_media', 'sourcing');
CREATE TYPE public.campaign_type AS ENUM ('recruitment', 'retention', 'brand_awareness', 'referral');
```

---

## 7. Supabase Types

The full auto-generated types file is at `src/integrations/supabase/types.ts` (2,595 lines). It contains Row, Insert, Update types for all 31+ tables plus Enums and Relationships. This file is **read-only** and auto-updated by the Supabase integration.

---

## 8. Design System

### index.css

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 225 25% 6%;
    --foreground: 210 40% 95%;
    --card: 225 25% 9%;
    --card-foreground: 210 40% 95%;
    --popover: 225 25% 9%;
    --popover-foreground: 210 40% 95%;
    --primary: 195 100% 50%;
    --primary-foreground: 225 25% 6%;
    --secondary: 225 20% 14%;
    --secondary-foreground: 210 40% 95%;
    --muted: 225 20% 14%;
    --muted-foreground: 225 15% 55%;
    --accent: 270 80% 60%;
    --accent-foreground: 210 40% 95%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 225 20% 16%;
    --input: 225 20% 16%;
    --ring: 195 100% 50%;
    --radius: 0.75rem;
    --sidebar-background: 225 25% 8%;
    --sidebar-foreground: 225 15% 65%;
    --sidebar-primary: 195 100% 50%;
    --sidebar-primary-foreground: 225 25% 6%;
    --sidebar-accent: 225 20% 14%;
    --sidebar-accent-foreground: 210 40% 95%;
    --sidebar-border: 225 20% 14%;
    --sidebar-ring: 195 100% 50%;
    --halevai-cyan: 195 100% 50%;
    --halevai-purple: 270 80% 60%;
    --halevai-navy: 225 25% 6%;
  }
}

/* Utility classes: .halevai-glow, .halevai-border, .halevai-text, .halevai-bg-gradient, .font-data */
```

### tailwind.config.ts

- Fonts: `Space Grotesk` (sans), `IBM Plex Mono` (data)
- Colors: All semantic tokens from CSS vars (background, foreground, primary, secondary, muted, accent, destructive, card, popover, sidebar, halevai.cyan/purple/navy)
- Custom animations: `accordion-down`, `accordion-up`, `pulse-glow`

---

## 9. Edge Function Config

```toml
project_id = "jpyjqnucuebmknnykmyf"

[functions.halevai-chat]
verify_jwt = false

[functions.campaign-optimizer]
verify_jwt = false

[functions.generate-content]
verify_jwt = false

[functions.generate-landing-content]
verify_jwt = false

[functions.generate-creative]
verify_jwt = false

[functions.post-to-ads]
verify_jwt = false

[functions.discover-sources]
verify_jwt = false

[functions.run-automations]
verify_jwt = false

[functions.generate-briefing]
verify_jwt = false

[functions.score-leads]
verify_jwt = false

[functions.analyze-pay-rates]
verify_jwt = false

[functions.send-message]
verify_jwt = false

[functions.source-candidates]
verify_jwt = false

[functions.trigger-outreach]
verify_jwt = false

[functions.ai-phone-screen]
verify_jwt = false

[functions.webhook-inbound]
verify_jwt = false

[functions.cron-trigger]
verify_jwt = false

[functions.sync-ad-metrics]
verify_jwt = false
```

---

## 10. pg_cron Job SQL

> **Status**: Not yet installed. The `cron-trigger` edge function is deployed and ready. To enable scheduled jobs, run the following SQL via `supabase--insert` (contains project-specific data):

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Run automations every 15 minutes
SELECT cron.schedule(
  'run-automations-every-15m',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=automations',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Generate daily briefing at 7 AM UTC
SELECT cron.schedule(
  'daily-briefing-7am',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=briefing',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Score leads every hour
SELECT cron.schedule(
  'score-leads-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=scoring',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Process sequences every 30 minutes
SELECT cron.schedule(
  'process-sequences-30m',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=sequences',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Sync ad metrics every 6 hours
SELECT cron.schedule(
  'sync-ads-every-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=sync-ads',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

Replace `YOUR_CRON_SECRET` with the value stored in the `CRON_SECRET` project secret.

---

## 11. Environment Variables per Function

| Function | SUPABASE_URL | SUPABASE_SERVICE_ROLE_KEY | SUPABASE_ANON_KEY | SUPABASE_PUBLISHABLE_KEY | LOVABLE_API_KEY | FIRECRAWL_API_KEY | CRON_SECRET |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ai-phone-screen | ✅ | ✅ | | | ✅ | | |
| analyze-pay-rates | ✅ | ✅ | ✅ | | ✅ | ✅ | |
| campaign-optimizer | ✅ | ✅ | ✅ | | ✅ | | |
| cron-trigger | ✅ | ✅ | | | | | ✅ |
| discover-sources | ✅ | ✅ | ✅ | | ✅ | | |
| generate-briefing | ✅ | ✅ | | | | | |
| generate-content | ✅ | ✅ | ✅ | | ✅ | | |
| generate-creative | ✅ | ✅ | ✅ | | ✅ | | |
| generate-landing-content | ✅ | ✅ | ✅ | | ✅ | | |
| halevai-chat | ✅ | ✅ | | ✅ | ✅ | | |
| post-to-ads | ✅ | ✅ | ✅ | | ✅ | | |
| run-automations | ✅ | ✅ | | | | | |
| score-leads | ✅ | ✅ | | | | | |
| send-message | ✅ | ✅ | | | | | |
| source-candidates | ✅ | ✅ | | | | | |
| sync-ad-metrics | ✅ | ✅ | | | | | |
| trigger-outreach | ✅ | ✅ | | | | | |
| webhook-inbound | ✅ | ✅ | | | | | |

### Per-Agency API Keys (stored in `api_keys` table)

| Key Name | Used By |
|----------|---------|
| `bland_ai_api_key` | ai-phone-screen |
| `twilio_account_sid` | send-message |
| `twilio_auth_token` | send-message |
| `twilio_phone_number` | send-message, webhook-inbound |
| `sendgrid_api_key` | send-message |
| `sendgrid_inbound_domain` | webhook-inbound |
| `clay_api_key` | source-candidates |
| `ghl_api_key` | trigger-outreach |
| `ghl_subaccount_id` | trigger-outreach |
| `facebook_access_token` | post-to-ads, sync-ad-metrics |
| `facebook_ad_account_id` | post-to-ads |
| `google_ads_developer_token` | post-to-ads |
| `google_ads_client_id` | post-to-ads |
| `google_ads_client_secret` | post-to-ads |
| `google_ads_refresh_token` | post-to-ads |
| `google_ads_api_key` | sync-ad-metrics |
| `indeed_api_key` | post-to-ads |
| `ziprecruiter_api_key` | post-to-ads |

---

## 12. Edge Function Request/Response Contracts

### ai-phone-screen
```ts
// Request
{ agency_id: string; sourced_candidate_id?: string; caregiver_id?: string; phone_number: string; state?: string }

// Response
{ success: boolean; mock: boolean; screen_id: string; call_id?: string; message?: string }
```

### analyze-pay-rates
```ts
// Request (auth required)
{ agency_id: string; state?: string; county?: string }

// Response
{ success: boolean; recommended_rate: number; medicaid_reimbursement_rate: number; market_avg_rate: number; market_min_rate: number; market_max_rate: number; analysis_summary: string; competitor_count: number; state: string; county: string | null }
```

### campaign-optimizer
```ts
// Request (auth required)
{ mode: "template"|"optimization"|"full_package"|"initial_strategy"|"playbook_execution"; agencyId: string; campaignId?: string; platforms?: string[]; campaignDetails?: any; playbookId?: string }

// Response
{ mode: string; result: any } // Shape depends on mode
```

### cron-trigger
```ts
// Request (x-cron-secret header)
// Query param: ?job=automations|briefing|scoring|sequences|sync-ads

// Response
{ job: string; agencies_processed: number; results: Array<{ agency: string; job: string; success: boolean; data?: any; error?: string }> }
```

### generate-briefing
```ts
// Request
{ agencyId: string; userId?: string | null }

// Response
{ results: Array<{ agency: string; id?: string; message?: string; error?: string }> }
```

### generate-content
```ts
// Request (auth required)
{ agencyId: string; platforms?: string[]; topic?: string; state?: string; language?: string; count?: number }

// Response
{ posts: Array<{ platform: string; title: string; body: string; hashtags: string[]; image_prompt: string; suggested_posting_time?: string }> }
```

### generate-creative
```ts
// Request (auth required)
{ agencyId: string; prompt: string; platform?: string; campaignId?: string }

// Response
{ headline: string; body_copy: string; prompt: string; platform: string; image_url: string | null }
```

### generate-landing-content
```ts
// Request (auth required)
{ agencyId: string; state?: string; county?: string; language?: string }

// Response
{ hero_headline: string; hero_subheadline: string; hero_cta_text: string; benefits: Array<{ icon?: string; title: string; description: string }>; testimonials?: Array<{ quote: string; name: string; role?: string }>; faq: Array<{ question: string; answer: string }>; pay_rate_highlight: string; meta_title: string; meta_description: string }
```

### halevai-chat
```ts
// Request (auth required)
{ messages: Array<{ role: "user"|"assistant"; content: string }> }

// Response: SSE stream (text/event-stream) with OpenAI-compatible chunks
```

### post-to-ads
```ts
// Request (auth required)
{ action: "check_credentials"|"post"; agencyId: string; campaignId?: string; platform?: string; content?: any }

// Response (check_credentials)
{ platforms: Record<string, { connected: boolean; missingKeys: string[]; setupUrl: string }> }

// Response (post)
{ success: boolean; externalId?: string; message?: string; manual?: boolean; posting?: any; simulated?: boolean; platform: string }
```

### run-automations
```ts
// Request
{ agencyId: string } // or "all"

// Response
{ results: Array<{ agency: string; results: Array<{ key: string; actions: number }> }> }
```

### score-leads
```ts
// Request
{ agencyId: string }

// Response
{ scored: number }
```

### send-message
```ts
// Request
{ agency_id: string; channel: "sms"|"email"|"in_app"; to: string; subject?: string; body: string; template?: string; related_type?: string; related_id?: string; user_id?: string }

// Response
{ success: boolean; message_id: string | null; status: string; mock: boolean; error?: string }
```

### source-candidates
```ts
// Request
{ agency_id: string; campaign_id: string; mode: "search"|"enrich" }

// Response
{ success: boolean; mock: boolean; candidates_created: number; candidates_enriched: number }
```

### sync-ad-metrics
```ts
// Request
{ agencyId: string; campaignId?: string }

// Response
{ synced: number; total: number; results: Array<{ campaign_id: string; name: string; synced: boolean; metrics?: any; reason?: string; error?: string }> }
```

### trigger-outreach
```ts
// Request
{ agency_id: string; sourced_candidate_ids: string[]; sequence_type: "caregiver_cold"|"poaching" }

// Response
{ success: boolean; mock: boolean; sent: number }
```

### webhook-inbound
```ts
// Request: Twilio form-urlencoded (From, To, Body, MessageSid) OR SendGrid JSON (envelope, from, text, subject)
// Response: TwiML <Response></Response> or "OK"
```

---

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `ad-creatives` | Yes | AI-generated ad images |

---

## Configured Secrets

| Secret | Purpose |
|--------|---------|
| `LOVABLE_API_KEY` | AI gateway (Gemini, GPT) |
| `FIRECRAWL_API_KEY` | Web scraping for pay rate analysis |
| `SUPABASE_URL` | Auto-configured |
| `SUPABASE_ANON_KEY` | Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configured |
| `SUPABASE_DB_URL` | Auto-configured |
| `SUPABASE_PUBLISHABLE_KEY` | Auto-configured |
| `CRON_SECRET` | **Not yet configured** — needed for cron-trigger auth |

---

*End of handoff document.*
