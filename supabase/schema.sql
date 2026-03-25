-- ==========================================
-- FETEMI CONTENT AUTOMATION - SUPABASE SCHEMA
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  role TEXT DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. JOBS TABLE (Main Lifecycle)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  input_type TEXT CHECK (input_type IN ('idea', 'url')),
  topic TEXT,
  source_url TEXT,
  url_type TEXT CHECK (url_type IN ('social', 'paywall', 'standard', null)),
  idea_hash TEXT,
  scraped_content TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' 
    CHECK (status IN ('submitted','seo_research','drafting','awaiting_review',
                      'adapting','ready_to_publish','scheduling','published','failed')),
  current_phase_detail TEXT,
  error_message TEXT,
  raw_error TEXT,
  seo_keywords JSONB DEFAULT '{}',
  selected_draft_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 4. DRAFTS TABLE (3 drafts per job)
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  draft_number INT CHECK (draft_number IN (1, 2, 3)),
  title TEXT,
  content TEXT,
  angle TEXT,
  word_count INT,
  seo_score INT,
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-- 5. PLATFORM_POSTS TABLE (Adapted versions)
CREATE TABLE public.platform_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('linkedin', 'x', 'email')),
  content TEXT,
  subject_line TEXT,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  raw_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;

-- 6. NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 7. PLATFORM_CONNECTIONS TABLE (Shared status)
CREATE TABLE public.platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE CHECK (platform IN ('linkedin', 'x', 'email')),
  status TEXT DEFAULT 'disconnected' 
    CHECK (status IN ('active', 'broken', 'disconnected')),
  last_checked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Drafts (Inherits from Jobs)
CREATE POLICY "Users can view drafts of their own jobs" ON public.drafts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = drafts.job_id AND user_id = auth.uid()
    )
  );

-- Platform Posts (Inherits from Jobs)
CREATE POLICY "Users can view posts of their own jobs" ON public.platform_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE id = platform_posts.job_id AND user_id = auth.uid()
    )
  );

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Platform Connections (Publicly readable for status, only admins or n8n can update)
CREATE POLICY "Anyone authenticated can view connection status" ON public.platform_connections
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service Role policies (for n8n backend access)
CREATE POLICY "Service role full access on jobs" ON public.jobs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on drafts" ON public.drafts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on platform_posts" ON public.platform_posts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on profiles" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ==========================================
-- REALTIME REPLICATION
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
