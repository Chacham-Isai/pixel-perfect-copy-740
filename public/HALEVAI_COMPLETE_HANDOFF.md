# Halevai.ai — Complete Technical Handoff Document
**Generated: 2026-02-26**
**Version: Production**

---

## Table of Contents

1. [File Tree](#1-file-tree)
2. [Route Map](#2-route-map)
3. [Component Dependency Graph](#3-component-dependency-graph)
4. [Full Source: useAuth.tsx](#4-useauthtsx)
5. [Full Source: useAgencyData.ts](#5-useagencydatats)
6. [Full Source: permissions.ts](#6-permissionsts)
7. [Full Source: formatters.ts](#7-formattersts)
8. [Full Source: validations.ts](#8-validationsts)
9. [Full Source: index.css (Design Tokens)](#9-indexcss)
10. [Edge Functions — Full Source & Contracts](#10-edge-functions)
11. [Database Migrations (SQL)](#11-database-migrations)
12. [RLS Policies](#12-rls-policies)
13. [Supabase Types](#13-supabase-types)
14. [config.toml](#14-configtoml)
15. [pg_cron Jobs](#15-pg_cron-jobs)
16. [Environment Variables Per Function](#16-environment-variables)

---

## 1. File Tree

```
src/
├── App.css
├── App.tsx
├── main.tsx
├── vite-env.d.ts
├── index.css
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
│   ├── utils.ts
│   └── validations.ts
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

| Path | Component | Protected? | Description |
|------|-----------|-----------|-------------|
| `/` | `Index` | No | Landing/redirect page |
| `/auth` | `Auth` | No | Login/signup |
| `/reset-password` | `ResetPassword` | No | Password reset |
| `/lp/:slug` | `PublicLandingPage` | No | Public caregiver landing pages |
| `/onboarding` | `Onboarding` | ✅ | Agency setup wizard |
| `/dashboard` | `Dashboard` | ✅ | Main dashboard |
| `/caregivers` | `Caregivers` | ✅ | Caregiver CRM pipeline |
| `/halevai` | `HalevaiChat` | ✅ | AI strategy chat |
| `/enrollment` | `Enrollment` | ✅ | Enrollment tracker |
| `/campaigns` | `Campaigns` | ✅ | Campaign hub |
| `/campaign-builder` | `CampaignBuilder` | ✅ | Create campaigns |
| `/competitors` | `Competitors` | ✅ | Competitor intel |
| `/reviews` | `Reviews` | ✅ | Review management |
| `/recommendations` | `Recommendations` | ✅ | AI recommendations |
| `/playbooks` | `Playbooks` | ✅ | Growth playbooks |
| `/briefing` | `Briefing` | ✅ | Daily briefing |
| `/talent-sourcing` | `TalentSourcing` | ✅ | Sourcing pipeline |
| `/content` | `ContentCalendar` | ✅ | Content calendar |
| `/landing-pages` | `LandingPages` | ✅ | Landing page manager |
| `/creatives` | `AdCreatives` | ✅ | AI ad creative generator |
| `/automations` | `Automations` | ✅ | Automation engine |
| `/settings` | `Settings` | ✅ | Settings (profile, branding, team, integrations) |
| `/inbox` | `Inbox` | ✅ | Unified messaging inbox |
| `*` | `NotFound` | No | 404 |

---

## 3. Component Dependency Graph

### Pages → Components & Hooks

| Page | Components | Hooks |
|------|-----------|-------|
| `Dashboard` | `AppLayout`, Card, Badge, Progress, Recharts | `useCaregivers`, `useCampaigns`, `useReviews`, `useActivityLog`, `useAuth`, `usePageTitle` |
| `Caregivers` | `AppLayout`, Card, Badge, Dialog, Tabs, Select, Input | `useCaregivers`, `useAuth`, `usePageTitle`, `useDebouncedValue` |
| `HalevaiChat` | `AppLayout`, Card, Textarea, ScrollArea, react-markdown | `useAuth`, `usePageTitle` |
| `Campaigns` | `AppLayout`, Card, Badge, Tabs, Breadcrumb, Table | `useCampaigns`, `useAuth`, `usePageTitle` |
| `CampaignBuilder` | `AppLayout`, Card, Select, Input, Tabs, Dialog | `useAuth`, `usePageTitle` |
| `Competitors` | `AppLayout`, Card, Badge, Dialog, Input | `useCompetitors`, `usePayRateIntel`, `useAuth`, `usePageTitle` |
| `Reviews` | `AppLayout`, Card, Badge, Dialog | `useReviews`, `useAuth`, `usePageTitle` |
| `Recommendations` | `AppLayout`, Card, Badge | `useRecommendations`, `useAuth`, `usePageTitle` |
| `Playbooks` | `AppLayout`, Card, Badge, Dialog | `usePlaybooks`, `useAuth`, `usePageTitle` |
| `Briefing` | `AppLayout`, Card | `useAuth`, `usePageTitle` |
| `TalentSourcing` | `AppLayout`, Card, Badge, Tabs, Dialog | `useSourcingCampaigns`, `useSourcedCandidates`, `usePhoneScreens`, `useAuth`, `usePageTitle` |
| `ContentCalendar` | `AppLayout`, Card, Badge, Calendar, Dialog | `useContentPosts`, `useAuth`, `usePageTitle` |
| `LandingPages` | `AppLayout`, Card, Badge, Dialog | `useLandingPages`, `useAuth`, `usePageTitle` |
| `AdCreatives` | `AppLayout`, Card, Dialog, Select, Textarea | `useAdCreatives`, `useAuth`, `usePageTitle` |
| `Automations` | `AppLayout`, Card, Switch, Badge | `useAutomations`, `useToggleAutomation`, `useAuth`, `usePageTitle` |
| `Settings` | `AppLayout`, Card, Tabs, Input, `TeamMembers`, `IntegrationsTab` | `useAgency`, `useBusinessConfig`, `useAuth`, `usePageTitle` |
| `Inbox` | `AppLayout`, Card, Badge, Breadcrumb, `ComposeMessageDialog` | `useConversationThreads`, `useThreadMessages`, `useAuth`, `usePageTitle` |
| `Enrollment` | `AppLayout`, Card, Badge | `useCaregivers`, `useAuth`, `usePageTitle` |
| `Onboarding` | Card, Input, Select | `useAuth`, `usePageTitle` |
| `PublicLandingPage` | (standalone, no AppLayout) | supabase client directly |
| `Auth` | Card, Input, Tabs | supabase auth |
| `ResetPassword` | Card, Input | supabase auth |

### Shared Components

| Component | Used By |
|-----------|--------|
| `AppLayout` | All protected pages (wraps sidebar + header + command palette) |
| `AppSidebar` | `AppLayout` |
| `NavLink` | `AppSidebar` |
| `NotificationBell` | `AppLayout` header |
| `PermissionGate` | Pages needing role-based UI hiding |
| `ProtectedRoute` | `App.tsx` router wrapper |
| `ComposeMessageDialog` | `Inbox`, `Caregivers` |
| `IntegrationsTab` | `Settings` |
| `TeamMembers` | `Settings` |
| `SequenceBuilder` | `Automations` |

---

## 4. useAuth.tsx

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
  session: null, user: null, loading: true,
  agencyId: null, agencyRole: null, isViewer: false,
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
      setSession(s); setUser(s?.user ?? null); setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s); setUser(s?.user ?? null); setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("agency_members").select("agency_id, role")
        .eq("user_id", user.id).limit(1).single()
        .then(({ data }) => {
          setAgencyId(data?.agency_id ?? null);
          setAgencyRole((data?.role as AgencyRole) ?? null);
        });
    } else { setAgencyId(null); setAgencyRole(null); }
  }, [user]);

  const isViewer = agencyRole === "viewer";
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ session, user, loading, agencyId, agencyRole, isViewer, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 5. useAgencyData.ts

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

// === Type Exports ===
export type Agency = Tables<"agencies">;
export type Caregiver = Tables<"caregivers">;
export type Campaign = Tables<"campaigns">;
export type Competitor = Tables<"competitors">;
export type Review = Tables<"reviews">;
export type ContentPost = Tables<"content_posts">;
export type LandingPage = Tables<"landing_pages">;
export type SourcingCampaign = Tables<"sourcing_campaigns">;
export type SourcedCandidate = Tables<"sourced_candidates">;
export type AutomationConfig = Tables<"automation_configs">;
export type Recommendation = Tables<"halevai_recommendations">;
export type Playbook = Tables<"growth_playbooks">;
export type ActivityLog = Tables<"activity_log">;
export type AdCreative = Tables<"ad_creatives">;
export type BusinessConfig = Tables<"business_config">;

// === Generic agency-scoped query ===
function useAgencyQuery<T>(key: string, table: string, options?) {
  const { agencyId } = useAuth();
  return useQuery({
    queryKey: [key, agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      let q = supabase.from(table).select("*").eq("agency_id", agencyId);
      if (options?.filters) Object.entries(options.filters).forEach(([k, v]) => {
        if (Array.isArray(v)) q = q.in(k, v); else q = q.eq(k, v);
      });
      if (options?.orderBy) q = q.order(options.orderBy, { ascending: options.ascending ?? false });
      if (options?.limit) q = q.limit(options.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as T[];
    },
    enabled: !!agencyId,
  });
}

// === Exported Hooks ===
export const useAgency = () => { /* single agency by id */ };
export const useCaregivers = () => useAgencyQuery<Caregiver>("caregivers", "caregivers", { orderBy: "created_at" });
export const useCampaigns = () => useAgencyQuery<Campaign>("campaigns", "campaigns", { orderBy: "created_at" });
export const useCompetitors = () => useAgencyQuery<Competitor>("competitors", "competitors", { orderBy: "created_at" });
export const useReviews = () => useAgencyQuery<Review>("reviews", "reviews", { orderBy: "created_at" });
export const useContentPosts = () => useAgencyQuery<ContentPost>("content_posts", "content_posts", { orderBy: "scheduled_date" });
export const useLandingPages = () => useAgencyQuery<LandingPage>("landing_pages", "landing_pages");
export const useSourcingCampaigns = () => useAgencyQuery<SourcingCampaign>("sourcing_campaigns", "sourcing_campaigns", { orderBy: "created_at" });
export const useSourcedCandidates = () => useAgencyQuery<SourcedCandidate>("sourced_candidates", "sourced_candidates", { orderBy: "created_at" });
export const useAutomations = () => useAgencyQuery<AutomationConfig>("automations", "automation_configs");
export const useRecommendations = () => useAgencyQuery<Recommendation>("recommendations", "halevai_recommendations", { orderBy: "created_at" });
export const usePlaybooks = () => { /* global + agency-specific playbooks via .or() */ };
export const useActivityLog = () => useAgencyQuery<ActivityLog>("activity_log", "activity_log", { orderBy: "created_at", limit: 20 });
export const useAdCreatives = () => useAgencyQuery<AdCreative>("ad_creatives", "ad_creatives", { orderBy: "created_at" });
export const useBusinessConfig = () => { /* single row by agency_id */ };
export const useReferralSources = () => useAgencyQuery("referral_sources", "referral_sources", { orderBy: "created_at" });
export const useCampaignTemplates = () => useAgencyQuery("campaign_templates", "saved_campaign_templates", { orderBy: "created_at" });
export const useCampaignSequences = () => useAgencyQuery("campaign_sequences", "campaign_sequences", { orderBy: "created_at" });
export const useSequenceSteps = (sequenceId?) => { /* filtered by sequence_id */ };
export const useSequenceEnrollments = () => useAgencyQuery("sequence_enrollments", "sequence_enrollments", { orderBy: "started_at" });
export const useCampaignPackages = () => useAgencyQuery("campaign_packages", "campaign_packages", { orderBy: "created_at" });
export const useLandingPageEvents = () => useAgencyQuery("landing_page_events", "landing_page_events", { orderBy: "created_at" });
export const useReviewRequests = () => useAgencyQuery("review_requests", "review_requests", { orderBy: "sent_at" });
export const useAgencyMembers = () => { /* agency_members by agency_id */ };
export const usePayRateIntel = () => { /* latest pay_rate_intel for agency */ };
export const useToggleAutomation = () => { /* mutation: update automation_configs.active */ };
export const useApiKeys = () => { /* api_keys by agency_id */ };
export const useMessageLog = (limit = 50) => { /* message_log by agency_id */ };
export const useSaveApiKey = () => { /* mutation: upsert api_keys */ };
export const useTestConnection = () => { /* mutation: invoke send-message with __test__ */ };
export const useAgentActivityLog = () => useAgencyQuery("agent_activity_log", "agent_activity_log", { orderBy: "created_at", limit: 50 });
export const usePhoneScreens = () => useAgencyQuery("phone_screens", "phone_screens", { orderBy: "created_at" });
export const useConversationThreads = () => useAgencyQuery("conversation_threads", "conversation_threads", { orderBy: "last_message_at" });
export const useUnreadCount = () => { /* sum of unread_count from open threads */ };
export const useThreadMessages = (contactPhone, contactEmail, channel) => { /* merged outbound + inbound */ };
export const useInboundMessages = () => useAgencyQuery("inbound_messages", "inbound_messages", { orderBy: "created_at", limit: 50 });
```

---

## 6. permissions.ts

```typescript
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

export function hasPermission(role: string | null, action: PermissionAction): boolean { ... }
export function isWriteRole(role: string | null): boolean { ... }
export const ROLE_LABELS: Record<AgencyRole, string> = { ... };
export const ROLE_COLORS: Record<AgencyRole, string> = { ... };
```

---

## 7. formatters.ts

```typescript
export function normalizePhone(input: string): string { /* → +1XXXXXXXXXX */ }
export function formatPhone(e164: string): string { /* → (XXX) XXX-XXXX */ }
export function formatCurrency(amount: number, style: "full" | "compact" | "rate"): string { ... }
export function formatTimeAgo(date: string | Date): string { /* → "2 hours ago" */ }
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["contacted"],
  contacted: ["intake_started", "new"],
  intake_started: ["enrollment_pending", "contacted"],
  enrollment_pending: ["authorized", "intake_started"],
  authorized: ["active", "enrollment_pending"],
  active: [],
};
export function isValidStatusTransition(from: string, to: string): boolean { ... }
```

---

## 8. validations.ts

```typescript
// Zod schemas:
export const addCaregiverSchema = z.object({ full_name, phone, email, state, county, city, language_primary, source, notes });
export const campaignDetailsSchema = z.object({ name, type, states, county, language, budget, dateFrom, dateTo, targetCPA, autoPause });
export const composeMessageSchema = z.object({ to, subject, body });
export const agencyProfileSchema = z.object({ name, phone, email, website_url, office_address });
export const sourcingCampaignSchema = z.object({ name, state, county, language, max });
export function formatZodErrors(result): string | null { ... }
```

---

## 9. index.css

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  --background: 225 25% 6%;
  --foreground: 210 40% 95%;
  --card: 225 25% 9%;
  --card-foreground: 210 40% 95%;
  --popover: 225 25% 9%;
  --popover-foreground: 210 40% 95%;
  --primary: 195 100% 50%;         /* Halevai Cyan */
  --primary-foreground: 225 25% 6%;
  --secondary: 225 20% 14%;
  --secondary-foreground: 210 40% 95%;
  --muted: 225 20% 14%;
  --muted-foreground: 225 15% 55%;
  --accent: 270 80% 60%;           /* Halevai Purple */
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

/* Utilities: .halevai-glow, .halevai-border, .halevai-text, .halevai-bg-gradient, .font-data */
```

---

## 10. Edge Functions — Full Source & Contracts

### 10.1 halevai-chat

**Request:** `{ messages: {role, content}[] }` (auth header required)
**Response:** SSE stream (text/event-stream)
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`
**Logic:** Fetches 24 parallel queries for live agency context → builds system prompt with all KPIs → streams via Lovable AI (gemini-3-flash-preview)

### 10.2 campaign-optimizer

**Request:** `{ mode: "template"|"optimization"|"full_package"|"initial_strategy"|"playbook_execution", agencyId, campaignId?, platforms?, campaignDetails?, playbookId? }`
**Response:** `{ mode, result: {...} }` — tool-called structured JSON per mode
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Logic:** Multi-mode AI generation. `playbook_execution` creates real campaign + recommendation records.

### 10.3 generate-content

**Request:** `{ agencyId, platforms?: string[], topic?, state?, language?, count? }`
**Response:** `{ posts: [{platform, title, body, hashtags, image_prompt, suggested_posting_time}] }`
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 10.4 generate-landing-content

**Request:** `{ agencyId, state?, county?, language? }`
**Response:** `{ hero_headline, hero_subheadline, hero_cta_text, benefits[], testimonials[], faq[], pay_rate_highlight, meta_title, meta_description }`
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 10.5 generate-creative

**Request:** `{ agencyId, prompt, platform?, campaignId? }`
**Response:** `{ headline, body_copy, prompt, platform, image_url }`
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Logic:** Step 1: AI generates copy + image_prompt (gemini-3-flash-preview). Step 2: generates image (gemini-2.5-flash-image) → uploads to `ad-creatives` storage bucket. Now data-driven: pulls business_config, pay_rate_intel, top campaigns, and recent creatives.

### 10.6 post-to-ads

**Request:** `{ action: "check_credentials"|"post", agencyId, campaignId?, platform?, content? }`
**Response (check):** `{ platforms: { facebook: {connected, missingKeys, setupUrl}, ... } }`
**Response (post):** `{ success, externalId?, platform, message?, manual?, posting? }`
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Platforms:** Facebook (real API), Google Ads (OAuth flow), Indeed (API), Craigslist (AI-generated manual copy), ZipRecruiter

### 10.7 discover-sources

**Request:** `{ agencyId, state?, county?, language?, sourceTypes? }`
**Response:** `{ sources[], discovery_summary, total_discovered, total_saved, duplicates_skipped }`
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Logic:** AI discovers referral sources → deduplicates against existing → inserts into `referral_sources`

### 10.8 run-automations

**Request:** `{ agencyId: string | "all" }`
**Response:** `{ results: [{ agency, results: [{key, actions}] }] }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Handlers (12):**
- `lead_scoring` / `auto_lead_scoring` → score unscored caregivers, SMS HOT leads
- `follow_up_reminders` / `auto_followup_sms` → 4-stage progressive follow-up
- `performance_alerts` / `campaign_pause_alerts` → spend threshold notifications
- `stale_enrollment_alerts` → SMS/email nudge after 14 days
- `auto_welcome_sms` → welcome SMS to new leads within 24h
- `auto_source_candidates` → run active sourcing campaigns
- `auto_outreach_high_match` → trigger outreach for match_score ≥ 70
- `auto_screen_responded` → AI phone screen for responded candidates
- `auto_review_request` → review solicitation for active caregivers
- `background_check_reminder` → alert after 7 days pending
- `auth_expiry_alert` → 30-day authorization expiry warning
- `process_sequences` → advanced sequence engine (message, condition, wait, action steps)

### 10.9 generate-briefing

**Request:** `{ agencyId: string | "all", userId? }`
**Response:** `{ results: [{ agency, id }] }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Logic:** Generates daily briefing with pipeline stats, campaign performance, action items, wins. Idempotent per day.

### 10.10 score-leads

**Request:** `{ agencyId }`
**Response:** `{ scored: number }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Scoring:** phone(8) + email(7) + state(5) + county(5) + currently_caregiving(10) + experience(1-5) + patient_name(8) + medicaid_id(7) + active_medicaid(5) + transportation(5) + availability(5) + recency(4-10) + bg_check(5) + engagement(5-10). Tier: HOT≥70, WARM≥40, COLD<40.

### 10.11 analyze-pay-rates

**Request:** `{ agency_id, state?, county? }`
**Response:** `{ success, recommended_rate, medicaid_reimbursement_rate, market_avg_rate, market_min_rate, market_max_rate, analysis_summary }`
**Env:** `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FIRECRAWL_API_KEY` (optional)
**Logic:** Scrapes web via Firecrawl (if key present) → combines with DB competitor data → AI analysis → upserts `pay_rate_intel`

### 10.12 send-message

**Request:**
```typescript
interface SendMessagePayload {
  agency_id: string;
  channel: "sms" | "email" | "in_app";
  to: string;
  subject?: string;
  body: string;
  template?: string;
  related_type?: string;
  related_id?: string;
  user_id?: string; // required for in_app
}
```
**Response:** `{ success, message_id, status, mock, error? }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Integrations:** Twilio (SMS via api_keys: `twilio_account_sid`, `twilio_auth_token`, `twilio_phone_number`), SendGrid (email via `sendgrid_api_key`), in_app (inserts notification). Uses branded HTML email templates from `business_config`.

### 10.13 source-candidates

**Request:** `{ agency_id, campaign_id, mode: "search"|"enrich" }`
**Response:** `{ success, mock, candidates_created?, candidates_enriched? }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Integrations:** Clay API (via `clay_api_key`). Falls back to mock data if not connected.

### 10.14 trigger-outreach

**Request:** `{ agency_id, sourced_candidate_ids: string[], sequence_type: "caregiver_cold"|"poaching" }`
**Response:** `{ success, mock, sent }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Integrations:** GoHighLevel (via `ghl_api_key`, `ghl_subaccount_id`). Has built-in 5-step and 5-step outreach sequences with merge fields.

### 10.15 webhook-inbound

**Request:** Twilio SMS (form-urlencoded) or SendGrid Inbound Parse (JSON/multipart)
**Response:** `<Response></Response>` (TwiML) or `"OK"`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Logic:** Matches inbound to agency via api_keys → matches to caregiver/sourced_candidate → creates `inbound_messages` record → upserts `conversation_threads` → creates notifications → auto-detects YES/STOP keywords → updates caregiver status / cancels sequences.

### 10.16 ai-phone-screen

**Request:** `{ agency_id, sourced_candidate_id?, caregiver_id?, phone_number, state? }`
**Response:** `{ success, mock, screen_id, call_id? }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
**Integrations:** Bland AI (via `bland_ai_api_key`). Polls call status every 15s up to 10min. AI analyzes transcript → scores 0-100 → auto-promotes if score ≥ 70 + "advance" recommendation.

### 10.17 cron-trigger

**Request:** `?job=automations|briefing|scoring|sequences|sync-ads` (header: `x-cron-secret`)
**Response:** `{ job, agencies_processed, results[] }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
**Logic:** Dispatcher that runs specified job for all agencies. Validates cron secret header.

### 10.18 sync-ad-metrics

**Request:** `{ agencyId, campaignId? }`
**Response:** `{ synced, total, results[] }`
**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
**Logic:** Pulls Facebook Marketing API insights for campaigns with `external_id`. Updates spend/impressions/clicks/conversions/CPA. Google Ads placeholder.

---

## 11. Database Migrations

### Migration 1: `20260226032902` — Foundation Schema
- Creates enums: `agency_role`, `lead_status`, `lead_source`, `campaign_type`
- Creates 22 tables: agencies, agency_members, profiles, onboarding, caregivers, caregiver_activities, campaigns, competitors, halevai_recommendations, halevai_conversations, halevai_messages, content_posts, landing_pages, reviews, locations, business_config, automation_configs, activity_log, daily_briefings, growth_playbooks, ad_creatives, notifications, sourcing_campaigns, sourced_candidates, phone_screens
- Creates functions: `get_user_agency_id()`, `has_agency_role()`, `is_agency_member()`, `handle_new_user()`, `update_updated_at_column()`
- Creates trigger: `on_auth_user_created` → auto-create profile
- Creates update triggers for agencies, caregivers, campaigns, profiles
- Creates RLS policies for all tables

### Migration 2: `20260226032915` — Fix Agency Insert Policy
- Re-creates "Authenticated can create agency" policy with `TO authenticated`

### Migration 3: `20260226035020` — Phase 2 Tables
- Creates 8 tables: referral_sources, saved_campaign_templates, campaign_sequences, sequence_steps, sequence_enrollments, campaign_packages, landing_page_events, review_requests
- All with RLS policies

### Migration 4: `20260226044350` — Ad Creative Storage
- Creates `ad-creatives` storage bucket (public)
- Storage policies for SELECT/INSERT/UPDATE/DELETE

### Migration 5: `20260226132123` — pg_cron Extension
- `CREATE EXTENSION IF NOT EXISTS pg_cron`
- `CREATE EXTENSION IF NOT EXISTS pg_net`

### Migration 6: `20260226132905` — Pay Rate Intel
- Creates `pay_rate_intel` table with index and update trigger

### Migration 7: `20260226134103` — pg_cron (re-enable)
- Repeats pg_cron/pg_net extension creation

### Migration 8: `20260226134419` — Security Tightening
- Tightens agencies INSERT policy to authenticated only
- Adds validation to landing_page_events INSERT policy

### Migration 9: `20260226135219` — RBAC + Viewer Role
- Adds `viewer` to agency_role enum
- Creates `get_user_agency_role()`, `is_owner_or_admin()` functions
- Splits RLS on competitors, pay_rate_intel, campaigns, automation_configs, business_config into SELECT (all members) + ALL (owner/admin only)
- Adds `Owners can update members` policy
- Creates rate-limiting trigger on landing_page_events (60/min)

### Migration 10: `20260226140252` — Messaging Infrastructure
- Creates `api_keys` table with owner/admin-only policies
- Creates `message_log` table
- Creates `agent_activity_log` table (with realtime)
- All with RLS

### Migration 11: `20260226141513` — Automation Seeding
- Enables realtime for notifications
- Seeds 9 automation_configs for all agencies

### Migration 12: `20260226145218` — Campaign Columns
- Adds to campaigns: `external_id`, `external_url`, `posted_at`, `platform_status`, `last_synced_at`
- Adds to business_config: `hide_halevai_branding`, `custom_domain`, `email_from_name`, `email_reply_to`

### Migration 13: `20260226145529` — Inbound Messaging
- Creates `inbound_messages` table with indexes
- Creates `conversation_threads` table with indexes
- Enables realtime for both

### Migration 14: `20260226145949` — Sequence Branching
- Adds to sequence_steps: `step_type`, `condition_type`, `condition_value`, `true_next_step_id`, `false_next_step_id`, `action_type`, `action_config`

### Migration 15: `20260226150450` — Extended Roles
- Adds `operations_manager` and `intake_coordinator` to agency_role enum
- Creates `is_write_role()` function

### Migration 16: `20260226174627` — Landing Page Source
- Adds `landing_page` to lead_source enum

### Migration 17: `20260226174643` — Public Access Policies
- Public SELECT on published landing_pages
- Public SELECT on agencies (basic info)
- Public SELECT on business_config (branding)
- Public INSERT on caregivers (source = 'landing_page', status = 'new', landing_page_id required)
- Public UPDATE on landing_pages (view count incrementing)

---

## 12. RLS Policies

### agencies
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view their agency | SELECT | `is_agency_member(auth.uid(), id)` |
| Owners can update agency | UPDATE | `has_agency_role(auth.uid(), id, 'owner')` |
| Authenticated can create agency | INSERT | `TO authenticated WITH CHECK (true)` |
| Public can view agency basic info | SELECT | `USING (true)` |

### agency_members
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view their agency members | SELECT | `is_agency_member(auth.uid(), agency_id)` |
| Can insert own membership | INSERT | `user_id = auth.uid()` |
| Owners can manage members | DELETE | `has_agency_role(auth.uid(), agency_id, 'owner')` |
| Owners can update members | UPDATE | `has_agency_role(auth.uid(), agency_id, 'owner')` |

### profiles
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Users can view own profile | SELECT | `user_id = auth.uid()` |
| Users can update own profile | UPDATE | `user_id = auth.uid()` |
| Auto-create profile | INSERT | `user_id = auth.uid()` |

### caregivers
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Agency members can access caregivers | ALL | `agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())` |
| Public can submit caregiver applications | INSERT | `source = 'landing_page' AND landing_page_id IS NOT NULL AND status = 'new'` |

### campaigns
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view campaigns | SELECT | `is_agency_member(auth.uid(), agency_id)` |
| Owner/admin can modify campaigns | ALL | `is_owner_or_admin(auth.uid(), agency_id)` |

### competitors
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view competitors | SELECT | `is_agency_member(auth.uid(), agency_id)` |
| Owner/admin can modify competitors | ALL | `is_owner_or_admin(auth.uid(), agency_id)` |

### business_config
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view business config | SELECT | `is_agency_member(auth.uid(), agency_id)` |
| Owner/admin can modify business config | ALL | `is_owner_or_admin(auth.uid(), agency_id)` |
| Public can view business config for branding | SELECT | `USING (true)` |

### automation_configs
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view automations | SELECT | `is_agency_member(auth.uid(), agency_id)` |
| Owner/admin can modify automations | ALL | `is_owner_or_admin(auth.uid(), agency_id)` |

### landing_pages
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Agency members can access landing pages | ALL | `agency_id IN (...)` |
| Public can view published landing pages | SELECT | `published = true` |
| Public can update landing page view counts | UPDATE | `published = true` |

### api_keys
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Agency members can view api keys | SELECT | `is_owner_or_admin(auth.uid(), agency_id)` |
| Owner/admin can insert api keys | INSERT | `is_owner_or_admin(auth.uid(), agency_id)` |
| Owner/admin can update api keys | UPDATE | `is_owner_or_admin(auth.uid(), agency_id)` |
| Owner/admin can delete api keys | DELETE | `is_owner_or_admin(auth.uid(), agency_id)` |

### Standard agency-scoped (ALL for members)
These tables use `agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())`:
- caregiver_activities, halevai_recommendations, halevai_conversations, content_posts, reviews, locations, activity_log, daily_briefings, ad_creatives, sourcing_campaigns, sourced_candidates, phone_screens, referral_sources, saved_campaign_templates, campaign_sequences, sequence_steps, sequence_enrollments, campaign_packages, review_requests, agent_activity_log, conversation_threads

### notifications
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Agency members can access notifications | ALL | `user_id = auth.uid()` |

### landing_page_events
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Anyone can insert landing page events | INSERT | `event_type IS NOT NULL AND landing_page_id IS NOT NULL AND agency_id IS NOT NULL` |
| Agency members can read landing page events | SELECT | `agency_id IN (...)` |

### halevai_messages
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Agency members can access messages | ALL | `conversation_id IN (SELECT id FROM halevai_conversations WHERE agency_id IN (...))` |

### growth_playbooks
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Agency members can access playbooks | ALL | `agency_id IS NULL OR agency_id IN (...)` |

### pay_rate_intel
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Members can view pay rate intel | SELECT | `is_agency_member(auth.uid(), agency_id)` |
| Owner/admin can modify pay rate intel | ALL | `is_owner_or_admin(auth.uid(), agency_id)` |

### Storage: ad-creatives bucket
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Publicly accessible | SELECT | `bucket_id = 'ad-creatives'` |
| Authenticated can upload | INSERT | `bucket_id = 'ad-creatives' AND auth.role() = 'authenticated'` |
| Authenticated can update | UPDATE | same |
| Authenticated can delete | DELETE | same |

---

## 13. Supabase Types

The auto-generated `src/integrations/supabase/types.ts` defines:

### Tables (30)
`activity_log`, `ad_creatives`, `agencies`, `agency_members`, `agent_activity_log`, `api_keys`, `automation_configs`, `business_config`, `campaign_packages`, `campaign_sequences`, `campaigns`, `caregiver_activities`, `caregivers`, `competitors`, `content_posts`, `conversation_threads`, `daily_briefings`, `growth_playbooks`, `halevai_conversations`, `halevai_messages`, `halevai_recommendations`, `inbound_messages`, `landing_page_events`, `landing_pages`, `locations`, `message_log`, `notifications`, `onboarding`, `pay_rate_intel`, `phone_screens`, `profiles`, `referral_sources`, `review_requests`, `reviews`, `saved_campaign_templates`, `sequence_enrollments`, `sequence_steps`, `sourced_candidates`, `sourcing_campaigns`

### Enums
- `agency_role`: owner, admin, operations_manager, intake_coordinator, viewer
- `campaign_type`: recruitment, marketing, social, community
- `lead_source`: indeed, ziprecruiter, care_com, craigslist, facebook, referral, community, organic, direct, poaching, other, landing_page
- `lead_status`: new, contacted, intake_started, enrollment_pending, authorized, active, lost

### Functions
- `get_user_agency_id()` → UUID
- `get_user_agency_role(_agency_id, _user_id)` → agency_role
- `has_agency_role(_agency_id, _role, _user_id)` → boolean
- `is_agency_member(_agency_id, _user_id)` → boolean
- `is_owner_or_admin(_agency_id, _user_id)` → boolean
- `is_write_role(_agency_id, _user_id)` → boolean

---

## 14. config.toml

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

## 15. pg_cron Jobs

The `cron-trigger` edge function is designed to be called by external cron services (e.g., Supabase cron, or an external scheduler) with a `CRON_SECRET` header. The valid jobs are:

| Job | Calls Function | Frequency (recommended) |
|-----|---------------|------------------------|
| `automations` | `run-automations` | Every 15 minutes |
| `briefing` | `generate-briefing` | Daily at 6:00 AM |
| `scoring` | `score-leads` | Every 30 minutes |
| `sequences` | `run-automations` | Every 15 minutes |
| `sync-ads` | `sync-ad-metrics` | Every 6 hours |

**Example pg_cron SQL (if using Supabase pg_cron):**
```sql
-- Run automations every 15 minutes
SELECT cron.schedule('run-automations', '*/15 * * * *',
  $$SELECT extensions.http_post(
    'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=automations',
    '{}', 'application/json',
    ARRAY[extensions.http_header('x-cron-secret', current_setting('app.settings.cron_secret'))]
  )$$
);

-- Generate daily briefing at 6am UTC
SELECT cron.schedule('daily-briefing', '0 6 * * *',
  $$SELECT extensions.http_post(
    'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=briefing',
    '{}', 'application/json',
    ARRAY[extensions.http_header('x-cron-secret', current_setting('app.settings.cron_secret'))]
  )$$
);

-- Score leads every 30 minutes
SELECT cron.schedule('score-leads', '*/30 * * * *',
  $$SELECT extensions.http_post(
    'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=scoring',
    '{}', 'application/json',
    ARRAY[extensions.http_header('x-cron-secret', current_setting('app.settings.cron_secret'))]
  )$$
);

-- Sync ad metrics every 6 hours
SELECT cron.schedule('sync-ads', '0 */6 * * *',
  $$SELECT extensions.http_post(
    'https://jpyjqnucuebmknnykmyf.supabase.co/functions/v1/cron-trigger?job=sync-ads',
    '{}', 'application/json',
    ARRAY[extensions.http_header('x-cron-secret', current_setting('app.settings.cron_secret'))]
  )$$
);
```

---

## 16. Environment Variables Per Function

| Function | SUPABASE_URL | SUPABASE_ANON_KEY | SUPABASE_SERVICE_ROLE_KEY | LOVABLE_API_KEY | CRON_SECRET | FIRECRAWL_API_KEY |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| halevai-chat | ✅ | ✅ (as PUBLISHABLE_KEY) | ✅ | ✅ | | |
| campaign-optimizer | ✅ | ✅ | ✅ | ✅ | | |
| generate-content | ✅ | ✅ | ✅ | ✅ | | |
| generate-landing-content | ✅ | ✅ | ✅ | ✅ | | |
| generate-creative | ✅ | ✅ | ✅ | ✅ | | |
| post-to-ads | ✅ | ✅ | ✅ | ✅ | | |
| discover-sources | ✅ | ✅ | ✅ | ✅ | | |
| run-automations | ✅ | | ✅ | | | |
| generate-briefing | ✅ | | ✅ | | | |
| score-leads | ✅ | | ✅ | | | |
| analyze-pay-rates | ✅ | ✅ | | ✅ | | ✅ (optional) |
| send-message | ✅ | | ✅ | | | |
| source-candidates | ✅ | | ✅ | | | |
| trigger-outreach | ✅ | | ✅ | | | |
| ai-phone-screen | ✅ | | ✅ | ✅ | | |
| webhook-inbound | ✅ | | ✅ | | | |
| cron-trigger | ✅ | | ✅ | | ✅ | |
| sync-ad-metrics | ✅ | | ✅ | | | |

### Per-Agency API Keys (stored in `api_keys` table, not env vars)

| Key Name | Used By |
|----------|---------|
| `twilio_account_sid` | send-message |
| `twilio_auth_token` | send-message |
| `twilio_phone_number` | send-message, webhook-inbound |
| `sendgrid_api_key` | send-message |
| `sendgrid_inbound_domain` | webhook-inbound |
| `facebook_access_token` | post-to-ads, sync-ad-metrics |
| `facebook_ad_account_id` | post-to-ads |
| `google_ads_developer_token` | post-to-ads |
| `google_ads_client_id` | post-to-ads |
| `google_ads_client_secret` | post-to-ads |
| `google_ads_refresh_token` | post-to-ads |
| `google_ads_api_key` | sync-ad-metrics |
| `indeed_api_key` | post-to-ads |
| `ziprecruiter_api_key` | post-to-ads |
| `clay_api_key` | source-candidates |
| `ghl_api_key` | trigger-outreach |
| `ghl_subaccount_id` | trigger-outreach |
| `bland_ai_api_key` | ai-phone-screen |

---

*End of Handoff Document*
