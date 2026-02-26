
-- Table 1: api_keys — stores per-agency integration credentials
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  connected BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, key_name)
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- SELECT: agency members can view
CREATE POLICY "Agency members can view api keys"
  ON public.api_keys FOR SELECT
  USING (public.is_owner_or_admin(auth.uid(), agency_id));

-- INSERT: owner/admin only
CREATE POLICY "Owner/admin can insert api keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (public.is_owner_or_admin(auth.uid(), agency_id));

-- UPDATE: owner/admin only
CREATE POLICY "Owner/admin can update api keys"
  ON public.api_keys FOR UPDATE
  USING (public.is_owner_or_admin(auth.uid(), agency_id));

-- DELETE: owner/admin only
CREATE POLICY "Owner/admin can delete api keys"
  ON public.api_keys FOR DELETE
  USING (public.is_owner_or_admin(auth.uid(), agency_id));

-- Table 2: message_log — unified log of all messages
CREATE TABLE public.message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'in_app')),
  to_contact TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  external_id TEXT,
  template TEXT,
  related_type TEXT,
  related_id UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view message log"
  ON public.message_log FOR SELECT
  USING (public.is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Owner/admin can insert message log"
  ON public.message_log FOR INSERT
  WITH CHECK (public.is_owner_or_admin(auth.uid(), agency_id));

-- Table 3: agent_activity_log — recruitment agent audit trail
CREATE TABLE public.agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('sourcing', 'outreach', 'phone_screen', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can access agent activity log"
  ON public.agent_activity_log FOR ALL
  USING (public.is_agency_member(auth.uid(), agency_id));

-- Enable Realtime on agent_activity_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_activity_log;

-- Add updated_at trigger for api_keys
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
