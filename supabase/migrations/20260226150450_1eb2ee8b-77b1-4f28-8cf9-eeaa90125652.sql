
-- Add new role values to the agency_role enum
ALTER TYPE public.agency_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.agency_role ADD VALUE IF NOT EXISTS 'intake_coordinator';

-- Create a helper function to check if user has write access (owner, admin, or ops_manager)
CREATE OR REPLACE FUNCTION public.is_write_role(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id AND role IN ('owner', 'admin', 'operations_manager', 'intake_coordinator')
  );
$$;
