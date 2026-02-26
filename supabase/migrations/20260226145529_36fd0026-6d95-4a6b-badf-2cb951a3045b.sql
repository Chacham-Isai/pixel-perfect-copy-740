
-- Create inbound_messages table
CREATE TABLE public.inbound_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  from_contact TEXT NOT NULL,
  to_contact TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  external_id TEXT,
  caregiver_id UUID REFERENCES public.caregivers(id),
  sourced_candidate_id UUID REFERENCES public.sourced_candidates(id),
  matched BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inbound_messages_agency ON public.inbound_messages(agency_id);
CREATE INDEX idx_inbound_messages_from ON public.inbound_messages(from_contact);
CREATE INDEX idx_inbound_messages_caregiver ON public.inbound_messages(caregiver_id);

ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;

-- RLS: agency members can SELECT and UPDATE
CREATE POLICY "Agency members can view inbound messages"
  ON public.inbound_messages FOR SELECT
  USING (is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Agency members can update inbound messages"
  ON public.inbound_messages FOR UPDATE
  USING (is_agency_member(auth.uid(), agency_id));

-- Service role inserts (edge function) - no authenticated INSERT policy needed
-- but we need one for the edge function using service_role which bypasses RLS

-- Create conversation_threads table
CREATE TABLE public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  contact_phone TEXT,
  contact_email TEXT,
  contact_name TEXT,
  caregiver_id UUID REFERENCES public.caregivers(id),
  sourced_candidate_id UUID REFERENCES public.sourced_candidates(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'snoozed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_threads_agency ON public.conversation_threads(agency_id);
CREATE INDEX idx_threads_contact ON public.conversation_threads(contact_phone, contact_email);

ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can access threads"
  ON public.conversation_threads FOR ALL
  USING (is_agency_member(auth.uid(), agency_id));

-- Enable realtime for inbound_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_threads;
