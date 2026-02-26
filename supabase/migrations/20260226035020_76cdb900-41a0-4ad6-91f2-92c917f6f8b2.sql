
-- 1. referral_sources
CREATE TABLE public.referral_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'other',
  state text,
  county text,
  language_community text,
  url text,
  notes text,
  discovered_by text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access referral sources" ON public.referral_sources FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

-- 2. saved_campaign_templates
CREATE TABLE public.saved_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title text NOT NULL,
  campaign_type text,
  channel text,
  state text,
  target_language text DEFAULT 'english',
  content jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  performance_rating text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.saved_campaign_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access campaign templates" ON public.saved_campaign_templates FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

-- 3. campaign_sequences
CREATE TABLE public.campaign_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'manual',
  target_state text,
  target_language text DEFAULT 'english',
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access sequences" ON public.campaign_sequences FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));
CREATE TRIGGER update_campaign_sequences_updated_at BEFORE UPDATE ON public.campaign_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. sequence_steps
CREATE TABLE public.sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  step_number integer NOT NULL DEFAULT 1,
  delay_hours integer NOT NULL DEFAULT 0,
  channel text NOT NULL DEFAULT 'sms',
  subject text,
  body text,
  ai_generated boolean DEFAULT false,
  active boolean DEFAULT true
);
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access sequence steps" ON public.sequence_steps FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

-- 5. sequence_enrollments
CREATE TABLE public.sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  current_step integer DEFAULT 1,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access enrollments" ON public.sequence_enrollments FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

-- 6. campaign_packages
CREATE TABLE public.campaign_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES public.halevai_recommendations(id) ON DELETE SET NULL,
  platforms jsonb DEFAULT '[]'::jsonb,
  content jsonb DEFAULT '{}'::jsonb,
  utm_params jsonb DEFAULT '{}'::jsonb,
  tracking_urls jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.campaign_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access campaign packages" ON public.campaign_packages FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

-- 7. landing_page_events
CREATE TABLE public.landing_page_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;
-- Public insert for anonymous visitors, read for agency members
CREATE POLICY "Anyone can insert landing page events" ON public.landing_page_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Agency members can read landing page events" ON public.landing_page_events FOR SELECT USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));

-- 8. review_requests
CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
  status text DEFAULT 'sent',
  reminder_count integer DEFAULT 0,
  max_reminders integer DEFAULT 3,
  review_link text,
  sent_at timestamptz DEFAULT now(),
  clicked_at timestamptz,
  completed_at timestamptz
);
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency members can access review requests" ON public.review_requests FOR ALL USING (agency_id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));
