-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert 9 new automation configs for all existing agencies
INSERT INTO automation_configs (agency_id, automation_key, label, description, active)
SELECT a.id, v.automation_key, v.label, v.description, false
FROM agencies a
CROSS JOIN (VALUES
  ('auto_welcome_sms', 'Auto Welcome SMS', 'Send welcome SMS to caregivers scored HOT (≥75)'),
  ('auto_followup_sms', 'Auto Follow-Up SMS', '4-stage progressive SMS follow-up for unresponsive caregivers'),
  ('process_sequences', 'Process Message Sequences', 'Send scheduled sequence steps (SMS/email) to enrolled caregivers'),
  ('auto_source_candidates', 'Auto-Source Candidates', 'Run active sourcing campaigns daily'),
  ('auto_outreach_high_match', 'Auto-Outreach High Match', 'Queue sourced candidates with match score ≥80 for outreach'),
  ('auto_screen_responded', 'Auto-Screen Responded', 'Schedule AI phone screen when sourced candidate responds to outreach'),
  ('auto_review_request', 'Auto Review Request', 'Send review request when caregiver reaches Active status'),
  ('background_check_reminder', 'Background Check Reminder', 'Alert when background check has been pending >14 days'),
  ('auth_expiry_alert', 'Authorization Expiry Alert', '30-day warning before Medicaid authorization expires')
) AS v(automation_key, label, description)
WHERE NOT EXISTS (
  SELECT 1 FROM automation_configs ac 
  WHERE ac.agency_id = a.id AND ac.automation_key = v.automation_key
);