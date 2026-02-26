
-- Store AI-analyzed pay rate intelligence per agency
CREATE TABLE public.pay_rate_intel (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id),
  state text,
  county text,
  recommended_rate numeric,
  medicaid_reimbursement_rate numeric,
  market_avg_rate numeric,
  market_min_rate numeric,
  market_max_rate numeric,
  competitor_count integer DEFAULT 0,
  analysis_summary text,
  sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.pay_rate_intel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can access pay rate intel"
ON public.pay_rate_intel FOR ALL
USING (agency_id IN (
  SELECT agency_members.agency_id FROM agency_members WHERE agency_members.user_id = auth.uid()
));

CREATE INDEX idx_pay_rate_intel_agency ON public.pay_rate_intel(agency_id);

CREATE TRIGGER update_pay_rate_intel_updated_at
BEFORE UPDATE ON public.pay_rate_intel
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
