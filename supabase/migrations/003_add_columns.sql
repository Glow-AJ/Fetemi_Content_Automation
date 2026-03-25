-- Add search_phrase to content_jobs
ALTER TABLE public.content_jobs ADD COLUMN IF NOT EXISTS search_phrase text;

-- Add new tracking columns to job_errors
ALTER TABLE public.job_errors ADD COLUMN IF NOT EXISTS node_name text;
ALTER TABLE public.job_errors ADD COLUMN IF NOT EXISTS workflow_name text;
ALTER TABLE public.job_errors ADD COLUMN IF NOT EXISTS execution_url text;
ALTER TABLE public.job_errors ADD COLUMN IF NOT EXISTS error_description text;
