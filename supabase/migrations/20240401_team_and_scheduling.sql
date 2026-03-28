-- ========================================================
-- ADVANCED SCHEDULING & TEAM MANAGEMENT MIGRATION
-- ========================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Profiles Table (User Metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Team Invitations Table (Pending Tracking)
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Function: Auto-create Profile on Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', 'member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Auth Sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Scheduling: High-Efficiency Trigger
-- This function finds due posts and fires them to n8n
CREATE OR REPLACE FUNCTION public.check_and_publish_scheduled_posts()
RETURNS VOID AS $$
DECLARE
    post_record RECORD;
    webhook_url TEXT;
BEGIN
    -- 1. Identify "scheduled" posts whose time has passed
    FOR post_record IN 
        SELECT p.id, p.job_id, p.platform, p.user_id, u.email as user_email
        FROM public.platform_posts p
        JOIN auth.users u ON u.id = p.user_id
        WHERE p.status = 'scheduled' 
        AND p.publish_at <= now()
    LOOP
        -- 2. Determine Webhook URL based on platform
        IF post_record.platform = 'linkedin' THEN
            SELECT value INTO webhook_url FROM public.settings WHERE id = 'NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH_LINKEDIN'; -- Fallback or direct env reference if handled by pg_net
        ELSIF post_record.platform = 'email' THEN
            SELECT value INTO webhook_url FROM public.settings WHERE id = 'NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH_EMAIL';
        END IF;

        -- NOTE: Since environment variables are not directly accessible in Postgres, 
        -- we assume the system will provide the correct webhook via a settings table or a hardcoded placeholder for the user to update.
        -- For now, we fire a generic "scheduling_trigger" that n8n can listen to if configured, 
        -- OR we'll advise the user to replace 'YOUR_N8N_WEBHOOK' with their actual URL below.
        
        -- In many production setups, we'd store the webhook URLs in a 'vault' or a settings table.
        -- We'll look for a setting first. 
        
        -- 3. Mark as 'publishing' to prevent double fires
        UPDATE public.platform_posts SET status = 'pending' WHERE id = post_record.id;

        -- 4. Fire the HTTP request asynchronously
        -- Replace the 'URL' with your n8n generic publish webhook if desired
        -- For maximum flexibility, n8n can have one entry point that routes based on platform
        PERFORM net.http_post(
            url := 'https://n8n.your-instance.com/webhook/publish-trigger', -- USER MUST UPDATE THIS
            body := jsonb_build_object(
                'post_id', post_record.id,
                'job_id', post_record.job_id,
                'platform', post_record.platform,
                'user_id', post_record.user_id,
                'user_email', post_record.user_email
            )::text,
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Schedule the Cron Job
SELECT cron.schedule('check-scheduled-posts', '* * * * *', 'SELECT public.check_and_publish_scheduled_posts()');

-- 7. RLS for new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Invitations are viewable by everyone in team" ON public.team_invitations FOR SELECT USING (true);
CREATE POLICY "Admins can manage invitations" ON public.team_invitations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
