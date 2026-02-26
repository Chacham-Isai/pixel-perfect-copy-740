
-- Tighten agencies INSERT: only authenticated users can create, not anon
DROP POLICY IF EXISTS "Authenticated can create agency" ON public.agencies;
CREATE POLICY "Authenticated can create agency"
ON public.agencies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Tighten landing_page_events INSERT: add basic validation
DROP POLICY IF EXISTS "Anyone can insert landing page events" ON public.landing_page_events;
CREATE POLICY "Anyone can insert landing page events"
ON public.landing_page_events
FOR INSERT
WITH CHECK (
  event_type IS NOT NULL 
  AND landing_page_id IS NOT NULL 
  AND agency_id IS NOT NULL
);
