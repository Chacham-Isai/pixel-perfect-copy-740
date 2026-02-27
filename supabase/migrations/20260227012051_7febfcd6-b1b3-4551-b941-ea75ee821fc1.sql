
-- PART 1: Replace handle_new_user() trigger function with slug generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id   uuid;
  v_agency_name text;
  v_slug        text;
BEGIN
  -- 1. Create user profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT DO NOTHING;

  -- 2. Derive agency name from metadata or email
  v_agency_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'agency_name'),  ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- 3. Generate slug from agency name
  v_slug := lower(regexp_replace(v_agency_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  -- Ensure uniqueness by appending random suffix
  v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- 4. Create agency
  INSERT INTO public.agencies (id, name, slug, states, created_at, updated_at)
  VALUES (gen_random_uuid(), v_agency_name, v_slug, ARRAY['OR', 'MI'], NOW(), NOW())
  RETURNING id INTO v_agency_id;

  -- 5. Link user as owner
  INSERT INTO public.agency_members (id, agency_id, user_id, role, joined_at)
  VALUES (gen_random_uuid(), v_agency_id, NEW.id, 'owner', NOW())
  ON CONFLICT DO NOTHING;

  -- 6. Create default business_config
  INSERT INTO public.business_config (id, agency_id, business_name, created_at)
  VALUES (gen_random_uuid(), v_agency_id, v_agency_name, NOW())
  ON CONFLICT DO NOTHING;

  -- 7. Create default automation_configs
  INSERT INTO public.automation_configs (id, agency_id, automation_key, label, description, active, created_at)
  VALUES
    (gen_random_uuid(), v_agency_id, 'auto_lead_scoring', 'Automatic Lead Scoring', 'Automatically scores incoming leads based on engagement and profile data.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'auto_welcome_sms', 'Auto Welcome SMS', 'Sends a welcome text message to new leads immediately after enrollment.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'follow_up_reminders', 'Follow-Up Reminders', 'Reminds agents to follow up with leads that have not been contacted recently.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'stale_enrollment_alerts', 'Stale Enrollment Alerts', 'Alerts agents when an enrollment has had no activity for a configurable period.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'performance_alerts', 'Performance Alerts', 'Notifies managers when agent or agency KPIs fall below defined thresholds.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'background_check_reminder', 'Background Check Reminder', 'Reminds agents and applicants when a background check is pending or expiring.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'auth_expiry_alert', 'Authorization Expiry Alert', 'Sends alerts before agent licenses or authorizations expire.', TRUE, NOW()),
    (gen_random_uuid(), v_agency_id, 'process_sequences', 'Process Sequences', 'Runs configured multi-step drip sequences for lead nurturing and onboarding.', TRUE, NOW())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- PART 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PART 3: Backfill existing users who have no agency
DO $$
DECLARE
  rec           RECORD;
  v_agency_id   uuid;
  v_agency_name text;
  v_slug        text;
BEGIN
  FOR rec IN
    SELECT p.user_id, p.full_name, p.email
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.agency_members am WHERE am.user_id = p.user_id
    )
  LOOP
    v_agency_name := COALESCE(NULLIF(TRIM(rec.full_name), ''), SPLIT_PART(rec.email, '@', 1));
    v_slug := lower(regexp_replace(v_agency_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);

    INSERT INTO public.agencies (id, name, slug, states, created_at, updated_at)
    VALUES (gen_random_uuid(), v_agency_name, v_slug, ARRAY['OR', 'MI'], NOW(), NOW())
    RETURNING id INTO v_agency_id;

    INSERT INTO public.agency_members (id, agency_id, user_id, role, joined_at)
    VALUES (gen_random_uuid(), v_agency_id, rec.user_id, 'owner', NOW())
    ON CONFLICT DO NOTHING;

    INSERT INTO public.business_config (id, agency_id, business_name, created_at)
    VALUES (gen_random_uuid(), v_agency_id, v_agency_name, NOW())
    ON CONFLICT DO NOTHING;

    INSERT INTO public.automation_configs (id, agency_id, automation_key, label, description, active, created_at)
    VALUES
      (gen_random_uuid(), v_agency_id, 'auto_lead_scoring', 'Automatic Lead Scoring', 'Automatically scores incoming leads based on engagement and profile data.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'auto_welcome_sms', 'Auto Welcome SMS', 'Sends a welcome text message to new leads immediately after enrollment.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'follow_up_reminders', 'Follow-Up Reminders', 'Reminds agents to follow up with leads that have not been contacted recently.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'stale_enrollment_alerts', 'Stale Enrollment Alerts', 'Alerts agents when an enrollment has had no activity for a configurable period.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'performance_alerts', 'Performance Alerts', 'Notifies managers when agent or agency KPIs fall below defined thresholds.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'background_check_reminder', 'Background Check Reminder', 'Reminds agents and applicants when a background check is pending or expiring.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'auth_expiry_alert', 'Authorization Expiry Alert', 'Sends alerts before agent licenses or authorizations expire.', TRUE, NOW()),
      (gen_random_uuid(), v_agency_id, 'process_sequences', 'Process Sequences', 'Runs configured multi-step drip sequences for lead nurturing and onboarding.', TRUE, NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Backfilled agency % for user %', v_agency_name, rec.user_id;
  END LOOP;
END;
$$;
