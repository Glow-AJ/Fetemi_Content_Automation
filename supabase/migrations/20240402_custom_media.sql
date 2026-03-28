-- ========================================================
-- SELF-HEALING & CUSTOM MEDIA MIGRATION
-- ========================================================

-- 1. Profiles Fix: Add email column (missing from previous UI logic)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Sync existing emails from auth.users (one-time fix)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update Trigger to include email on new sign-ups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Custom Media: Add column for user-uploaded images
ALTER TABLE public.platform_posts ADD COLUMN IF NOT EXISTS custom_image_url TEXT;

-- 5. Create storage bucket for platform media (Public)
-- Note: Requires storage-specific permissions if not using RPCs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('platform_media', 'platform_media', true)
ON CONFLICT (id) DO NOTHING;

-- 6. RLS for Storage (Public Access)
CREATE POLICY "Public Access for Platform Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'platform_media');

CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'platform_media' 
  AND auth.role() = 'authenticated'
);
