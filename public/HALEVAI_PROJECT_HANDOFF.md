# HALEVAI — Complete Project Handoff Document

> Generated: 2026-02-26
> Stack: React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Lovable Cloud)
> Published URL: https://halevai.lovable.app

---

## TABLE OF CONTENTS

1. [File Tree](#1-file-tree)
2. [Route Map](#2-route-map)
3. [Component Dependency Graph](#3-component-dependency-graph)
4. [Design System — index.css](#4-design-system--indexcss)
5. [Design System — tailwind.config.ts](#5-design-system--tailwindconfigts)
6. [Auth Context — useAuth.tsx](#6-auth-context--useauthtsx)
7. [Permissions — permissions.ts](#7-permissions--permissionsts)
8. [Data Hooks — useAgencyData.ts](#8-data-hooks--useagencydatats)
9. [Database Schema — types.ts (Enums & Functions)](#9-database-schema--typests)
10. [RLS Policies](#10-rls-policies)
11. [Database Functions & Triggers](#11-database-functions--triggers)
12. [Edge Function Config — config.toml](#12-edge-function-config--configtoml)
13. [Edge Function Source Code (All 16)](#13-edge-function-source-code)
14. [Edge Function Request/Response Contracts](#14-edge-function-requestresponse-contracts)
15. [Environment Variables per Function](#15-environment-variables-per-function)
16. [Secrets Inventory](#16-secrets-inventory)

---

## 1. FILE TREE

```
src/
├── App.css
├── App.tsx
├── main.tsx
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
│       └── tooltip.tsx
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

supabase/
├── config.toml
└── functions/
    ├── ai-phone-screen/index.ts
    ├── analyze-pay-rates/index.ts
    ├── campaign-optimizer/index.ts
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
    ├── trigger-outreach/index.ts
    └── webhook-inbound/index.ts
```

---

## 2. ROUTE MAP

| Path | Component | Protected | Description |
|------|-----------|-----------|-------------|
| `/` | `Index` | No | Landing/marketing page |
| `/auth` | `Auth` | No | Login/signup form |
| `/reset-password` | `ResetPassword` | No | Password reset flow |
| `/onboarding` | `Onboarding` | Yes | Post-signup agency setup wizard |
| `/dashboard` | `Dashboard` | Yes | Main dashboard with KPIs |
| `/caregivers` | `Caregivers` | Yes | Caregiver pipeline/CRM |
| `/halevai` | `HalevaiChat` | Yes | AI chat assistant |
| `/enrollment` | `Enrollment` | Yes | Enrollment tracking |
| `/campaigns` | `Campaigns` | Yes | Campaign hub (filtered OR/MI) |
| `/campaign-builder` | `CampaignBuilder` | Yes | Multi-platform campaign creation |
| `/competitors` | `Competitors` | Yes | Competitor intel |
| `/reviews` | `Reviews` | Yes | Review management |
| `/recommendations` | `Recommendations` | Yes | AI recommendations |
| `/playbooks` | `Playbooks` | Yes | Growth playbook library |
| `/briefing` | `Briefing` | Yes | Daily AI briefing |
| `/talent-sourcing` | `TalentSourcing` | Yes | Sourcing campaigns & candidates |
| `/content` | `ContentCalendar` | Yes | Social media content calendar |
| `/landing-pages` | `LandingPages` | Yes | Landing page builder |
| `/creatives` | `AdCreatives` | Yes | AI ad creative generator |
| `/automations` | `Automations` | Yes | Automation toggle panel |
| `/settings` | `Settings` | Yes | Agency settings, branding, team, integrations |
| `/inbox` | `Inbox` | Yes | Unified SMS/email inbox |
| `/lp/:slug` | `PublicLandingPage` | No | Public-facing landing pages |
| `*` | `NotFound` | No | 404 page |

---

## 3. COMPONENT DEPENDENCY GRAPH

### Layout Components
- **AppLayout** → `AppSidebar`, `SidebarProvider`, `SidebarInset`
- **AppSidebar** → `NavLink`, `NotificationBell`, `useAuth`, `useAgency`, `useUnreadCount`
- **ProtectedRoute** → `useAuth` → redirects to `/auth` if no session

### Page → Hook/Component Dependencies

| Page | Hooks Used | Components Used |
|------|------------|-----------------|
| Dashboard | useAgency, useCaregivers, useCampaigns, useReviews, useRecommendations, useActivityLog, useAuth | AppLayout, Card, Badge, Button |
| Caregivers | useCaregivers, useAuth | AppLayout, Card, Badge, Dialog, Tabs |
| HalevaiChat | useAuth | AppLayout, react-markdown |
| Campaigns | useCampaigns, useAuth | AppLayout, Card, Badge, Button |
| CampaignBuilder | useAuth | AppLayout, Card, Button, Badge |
| TalentSourcing | useSourcingCampaigns, useSourcedCandidates, usePhoneScreens, useAuth | AppLayout, Card, Badge, Dialog |
| Automations | useAutomations, useToggleAutomation, useAuth | AppLayout, Card, Switch, Dialog |
| Inbox | useConversationThreads, useThreadMessages, useAuth | AppLayout, ComposeMessageDialog |
| Settings | useAgency, useBusinessConfig, useApiKeys, useAuth, useAgencyMembers | AppLayout, IntegrationsTab, TeamMembers |
| ContentCalendar | useContentPosts, useAuth | AppLayout, Card, Calendar |
| LandingPages | useLandingPages, useAuth | AppLayout, Card, Dialog |
| AdCreatives | useAdCreatives, useAuth | AppLayout, Card, Dialog |
| Competitors | useCompetitors, usePayRateIntel, useAuth | AppLayout, Card, Badge |
| Reviews | useReviews, useReviewRequests, useAuth | AppLayout, Card, Badge |
| Recommendations | useRecommendations, useAuth | AppLayout, Card, Badge |
| Playbooks | usePlaybooks, useAuth | AppLayout, Card, Badge |
| Briefing | useAuth | AppLayout, Card |
| Enrollment | useCaregivers, useAuth | AppLayout, Card, Badge |
| Onboarding | useAuth | Card, Button, multi-step wizard |
| PublicLandingPage | (none — public) | Standalone rendering |

---

## 4. DESIGN SYSTEM — index.css

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

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground font-sans;
    font-family: 'Space Grotesk', sans-serif;
  }
}

@layer utilities {
  .halevai-glow {
    box-shadow: 0 0 20px hsl(195 100% 50% / 0.3), 0 0 60px hsl(195 100% 50% / 0.1);
  }
  .halevai-border {
    border: 1px solid hsl(195 100% 50% / 0.2);
  }
  .halevai-text {
    background: linear-gradient(135deg, hsl(195 100% 50%), hsl(270 80% 60%));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .halevai-bg-gradient {
    background: linear-gradient(135deg, hsl(195 100% 50% / 0.1), hsl(270 80% 60% / 0.1));
  }
  .font-data {
    font-family: 'IBM Plex Mono', monospace;
  }
}
```

---

## 5. DESIGN SYSTEM — tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        data: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        halevai: {
          cyan: "hsl(var(--halevai-cyan))",
          purple: "hsl(var(--halevai-purple))",
          navy: "hsl(var(--halevai-navy))",
        },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "pulse-glow": { "0%, 100%": { opacity: "0.4" }, "50%": { opacity: "1" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## 6. AUTH CONTEXT — useAuth.tsx

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
  session: null, user: null, loading: true, agencyId: null, agencyRole: null, isViewer: false, signOut: async () => {},
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
      supabase.from("agency_members").select("agency_id, role").eq("user_id", user.id).limit(1).single()
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

## 7. PERMISSIONS — permissions.ts

```ts
export type AgencyRole = "owner" | "admin" | "operations_manager" | "intake_coordinator" | "viewer";

export type PermissionAction =
  | "view_dashboard" | "edit_caregivers" | "send_messages" | "manage_campaigns"
  | "post_to_ads" | "run_automations" | "manage_api_keys" | "edit_branding"
  | "manage_team" | "invite_members" | "change_roles" | "delete_agency" | "transfer_ownership";

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

export function hasPermission(role: string | null | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[action]?.includes(role as AgencyRole) ?? false;
}

export function isWriteRole(role: string | null | undefined): boolean {
  return hasPermission(role, "edit_caregivers");
}

export const ROLE_LABELS: Record<AgencyRole, string> = {
  owner: "Owner", admin: "Admin", operations_manager: "Ops Manager",
  intake_coordinator: "Intake Coordinator", viewer: "Viewer",
};
```

---

## 8. DATA HOOKS — useAgencyData.ts (Full Source)

```ts
// See src/hooks/useAgencyData.ts — 320 lines
// Key exports:

// Generic agency-scoped query:
function useAgencyQuery<T>(key, table, options?) → useQuery

// Entity hooks:
export const useAgency = ()           // Single agency record
export const useCaregivers = ()       // caregivers table
export const useCampaigns = ()        // campaigns table
export const useCompetitors = ()      // competitors table
export const useReviews = ()          // reviews table
export const useContentPosts = ()     // content_posts table
export const useLandingPages = ()     // landing_pages table
export const useSourcingCampaigns = () // sourcing_campaigns table
export const useSourcedCandidates = () // sourced_candidates table
export const useAutomations = ()      // automation_configs table
export const useRecommendations = ()  // halevai_recommendations table
export const usePlaybooks = ()        // growth_playbooks (includes agency_id IS NULL globals)
export const useActivityLog = ()      // activity_log (limit 20)
export const useAdCreatives = ()      // ad_creatives table
export const useBusinessConfig = ()   // business_config (maybeSingle)
export const useReferralSources = ()  // referral_sources table
export const useCampaignTemplates = () // saved_campaign_templates table
export const useCampaignSequences = () // campaign_sequences table
export const useSequenceSteps = (id?) // sequence_steps (filtered by sequence_id)
export const useSequenceEnrollments = () // sequence_enrollments table
export const useCampaignPackages = ()  // campaign_packages table
export const useLandingPageEvents = () // landing_page_events table
export const useReviewRequests = ()    // review_requests table
export const useAgencyMembers = ()     // agency_members table
export const usePayRateIntel = ()      // pay_rate_intel (latest 1)
export const useApiKeys = ()           // api_keys table (owner/admin only)
export const useMessageLog = (limit?)  // message_log table
export const useAgentActivityLog = ()  // agent_activity_log (limit 50)
export const usePhoneScreens = ()      // phone_screens table
export const useConversationThreads = () // conversation_threads table
export const useUnreadCount = ()       // Sum of unread_count from open threads
export const useThreadMessages = (phone, email, channel) // Merged in/outbound messages
export const useInboundMessages = ()   // inbound_messages table

// Mutations:
export const useToggleAutomation = () // Toggle automation_configs.active
export const useSaveApiKey = ()       // Upsert api_keys
export const useTestConnection = ()   // Test via send-message edge function
```

---

## 9. DATABASE SCHEMA — types.ts (Enums & Functions)

### Enums

```ts
agency_role: "owner" | "admin" | "operations_manager" | "intake_coordinator" | "viewer"
campaign_type: "recruitment" | "marketing" | "social" | "community"
lead_source: "indeed" | "ziprecruiter" | "care_com" | "craigslist" | "facebook" | "referral" | "community" | "organic" | "direct" | "poaching" | "other"
lead_status: "new" | "contacted" | "intake_started" | "enrollment_pending" | "authorized" | "active" | "lost"
```

### Database Tables (29 total)

activity_log, ad_creatives, agencies, agency_members, agent_activity_log, api_keys, automation_configs, business_config, campaign_packages, campaign_sequences, campaigns, caregiver_activities, caregivers, competitors, content_posts, conversation_threads, daily_briefings, growth_playbooks, halevai_conversations, halevai_messages, halevai_recommendations, inbound_messages, landing_page_events, landing_pages, locations, message_log, notifications, onboarding, pay_rate_intel, phone_screens, profiles, referral_sources, review_requests, reviews, saved_campaign_templates, sequence_enrollments, sequence_steps, sourced_candidates, sourcing_campaigns

### Database Functions

```sql
get_user_agency_id() RETURNS uuid
-- Returns agency_id for current auth.uid()

has_agency_role(_user_id uuid, _agency_id uuid, _role agency_role) RETURNS boolean
-- Check if user has specific role

is_agency_member(_user_id uuid, _agency_id uuid) RETURNS boolean
-- Check membership

is_owner_or_admin(_user_id uuid, _agency_id uuid) RETURNS boolean
-- Check owner or admin role

is_write_role(_user_id uuid, _agency_id uuid) RETURNS boolean
-- Check owner/admin/ops_manager/intake_coordinator

get_user_agency_role(_user_id uuid, _agency_id uuid) RETURNS agency_role
-- Get the role enum value

handle_new_user() RETURNS trigger
-- Auto-create profile on signup

update_updated_at_column() RETURNS trigger
-- Auto-update updated_at timestamp

check_landing_page_event_rate_limit() RETURNS trigger
-- Rate limit: max 60 events/minute per landing page
```

---

## 10. RLS POLICIES

### Pattern A: Agency member access (most tables)
```sql
-- Used by: activity_log, ad_creatives, caregiver_activities, caregivers, content_posts,
-- campaign_packages, campaign_sequences, conversation_threads, daily_briefings,
-- halevai_conversations, halevai_recommendations, landing_pages, locations,
-- phone_screens, referral_sources, review_requests, reviews, saved_campaign_templates
CREATE POLICY "Agency members can access [table]"
ON public.[table] FOR ALL
USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));
```

### Pattern B: Owner/admin write, member read
```sql
-- Used by: campaigns, competitors, automation_configs, pay_rate_intel, business_config
CREATE POLICY "Members can view" FOR SELECT USING (is_agency_member(auth.uid(), agency_id));
CREATE POLICY "Owner/admin can modify" FOR ALL
  USING (is_owner_or_admin(auth.uid(), agency_id))
  WITH CHECK (is_owner_or_admin(auth.uid(), agency_id));
```

### Pattern C: User-scoped
```sql
-- notifications
CREATE POLICY "Agency members can access notifications" FOR ALL USING (user_id = auth.uid());

-- profiles
CREATE POLICY "Users can view own profile" FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Auto-create profile" FOR INSERT WITH CHECK (user_id = auth.uid());

-- onboarding
CREATE POLICY "Users can manage own onboarding" FOR ALL USING (user_id = auth.uid());
```

### Pattern D: Special cases
```sql
-- agencies: Authenticated INSERT, member SELECT, owner UPDATE, no DELETE
-- agency_members: Own INSERT, member SELECT, owner UPDATE/DELETE
-- api_keys: owner/admin for ALL operations
-- halevai_messages: Nested join through conversations
-- growth_playbooks: agency_id IS NULL OR member check (global + agency-specific)
-- landing_page_events: Anyone INSERT (with validation), member SELECT only
-- inbound_messages: member SELECT + UPDATE only (no INSERT/DELETE from client)
-- message_log: member SELECT, owner/admin INSERT only
```

---

## 11. DATABASE FUNCTIONS & TRIGGERS

```sql
-- Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rate limit landing page events
CREATE TRIGGER check_lp_event_rate_limit
  BEFORE INSERT ON public.landing_page_events
  FOR EACH ROW EXECUTE FUNCTION public.check_landing_page_event_rate_limit();
```

---

## 12. EDGE FUNCTION CONFIG — config.toml

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
```

---

## 13. EDGE FUNCTION SOURCE CODE

### 13.1 halevai-chat/index.ts
**Purpose:** Streaming AI chat assistant with full agency context
**Auth:** Bearer token → getUser() → agency_members lookup
**AI Model:** google/gemini-3-flash-preview via Lovable AI Gateway (streaming)
**Context loaded:** 21 parallel queries covering caregivers, campaigns, competitors, reviews, content, landing pages, sourcing, automations, recommendations, sourced candidates, phone screens, agent activity, API keys, message log

<details><summary>Full source (278 lines)</summary>

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

// ... [Full source as shown in halevai-chat/index.ts above - 278 lines]
```
</details>

### 13.2 send-message/index.ts
**Purpose:** Unified SMS (Twilio), Email (SendGrid), In-App notification sender
**Auth:** None (service role key, called by other functions)
**External APIs:** Twilio REST API, SendGrid v3 API

<details><summary>Full source (228 lines)</summary>

```ts
// Accepts: { agency_id, channel: "sms"|"email"|"in_app", to, subject?, body, template?, related_type?, related_id?, user_id? }
// Returns: { success, message_id, status, mock, error? }
// If Twilio/SendGrid not configured: logs message with status="pending", mock=true
```
</details>

### 13.3 run-automations/index.ts
**Purpose:** Master automation runner — executes all active automations for an agency
**Auth:** None (service role key)
**Handlers (14):**
- `lead_scoring` / `auto_lead_scoring` / `auto_score_caregivers` → score unscored caregivers
- `follow_up_reminders` / `auto_followup_sms` → 3-day stale follow-ups with escalating messages
- `performance_alerts` / `campaign_pause_alerts` → spend threshold notifications
- `stale_enrollment_alerts` / `enrollment_stale_alert` → 14-day stale enrollment nudges
- `auto_welcome_sms` → welcome SMS to new leads (< 24h old)
- `auto_source_candidates` → run active sourcing campaigns
- `auto_outreach_high_match` → trigger outreach for match_score >= 70
- `auto_screen_responded` → AI phone screen for responded candidates
- `auto_review_request` → review solicitation for active caregivers
- `background_check_reminder` → 7-day BG check reminders
- `auth_expiry_alert` → 30-day authorization expiry alerts
- `process_sequences` → full sequence engine (message/condition/action/wait steps)

**Full source: 679 lines** (see run-automations/index.ts)

### 13.4 score-leads/index.ts
**Purpose:** Lead scoring algorithm
**Scoring formula (0-100):**
- Phone: +8, Email: +7
- State: +5, County: +5
- Currently caregiving: +10, Experience: +1-5
- Patient name: +8, Medicaid ID: +7, Active Medicaid: +5
- Transportation: +5, Availability: +5
- Recency: +4/+7/+10, BG check passed: +5
- Recent contact: +5/+10
**Tiers:** HOT ≥70, WARM ≥40, COLD <40

### 13.5 source-candidates/index.ts
**Purpose:** Candidate sourcing via Clay API (or mock data)
**Modes:** `search` (find new), `enrich` (add contact info)
**Mock fallback:** Generates 5 realistic candidates when Clay not configured

### 13.6 trigger-outreach/index.ts
**Purpose:** Multi-step outreach sequences for sourced candidates
**Sequences:** `caregiver_cold` (5 steps over 14 days), `poaching` (5 steps over 21 days)
**Integration:** GoHighLevel (GHL) contact sync + send-message

### 13.7 ai-phone-screen/index.ts
**Purpose:** Automated AI phone screening via Bland AI
**Flow:** Create call → Poll for completion → AI analysis → Auto-promote high scorers
**AI Analysis:** Extracts screening_answers, ai_score, ai_recommendation
**Auto-promotion:** score ≥70 + recommendation "advance" → create caregiver record

### 13.8 campaign-optimizer/index.ts
**Purpose:** AI-powered campaign management
**Modes:** `template`, `optimization`, `full_package`, `initial_strategy`, `playbook_execution`
**Auth:** getClaims() JWT validation
**AI:** Uses function calling (tools) for structured output

### 13.9 generate-content/index.ts
**Purpose:** AI social media content generation
**Auth:** getClaims() JWT validation
**Returns:** Array of posts with platform, title, body, hashtags, image_prompt

### 13.10 generate-landing-content/index.ts
**Purpose:** AI landing page content generation
**Auth:** getClaims() JWT validation
**Returns:** hero_headline, hero_subheadline, benefits, testimonials, faq, meta tags

### 13.11 generate-creative/index.ts
**Purpose:** AI ad copy + image generation
**Auth:** getUser() validation
**Image:** Uses google/gemini-2.5-flash-image model, uploads to ad-creatives bucket

### 13.12 post-to-ads/index.ts
**Purpose:** Post campaigns to ad platforms
**Actions:** `check_credentials`, `post`
**Platforms:** Facebook/Meta (real API), Google Ads (credential verify), Indeed, ZipRecruiter, Craigslist (AI-generated posting)
**Auth:** getClaims() JWT validation

### 13.13 discover-sources/index.ts
**Purpose:** AI-powered referral source discovery
**Auth:** getClaims() JWT validation
**Output:** 8-12 community sources (churches, centers, orgs) saved to referral_sources table

### 13.14 generate-briefing/index.ts
**Purpose:** Daily briefing generation
**Auth:** None (service role)
**Output:** Pipeline stats, campaign metrics, action items, wins → daily_briefings table

### 13.15 analyze-pay-rates/index.ts
**Purpose:** Competitive pay rate analysis
**Auth:** getClaims() JWT validation
**Data sources:** Firecrawl web scraping + competitor DB + AI analysis
**Output:** recommended_rate, market rates, analysis → pay_rate_intel table

### 13.16 webhook-inbound/index.ts
**Purpose:** Receive inbound SMS (Twilio) and email (SendGrid) webhooks
**Auth:** None (public webhook)
**Flow:** Parse message → Match agency → Match caregiver/candidate → Create inbound_messages → Update/create conversation_threads → Create notifications → Auto-detect keywords (YES/STOP) → Update statuses

---

## 14. EDGE FUNCTION REQUEST/RESPONSE CONTRACTS

### halevai-chat
```ts
// Request (POST, Auth: Bearer)
{ messages: Array<{ role: "user"|"assistant", content: string }> }
// Response: SSE stream (text/event-stream)
```

### send-message
```ts
// Request (POST, no auth)
{ agency_id: string, channel: "sms"|"email"|"in_app", to: string, subject?: string, body: string, template?: string, related_type?: string, related_id?: string, user_id?: string }
// Response
{ success: boolean, message_id: string|null, status: string, mock: boolean, error?: string }
```

### run-automations
```ts
// Request (POST, no auth)
{ agencyId: string | "all" }
// Response
{ results: Array<{ agency: string, results: Array<{ key: string, actions: number }> }> }
```

### score-leads
```ts
// Request (POST, no auth)
{ agencyId: string }
// Response
{ scored: number }
```

### source-candidates
```ts
// Request (POST, no auth)
{ agency_id: string, campaign_id: string, mode: "search"|"enrich" }
// Response
{ success: boolean, mock: boolean, candidates_created: number, candidates_enriched: number }
```

### trigger-outreach
```ts
// Request (POST, no auth)
{ agency_id: string, sourced_candidate_ids: string[], sequence_type: "caregiver_cold"|"poaching" }
// Response
{ success: boolean, mock: boolean, sent: number }
```

### ai-phone-screen
```ts
// Request (POST, no auth)
{ agency_id: string, sourced_candidate_id?: string, caregiver_id?: string, phone_number: string, state?: string }
// Response
{ success: boolean, mock: boolean, screen_id: string, call_id?: string, message?: string }
```

### campaign-optimizer
```ts
// Request (POST, Auth: Bearer)
{ mode: "template"|"optimization"|"full_package"|"initial_strategy"|"playbook_execution", agencyId: string, campaignId?: string, platforms?: string[], campaignDetails?: object, playbookId?: string }
// Response
{ mode: string, result: object }
```

### generate-content
```ts
// Request (POST, Auth: Bearer)
{ agencyId: string, platforms?: string[], topic?: string, state?: string, language?: string, count?: number }
// Response
{ posts: Array<{ platform, title, body, hashtags, image_prompt, suggested_posting_time }> }
```

### generate-landing-content
```ts
// Request (POST, Auth: Bearer)
{ agencyId: string, state?: string, county?: string, language?: string }
// Response
{ hero_headline, hero_subheadline, hero_cta_text, benefits, testimonials, faq, pay_rate_highlight, meta_title, meta_description, ... }
```

### generate-creative
```ts
// Request (POST, Auth: Bearer)
{ agencyId: string, prompt: string, platform?: string, campaignId?: string }
// Response
{ headline: string, body_copy: string, prompt: string, platform: string, image_url: string|null }
```

### post-to-ads
```ts
// Request (POST, Auth: Bearer)
{ action: "check_credentials"|"post", agencyId: string, campaignId?: string, platform?: string, content?: object }
// Response (check_credentials)
{ platforms: Record<string, { connected: boolean, missingKeys: string[], setupUrl: string }> }
// Response (post)
{ success: boolean, externalId?: string, platform: string, manual?: boolean, simulated?: boolean, message?: string, error?: string }
```

### discover-sources
```ts
// Request (POST, Auth: Bearer)
{ agencyId: string, state?: string, county?: string, language?: string, sourceTypes?: string[] }
// Response
{ sources: Array<{name, source_type, state, county, language_community, url, notes}>, discovery_summary: string, total_discovered: number, total_saved: number, duplicates_skipped: number }
```

### generate-briefing
```ts
// Request (POST, no auth)
{ agencyId: string | "all", userId?: string }
// Response
{ results: Array<{ agency: string, id?: string, message?: string, error?: string }> }
```

### analyze-pay-rates
```ts
// Request (POST, Auth: Bearer)
{ agency_id: string, state?: string, county?: string }
// Response
{ success: boolean, recommended_rate: number, medicaid_reimbursement_rate: number, market_avg_rate: number, market_min_rate: number, market_max_rate: number, analysis_summary: string, ... }
```

### webhook-inbound
```ts
// Request: Twilio (application/x-www-form-urlencoded) or SendGrid (JSON/multipart)
// Response: "<Response></Response>" (XML for Twilio) or "OK" (for SendGrid)
```

---

## 15. ENVIRONMENT VARIABLES PER FUNCTION

| Function | SUPABASE_URL | SUPABASE_SERVICE_ROLE_KEY | SUPABASE_ANON_KEY | LOVABLE_API_KEY | FIRECRAWL_API_KEY |
|----------|:---:|:---:|:---:|:---:|:---:|
| halevai-chat | ✅ | ✅ | ✅ (PUBLISHABLE) | ✅ | |
| send-message | ✅ | ✅ | | | |
| run-automations | ✅ | ✅ | | | |
| score-leads | ✅ | ✅ | | | |
| source-candidates | ✅ | ✅ | | | |
| trigger-outreach | ✅ | ✅ | | | |
| ai-phone-screen | ✅ | ✅ | | ✅ | |
| campaign-optimizer | ✅ | ✅ | ✅ | ✅ | |
| generate-content | ✅ | ✅ | ✅ | ✅ | |
| generate-landing-content | ✅ | ✅ | ✅ | ✅ | |
| generate-creative | ✅ | ✅ | ✅ | ✅ | |
| post-to-ads | ✅ | ✅ | ✅ | ✅ | |
| discover-sources | ✅ | ✅ | ✅ | ✅ | |
| generate-briefing | ✅ | ✅ | | | |
| analyze-pay-rates | ✅ | | ✅ | ✅ | ✅ |
| webhook-inbound | ✅ | ✅ | | | |

### Agency-level API keys (stored in `api_keys` table, per agency)

| Key Name | Used By | External API |
|----------|---------|--------------|
| twilio_account_sid | send-message | Twilio |
| twilio_auth_token | send-message | Twilio |
| twilio_phone_number | send-message, webhook-inbound | Twilio |
| sendgrid_api_key | send-message | SendGrid |
| sendgrid_inbound_domain | webhook-inbound | SendGrid |
| clay_api_key | source-candidates | Clay.com |
| bland_ai_api_key | ai-phone-screen | Bland AI |
| ghl_api_key | trigger-outreach | GoHighLevel |
| ghl_subaccount_id | trigger-outreach | GoHighLevel |
| facebook_access_token | post-to-ads | Meta Ads API |
| facebook_ad_account_id | post-to-ads | Meta Ads API |
| google_ads_developer_token | post-to-ads | Google Ads |
| google_ads_client_id | post-to-ads | Google Ads |
| google_ads_client_secret | post-to-ads | Google Ads |
| google_ads_refresh_token | post-to-ads | Google Ads |
| indeed_api_key | post-to-ads | Indeed |
| ziprecruiter_api_key | post-to-ads | ZipRecruiter |

---

## 16. SECRETS INVENTORY

| Secret | Type | Notes |
|--------|------|-------|
| SUPABASE_SERVICE_ROLE_KEY | System | Auto-configured |
| SUPABASE_DB_URL | System | Auto-configured |
| SUPABASE_PUBLISHABLE_KEY | System | Auto-configured |
| SUPABASE_URL | System | Auto-configured |
| SUPABASE_ANON_KEY | System | Auto-configured |
| LOVABLE_API_KEY | Platform | AI Gateway access |
| FIRECRAWL_API_KEY | Connector | Web scraping for pay rate analysis |

---

## NOTES

- **No pg_cron jobs configured** — automations are triggered manually via the "Run Now" button or could be wired to a cron endpoint externally
- **Storage bucket:** `ad-creatives` (public) — stores AI-generated ad images
- **All edge functions have `verify_jwt = false`** — auth is handled in-function via getClaims() or getUser() where required
- **Mock fallbacks:** source-candidates, trigger-outreach, ai-phone-screen, and send-message all gracefully degrade to mock/pending when external API keys aren't configured
- **AI Gateway:** All AI calls go through `https://ai.gateway.lovable.dev/v1/chat/completions` using LOVABLE_API_KEY — no OpenAI/Anthropic keys needed
