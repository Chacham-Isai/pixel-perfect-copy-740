
-- Enums
CREATE TYPE public.agency_role AS ENUM ('owner', 'admin', 'operations_manager', 'intake_coordinator');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'intake_started', 'enrollment_pending', 'authorized', 'active', 'lost');
CREATE TYPE public.lead_source AS ENUM ('indeed', 'ziprecruiter', 'care_com', 'craigslist', 'facebook', 'referral', 'community', 'organic', 'direct', 'poaching', 'other');
CREATE TYPE public.campaign_type AS ENUM ('recruitment', 'marketing', 'social', 'community');

-- Agencies (top-level tenant)
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  states TEXT[] NOT NULL DEFAULT '{}',
  primary_state TEXT,
  office_address TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Agency Members
CREATE TABLE public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  role public.agency_role NOT NULL DEFAULT 'admin',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, agency_id)
);
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Onboarding
CREATE TABLE public.onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agency_name TEXT,
  states TEXT[] DEFAULT '{}',
  program_types TEXT[] DEFAULT '{}',
  pay_rates JSONB DEFAULT '{}',
  service_counties JSONB DEFAULT '{}',
  primary_goal TEXT,
  budget_tier TEXT,
  monthly_caregiver_target INT,
  monthly_patient_target INT,
  unique_selling_points TEXT[] DEFAULT '{}',
  ai_strategy JSONB,
  strategy_generated BOOLEAN DEFAULT false,
  current_step INT DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

-- Caregivers (THE PRIMARY CRM TABLE)
CREATE TABLE public.caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  state TEXT,
  county TEXT,
  city TEXT,
  language_primary TEXT DEFAULT 'english',
  languages_spoken TEXT[] DEFAULT '{}',
  status public.lead_status DEFAULT 'new',
  source public.lead_source,
  currently_caregiving BOOLEAN,
  relationship_to_patient TEXT,
  years_caregiving_experience NUMERIC,
  availability TEXT,
  has_transportation BOOLEAN,
  background_check_status TEXT DEFAULT 'not_started',
  patient_name TEXT,
  patient_relationship TEXT,
  patient_age INT,
  patient_medicaid_id TEXT,
  patient_medicaid_status TEXT DEFAULT 'unknown',
  patient_county TEXT,
  patient_needs_assessment BOOLEAN DEFAULT false,
  patient_hours_approved NUMERIC,
  lead_score INT CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_tier TEXT,
  score_reasoning TEXT,
  auto_followup_count INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  follow_up_date DATE,
  assigned_to TEXT,
  notes TEXT,
  enrollment_started_at TIMESTAMPTZ,
  county_rep_name TEXT,
  case_manager_name TEXT,
  authorization_date DATE,
  start_of_care_date DATE,
  hourly_rate NUMERIC,
  weekly_hours NUMERIC,
  monthly_revenue NUMERIC,
  campaign_id UUID,
  landing_page_id UUID,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;

