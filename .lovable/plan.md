
## Halevai.ai — Phase 1A: Foundation & Design System

This first implementation step establishes the core visual identity, layout shell, and authentication page for Halevai.ai.

### 1. Design System & Branding
- **Dark-only theme** with the Halevai color palette:
  - Background: deep navy (`hsl(225 25% 6%)`)
  - Primary: cyan (`hsl(195 100% 50%)`)
  - Accent: purple (`hsl(270 80% 60%)`)
  - Cards, borders, and muted tones per the spec
- **Fonts**: Space Grotesk for display/body, IBM Plex Mono for data/numbers
- **Custom CSS utilities**: `.halevai-glow`, `.halevai-border`, `.halevai-text` (gradient text), `.halevai-bg-gradient`, `.font-data`
- **Favicon** set to the uploaded infinity logo

### 2. App Layout Shell
- **Sidebar navigation** with the Halevai logo and all navigation sections:
  - CORE: Dashboard, Halevai AI, Recommendations, Playbooks, Daily Briefing
  - PIPELINE: Caregivers, Enrollment Tracker, Campaigns, Campaign Builder, Landing Pages, Content Calendar, Ad Creatives
  - RECRUITMENT AGENTS: Talent Sourcing
  - INTEL: Competitors, Reviews
  - SYSTEM: Automations, Settings
  - User info & sign out at bottom
- Collapsible sidebar with mobile responsiveness
- All routes stubbed with placeholder pages

### 3. Public Marketing Landing Page (`/`)
- Hero section: "The Growth Engine Your Home Care Agency Has Been Waiting For"
- 6-card feature grid (AI Lead Scoring, Autonomous Sourcing, Smart Outreach, AI Phone Screening, Competitor Intelligence, Enrollment Tracking)
- CTA button → `/auth`
- Social proof section
- Footer with legal links
- Uses the Halevai branding images as design accents

### 4. Auth Page (`/auth`)
- Login/signup tabs with email/password fields
- Forgot password flow
- Halevai logo with tagline at top
- Styled in the dark theme with cyan/purple accents
- Ready to connect to Supabase Auth (wired up in next phase)

### 5. Route Structure
All routes registered with placeholder content:
- `/` — Marketing landing page
- `/auth` — Login/Signup
- `/onboarding` — (placeholder)
- `/dashboard` — (placeholder)
- `/halevai` — (placeholder)
- `/caregivers` — (placeholder)
- `/enrollment` — (placeholder)
- `/campaigns` — (placeholder)
- `/campaign-builder` — (placeholder)
- `/landing-pages` — (placeholder)
- `/content` — (placeholder)
- `/creatives` — (placeholder)
- `/recommendations` — (placeholder)
- `/playbooks` — (placeholder)
- `/briefing` — (placeholder)
- `/talent-sourcing` — (placeholder)
- `/competitors` — (placeholder)
- `/reviews` — (placeholder)
- `/automations` — (placeholder)
- `/settings` — (placeholder)

This gives us the complete branded shell to build features into in subsequent phases.
