
-- Create storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-creatives', 'ad-creatives', true);

-- Allow anyone to view ad creative images
CREATE POLICY "Ad creative images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-creatives');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload ad creatives"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-creatives' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update ad creatives"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ad-creatives' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete ad creatives"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-creatives' AND auth.role() = 'authenticated');