-- Caregiver Activities
CREATE TABLE public.caregiver_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  caregiver_id UUID REFERENCES public.caregivers(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.caregiver_activities ENABLE ROW LEVEL SECURITY;

-- Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type public.campaign_type,
  channel TEXT,
  state TEXT,
  county TEXT,
  target_language TEXT DEFAULT 'english',
  spend NUMERIC DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  cost_per_conversion NUMERIC,
  target_cac NUMERIC,
  pause_spend_threshold NUMERIC,
  status TEXT DEFAULT 'draft',
  caregivers_generated INT DEFAULT 0,
  enrollment_conversion_rate NUMERIC,
  ai_prompt TEXT,
  ai_recommendations TEXT,
  date_from DATE,
  date_to DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Competitors
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  state TEXT,
  avg_rating NUMERIC,
  review_count INT DEFAULT 0,
  pay_rate_min NUMERIC,
  pay_rate_max NUMERIC,
  markets TEXT[] DEFAULT '{}',
  estimated_monthly_spend NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Halevai Recommendations
CREATE TABLE public.halevai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  category TEXT,
  reasoning TEXT,
  impact_estimate TEXT,
  action_type TEXT,
  action_data JSONB,
  data_points JSONB,
  user_id UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.halevai_recommendations ENABLE ROW LEVEL SECURITY;

-- Halevai Conversations
CREATE TABLE public.halevai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.halevai_conversations ENABLE ROW LEVEL SECURITY;

-- Halevai Messages
CREATE TABLE public.halevai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.halevai_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.halevai_messages ENABLE ROW LEVEL SECURITY;

-- Content Posts
CREATE TABLE public.content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  platform TEXT,
  post_type TEXT,
  scheduled_date DATE,
  status TEXT DEFAULT 'draft',
  state TEXT,
  county TEXT,
  language TEXT DEFAULT 'english',
  hashtags TEXT[] DEFAULT '{}',
  image_url TEXT,
  campaign_id UUID REFERENCES public.campaigns(id),
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

-- Landing Pages
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  state TEXT,
  county TEXT,
  language TEXT DEFAULT 'english',
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_cta_text TEXT DEFAULT 'Apply Now',
  benefits JSONB DEFAULT '[]',
  testimonials JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  pay_rate_highlight TEXT,
  published BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  form_submissions INT DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  campaign_id UUID REFERENCES public.campaigns(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  reviewer_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  responded BOOLEAN DEFAULT false,
  response_text TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Locations
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state TEXT,
  city TEXT,
  county TEXT,
  address TEXT,
  phone TEXT,
  gbp_connected BOOLEAN DEFAULT false,
  service_counties TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Business Config
CREATE TABLE public.business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT,
  tagline TEXT,
  industry TEXT DEFAULT 'home_care',
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

-- Automation Configs
CREATE TABLE public.automation_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  automation_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  actions_this_week INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.automation_configs ENABLE ROW LEVEL SECURITY;

-- Activity Log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Daily Briefings
CREATE TABLE public.daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;

-- Growth Playbooks
CREATE TABLE public.growth_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  steps JSONB DEFAULT '[]',
  variables JSONB DEFAULT '{}',
  best_for TEXT,
  estimated_time TEXT,
  estimated_cost TEXT,
  estimated_results TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.growth_playbooks ENABLE ROW LEVEL SECURITY;

-- Ad Creatives
CREATE TABLE public.ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT,
  image_url TEXT,
  headline TEXT,
  body_copy TEXT,
  campaign_id UUID REFERENCES public.campaigns(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Sourcing Campaigns
CREATE TABLE public.sourcing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state TEXT,
  county TEXT,
  target_language TEXT DEFAULT 'english',
  status TEXT DEFAULT 'draft',
  criteria JSONB DEFAULT '{}',
  max_candidates INT DEFAULT 50,
  candidates_found INT DEFAULT 0,
  candidates_enriched INT DEFAULT 0,
  candidates_pushed INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  schedule TEXT DEFAULT 'manual',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sourcing_campaigns ENABLE ROW LEVEL SECURITY;

-- Sourced Candidates
CREATE TABLE public.sourced_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  sourcing_campaign_id UUID REFERENCES public.sourcing_campaigns(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source_platform TEXT,
  state TEXT,
  county TEXT,
  city TEXT,
  current_employer TEXT,
  current_pay_rate NUMERIC,
  years_experience NUMERIC,
  languages_spoken TEXT[] DEFAULT '{}',
  currently_caregiving BOOLEAN,
  enrichment_status TEXT DEFAULT 'pending',
  enrichment_data JSONB,
  match_score INT CHECK (match_score >= 0 AND match_score <= 100),
  outreach_status TEXT DEFAULT 'not_started',
  phone_screen_status TEXT DEFAULT 'not_started',
  promoted_to_caregiver_id UUID REFERENCES public.caregivers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sourced_candidates ENABLE ROW LEVEL SECURITY;

-- Phone Screens
CREATE TABLE public.phone_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  sourced_candidate_id UUID REFERENCES public.sourced_candidates(id),
  caregiver_id UUID REFERENCES public.caregivers(id),
  agent_provider TEXT DEFAULT 'bland',
  call_id TEXT,
  status TEXT DEFAULT 'pending',
  phone_number TEXT,
  duration_seconds INT,
  transcript TEXT,
  ai_summary TEXT,
  ai_score INT CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_recommendation TEXT,
  screening_answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.phone_screens ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's agency_id
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: check agency role
CREATE OR REPLACE FUNCTION public.has_agency_role(_user_id UUID, _agency_id UUID, _role public.agency_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id AND role = _role
  );
$$;

-- Helper: check membership
CREATE OR REPLACE FUNCTION public.is_agency_member(_user_id UUID, _agency_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members WHERE user_id = _user_id AND agency_id = _agency_id
  );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_caregivers_updated_at BEFORE UPDATE ON public.caregivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- Agencies: members can view their agency
CREATE POLICY "Members can view their agency" ON public.agencies FOR SELECT USING (public.is_agency_member(auth.uid(), id));
CREATE POLICY "Owners can update agency" ON public.agencies FOR UPDATE USING (public.has_agency_role(auth.uid(), id, 'owner'));
CREATE POLICY "Authenticated can create agency" ON public.agencies FOR INSERT WITH CHECK (true);

-- Agency Members
CREATE POLICY "Members can view their agency members" ON public.agency_members FOR SELECT USING (public.is_agency_member(auth.uid(), agency_id));
CREATE POLICY "Can insert own membership" ON public.agency_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can manage members" ON public.agency_members FOR DELETE USING (public.has_agency_role(auth.uid(), agency_id, 'owner'));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Auto-create profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- Onboarding
CREATE POLICY "Users can manage own onboarding" ON public.onboarding FOR ALL USING (user_id = auth.uid());

-- All agency-scoped tables: agency members can access
CREATE POLICY "Agency members can access caregivers" ON public.caregivers FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access activities" ON public.caregiver_activities FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access campaigns" ON public.campaigns FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access competitors" ON public.competitors FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access recommendations" ON public.halevai_recommendations FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access conversations" ON public.halevai_conversations FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access messages" ON public.halevai_messages FOR ALL USING (conversation_id IN (SELECT id FROM public.halevai_conversations WHERE agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())));
CREATE POLICY "Agency members can access content" ON public.content_posts FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access landing pages" ON public.landing_pages FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access reviews" ON public.reviews FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access locations" ON public.locations FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access business config" ON public.business_config FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access automations" ON public.automation_configs FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access activity log" ON public.activity_log FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access briefings" ON public.daily_briefings FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access playbooks" ON public.growth_playbooks FOR ALL USING (agency_id IS NULL OR agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access ad creatives" ON public.ad_creatives FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Agency members can access sourcing campaigns" ON public.sourcing_campaigns FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access sourced candidates" ON public.sourced_candidates FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
CREATE POLICY "Agency members can access phone screens" ON public.phone_screens FOR ALL USING (agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()));
