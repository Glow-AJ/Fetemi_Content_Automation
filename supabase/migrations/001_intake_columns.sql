-- ==========================================
-- INTAKE WORKFLOW MIGRATION
-- Adds columns needed for the intake flow
-- ==========================================

-- 1. Add new columns to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS input_type TEXT CHECK (input_type IN ('idea', 'url'));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS scraped_content TEXT;

-- 2. Service-role RLS policies (allows n8n with service_role key to read/write all rows)
-- Jobs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on jobs' AND tablename = 'jobs') THEN
    CREATE POLICY "Service role full access on jobs" ON public.jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Drafts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on drafts' AND tablename = 'drafts') THEN
    CREATE POLICY "Service role full access on drafts" ON public.drafts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Platform Posts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on platform_posts' AND tablename = 'platform_posts') THEN
    CREATE POLICY "Service role full access on platform_posts" ON public.platform_posts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Service role full access on notifications" ON public.notifications FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Service role full access on profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
