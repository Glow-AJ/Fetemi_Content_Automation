-- ==========================================
-- SEO & DEDUPLICATION MIGRATION
-- Adds columns needed for deduplication, URL handling, and SEO
-- ==========================================

-- 1. Add new columns to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS url_type TEXT CHECK (url_type IN ('social', 'paywall', 'standard', null));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS idea_hash TEXT;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '{}'::jsonb;
