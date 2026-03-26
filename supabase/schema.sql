-- ==========================================
-- FETEMI CONTENT AUTOMATION - SUPABASE SCHEMA OVERHAUL
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP OLD TABLES (for clean overwrite if needed, or migration context)
DROP TABLE IF EXISTS public.newsletter_sends CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.job_errors CASCADE;
DROP TABLE IF EXISTS public.publish_log CASCADE;
DROP TABLE IF EXISTS public.platform_posts CASCADE;
DROP TABLE IF EXISTS public.article_drafts CASCADE;
DROP TABLE IF EXISTS public.seo_briefs CASCADE;
DROP TABLE IF EXISTS public.job_status_history CASCADE;
DROP TABLE IF EXISTS public.content_jobs CASCADE;
DROP TABLE IF EXISTS public.platform_connections CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.drafts CASCADE;

-- 3. DROP ENUMS IF EXISTS
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.draft_status CASCADE;
DROP TYPE IF EXISTS public.platform_type CASCADE;
DROP TYPE IF EXISTS public.post_status CASCADE;
DROP TYPE IF EXISTS public.publish_status CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.connection_status CASCADE;
DROP TYPE IF EXISTS public.subscriber_status CASCADE;

-- 4. TYPE DEFINITIONS
CREATE TYPE public.job_status AS ENUM ('submitted', 'seo_research', 'drafting', 'awaiting_review', 'adapting', 'ready_to_publish', 'scheduling', 'published', 'failed');
CREATE TYPE public.draft_status AS ENUM ('generated', 'failed', 'selected', 'rejected');
CREATE TYPE public.platform_type AS ENUM ('linkedin', 'twitter', 'email');
CREATE TYPE public.post_status AS ENUM ('pending', 'scheduled', 'ready_to_publish', 'published', 'manually_published', 'failed');
CREATE TYPE public.publish_status AS ENUM ('sent', 'failed', 'bounced');
CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'error');
CREATE TYPE public.connection_status AS ENUM ('active', 'broken', 'not_connected');
CREATE TYPE public.subscriber_status AS ENUM ('active', 'unsubscribed');

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TABLES CREATION

-- content_jobs
CREATE TABLE public.content_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  original_input TEXT NOT NULL,
  input_type TEXT CHECK (input_type IN ('idea', 'url')),
  source_url TEXT,
  input_hash TEXT,
  normalised_idea TEXT,
  status public.job_status DEFAULT 'submitted',
  duplicate_warning BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_content_jobs_updated_at BEFORE UPDATE ON public.content_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- job_status_history
CREATE TABLE public.job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  status public.job_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_job_status_history_updated_at BEFORE UPDATE ON public.job_status_history FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- seo_briefs
CREATE TABLE public.seo_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  primary_keyword TEXT,
  short_tail_keywords TEXT[],
  long_tail_keywords TEXT[],
  paa_questions TEXT[],
  competitor_urls TEXT[],
  internal_links TEXT[],
  external_links TEXT[],
  image_context_prompt TEXT,
  raw_dataforseo_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_seo_briefs_updated_at BEFORE UPDATE ON public.seo_briefs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- article_drafts
CREATE TABLE public.article_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  angle TEXT,
  content TEXT,
  seo_validation_score JSONB,
  word_count INT,
  character_count INT,
  status public.draft_status DEFAULT 'generated',
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_article_drafts_updated_at BEFORE UPDATE ON public.article_drafts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- platform_posts
CREATE TABLE public.platform_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  platform public.platform_type NOT NULL,
  content TEXT,
  subject_line TEXT,
  character_count INT,
  word_count INT,
  publish_at TIMESTAMPTZ,
  status public.post_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_platform_posts_updated_at BEFORE UPDATE ON public.platform_posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- publish_log
CREATE TABLE public.publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.platform_posts(id) ON DELETE CASCADE,
  platform public.platform_type NOT NULL,
  success BOOLEAN,
  message TEXT,
  raw_api_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_publish_log_updated_at BEFORE UPDATE ON public.publish_log FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- job_errors
CREATE TABLE public.job_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  workflow_phase TEXT,
  message TEXT,
  raw_error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_job_errors_updated_at BEFORE UPDATE ON public.job_errors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  message TEXT,
  type public.notification_type NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- settings
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- platform_connections
CREATE TABLE public.platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  platform public.platform_type NOT NULL,
  status public.connection_status DEFAULT 'not_connected',
  credential_reference_id TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_platform_connections_updated_at BEFORE UPDATE ON public.platform_connections FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- subscribers
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  status public.subscriber_status DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- newsletter_sends
CREATE TABLE public.newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.content_jobs(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.platform_posts(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE,
  status public.publish_status NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_newsletter_sends_updated_at BEFORE UPDATE ON public.newsletter_sends FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- 6. ROW LEVEL SECURITY
ALTER TABLE public.content_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES (Users access own rows)
CREATE POLICY "Users can access their own rows" ON public.content_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.job_status_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.seo_briefs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.article_drafts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.platform_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.publish_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.job_errors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.platform_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.subscribers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can access their own rows" ON public.newsletter_sends FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service Role Full Access
CREATE POLICY "Service role full access" ON public.content_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.job_status_history FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.seo_briefs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.article_drafts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.platform_posts FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.publish_log FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.job_errors FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.notifications FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.settings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.platform_connections FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.subscribers FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.newsletter_sends FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
