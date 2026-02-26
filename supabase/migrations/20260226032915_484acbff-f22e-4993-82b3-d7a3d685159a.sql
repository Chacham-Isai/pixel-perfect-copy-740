
-- Fix: restrict agency creation to authenticated users only
DROP POLICY "Authenticated can create agency" ON public.agencies;
CREATE POLICY "Authenticated can create agency" ON public.agencies FOR INSERT TO authenticated WITH CHECK (true);
