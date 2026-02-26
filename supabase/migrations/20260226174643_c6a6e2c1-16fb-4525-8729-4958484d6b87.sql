
-- Drop any partially created policies from first attempt
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Public can view agency basic info" ON public.agencies;
DROP POLICY IF EXISTS "Public can view business config for branding" ON public.business_config;
DROP POLICY IF EXISTS "Public can submit caregiver applications" ON public.caregivers;
DROP POLICY IF EXISTS "Public can update landing page view counts" ON public.landing_pages;

-- Public SELECT on published landing pages
CREATE POLICY "Public can view published landing pages"
ON public.landing_pages
FOR SELECT
USING (published = true);

-- Public SELECT on agencies for branding
CREATE POLICY "Public can view agency basic info"
ON public.agencies
FOR SELECT
USING (true);

-- Public SELECT on business_config for branding
CREATE POLICY "Public can view business config for branding"
ON public.business_config
FOR SELECT
USING (true);

-- Public INSERT into caregivers (only from landing pages)
CREATE POLICY "Public can submit caregiver applications"
ON public.caregivers
FOR INSERT
WITH CHECK (
  source = 'landing_page'::lead_source
  AND landing_page_id IS NOT NULL
  AND status = 'new'::lead_status
);

-- Public UPDATE on landing pages for view count incrementing
CREATE POLICY "Public can update landing page view counts"
ON public.landing_pages
FOR UPDATE
USING (published = true)
WITH CHECK (published = true);
