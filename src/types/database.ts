// ==========================================
// Supabase Database Types
// ==========================================

export type JobStatus =
  | 'submitted'
  | 'seo_research'
  | 'drafting'
  | 'awaiting_review'
  | 'adapting'
  | 'ready_to_publish'
  | 'scheduling'
  | 'published'
  | 'failed';

export type UrlType = 'social' | 'paywall' | 'standard';
export type InputType = 'idea' | 'url';
export type Platform = 'linkedin' | 'x' | 'email';
export type PlatformPostStatus = 'pending' | 'scheduled' | 'published' | 'failed';

export interface Job {
  id: string;
  user_id: string;
  topic: string | null;
  source_url: string | null;
  url_type: UrlType | null;
  input_type: InputType | null;
  idea_hash: string | null;
  scraped_content: string | null;
  status: JobStatus;
  current_phase_detail: string | null;
  error_message: string | null;
  raw_error: string | null;
  seo_keywords: Record<string, unknown>;
  selected_draft_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  job_id: string;
  draft_number: 1 | 2 | 3;
  title: string | null;
  content: string | null;
  angle: string | null;
  word_count: number | null;
  seo_score: number | null;
  selected: boolean;
  created_at: string;
}

export interface PlatformPost {
  id: string;
  job_id: string;
  platform: Platform;
  content: string | null;
  subject_line: string | null;
  status: PlatformPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  raw_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  job_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  role: 'admin' | 'manager';
  created_at: string;
  updated_at: string;
}

export interface PlatformConnection {
  id: string;
  platform: Platform;
  status: 'active' | 'broken' | 'disconnected';
  last_checked_at: string | null;
  updated_at: string;
}
