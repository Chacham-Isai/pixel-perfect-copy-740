
-- Add branching columns to sequence_steps for advanced sequence logic
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS step_type TEXT DEFAULT 'message' CHECK (step_type IN ('message', 'condition', 'wait', 'action'));
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS condition_type TEXT CHECK (condition_type IN ('replied', 'no_reply', 'keyword_match', 'status_changed', 'score_above', 'score_below', 'time_elapsed'));
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS condition_value TEXT;
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS true_next_step_id UUID REFERENCES sequence_steps(id);
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS false_next_step_id UUID REFERENCES sequence_steps(id);
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS action_type TEXT CHECK (action_type IN ('update_status', 'add_tag', 'assign_to', 'create_notification', 'enroll_in_sequence', 'remove_from_sequence', 'update_score'));
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS action_config JSONB DEFAULT '{}';
