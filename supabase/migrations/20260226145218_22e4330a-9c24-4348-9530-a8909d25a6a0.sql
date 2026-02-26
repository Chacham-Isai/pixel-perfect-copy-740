
-- Add columns to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS platform_status TEXT DEFAULT 'draft';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add columns to business_config table
ALTER TABLE public.business_config ADD COLUMN IF NOT EXISTS hide_halevai_branding BOOLEAN DEFAULT false;
ALTER TABLE public.business_config ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.business_config ADD COLUMN IF NOT EXISTS email_from_name TEXT;
ALTER TABLE public.business_config ADD COLUMN IF NOT EXISTS email_reply_to TEXT;
