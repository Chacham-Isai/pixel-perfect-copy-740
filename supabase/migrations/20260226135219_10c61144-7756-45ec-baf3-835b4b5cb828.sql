
-- 1. Add 'viewer' to agency_role enum
ALTER TYPE public.agency_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Create get_user_agency_role() function
CREATE OR REPLACE FUNCTION public.get_user_agency_role(_user_id uuid, _agency_id uuid)
RETURNS agency_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.agency_members
  WHERE user_id = _user_id AND agency_id = _agency_id
  LIMIT 1;
$$;

-- 3. Create helper: is_owner_or_admin (checks role is owner or admin)
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id AND role IN ('owner', 'admin')
  );
$$;

-- 4. Replace ALL policies on sensitive tables with separate SELECT (all members) + INSERT/UPDATE/DELETE (owner/admin only)

-- === competitors ===
DROP POLICY IF EXISTS "Agency members can access competitors" ON public.competitors;

CREATE POLICY "Members can view competitors"
ON public.competitors FOR SELECT TO authenticated
USING (is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Owner/admin can modify competitors"
ON public.competitors FOR ALL TO authenticated
USING (is_owner_or_admin(auth.uid(), agency_id))
WITH CHECK (is_owner_or_admin(auth.uid(), agency_id));

-- === pay_rate_intel ===
DROP POLICY IF EXISTS "Agency members can access pay rate intel" ON public.pay_rate_intel;

CREATE POLICY "Members can view pay rate intel"
ON public.pay_rate_intel FOR SELECT TO authenticated
USING (is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Owner/admin can modify pay rate intel"
ON public.pay_rate_intel FOR ALL TO authenticated
USING (is_owner_or_admin(auth.uid(), agency_id))
WITH CHECK (is_owner_or_admin(auth.uid(), agency_id));

-- === campaigns ===
DROP POLICY IF EXISTS "Agency members can access campaigns" ON public.campaigns;

CREATE POLICY "Members can view campaigns"
ON public.campaigns FOR SELECT TO authenticated
USING (is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Owner/admin can modify campaigns"
ON public.campaigns FOR ALL TO authenticated
USING (is_owner_or_admin(auth.uid(), agency_id))
WITH CHECK (is_owner_or_admin(auth.uid(), agency_id));

-- === automation_configs ===
DROP POLICY IF EXISTS "Agency members can access automations" ON public.automation_configs;

CREATE POLICY "Members can view automations"
ON public.automation_configs FOR SELECT TO authenticated
USING (is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Owner/admin can modify automations"
ON public.automation_configs FOR ALL TO authenticated
USING (is_owner_or_admin(auth.uid(), agency_id))
WITH CHECK (is_owner_or_admin(auth.uid(), agency_id));

-- === business_config ===
DROP POLICY IF EXISTS "Agency members can access business config" ON public.business_config;

CREATE POLICY "Members can view business config"
ON public.business_config FOR SELECT TO authenticated
USING (is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Owner/admin can modify business config"
ON public.business_config FOR ALL TO authenticated
USING (is_owner_or_admin(auth.uid(), agency_id))
WITH CHECK (is_owner_or_admin(auth.uid(), agency_id));

-- === agency_members: add UPDATE policy for owners ===
CREATE POLICY "Owners can update members"
ON public.agency_members FOR UPDATE TO authenticated
USING (has_agency_role(auth.uid(), agency_id, 'owner'::agency_role))
WITH CHECK (has_agency_role(auth.uid(), agency_id, 'owner'::agency_role));

-- 5. Rate limiting trigger on landing_page_events
CREATE OR REPLACE FUNCTION public.check_landing_page_event_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.landing_page_events
  WHERE landing_page_id = NEW.landing_page_id
    AND created_at > (now() - interval '1 minute');

  IF recent_count >= 60 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many events for this landing page';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER rate_limit_landing_page_events
BEFORE INSERT ON public.landing_page_events
FOR EACH ROW
EXECUTE FUNCTION public.check_landing_page_event_rate_limit();
