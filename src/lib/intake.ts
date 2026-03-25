// ==========================================
// Intake Workflow — Core Logic
// URL validation, job creation, webhook firing
// Dedup and hashing are handled by n8n, not the frontend.
// ==========================================

import { SupabaseClient } from '@supabase/supabase-js';
import { SOCIAL_DOMAINS, KNOWN_PAYWALL_DOMAINS } from './constants';
import type { UrlType, InputType } from '@/types/database';

// ─── URL Validation ─────────────────────────────────────────────

interface UrlValidationResult {
  valid: boolean;
  type: UrlType | null;
  error: string | null;
}

const ACCEPTED_SOCIAL_DOMAINS = ['linkedin.com', 'twitter.com', 'x.com'];
const REJECTED_SOCIAL_DOMAINS = [
  'instagram.com', 'facebook.com', 'fb.com', 'tiktok.com',
  'youtube.com', 'youtu.be', 'reddit.com', 'pinterest.com',
  'threads.net', 'mastodon.social',
];

/**
 * Validates and classifies a URL.
 * - Only LinkedIn and Twitter/X social URLs are accepted.
 * - Other known social platforms are explicitly rejected with a clear message.
 * - Paywall domains get a warning classification.
 * - Everything else is "standard".
 */
export function validateUrl(rawUrl: string): UrlValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, type: null, error: 'URL is required.' };
  }

  // Basic URL format check
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, type: null, error: 'Please enter a valid URL (e.g., https://example.com/article).' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, type: null, error: 'URL must start with http:// or https://.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // Check for rejected social platforms first
  if (REJECTED_SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return {
      valid: false,
      type: null,
      error: 'Only LinkedIn and Twitter/X URLs are supported for social content. Please use a direct link or paste the content as an idea instead.',
    };
  }

  // Accepted social domains
  if (ACCEPTED_SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return { valid: true, type: 'social', error: null };
  }

  // Also check constants-defined social domains (future-proofing)
  if (SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return { valid: true, type: 'social', error: null };
  }

  // Paywall domains
  if (KNOWN_PAYWALL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return { valid: true, type: 'paywall', error: null };
  }

  return { valid: true, type: 'standard', error: null };
}

/**
 * Quick classify without validation (for real-time UI feedback while typing).
 * Returns the classification type or null if URL is incomplete/invalid.
 */
export function classifyUrlQuick(rawUrl: string): { type: UrlType | null; rejected: boolean; rejectReason: string | null } {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length < 8) {
    return { type: null, rejected: false, rejectReason: null };
  }

  const lower = trimmed.toLowerCase();

  // Check rejected social domains
  if (REJECTED_SOCIAL_DOMAINS.some(d => lower.includes(d))) {
    return {
      type: null,
      rejected: true,
      rejectReason: 'Only LinkedIn and Twitter/X URLs are supported for social content.',
    };
  }

  // Check accepted social
  if (ACCEPTED_SOCIAL_DOMAINS.some(d => lower.includes(d))) {
    return { type: 'social', rejected: false, rejectReason: null };
  }

  // Check paywall
  if (KNOWN_PAYWALL_DOMAINS.some(d => lower.includes(d))) {
    return { type: 'paywall', rejected: false, rejectReason: null };
  }

  // If it looks like a URL, it's standard
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return { type: 'standard', rejected: false, rejectReason: null };
  }

  return { type: null, rejected: false, rejectReason: null };
}

// ─── Job Creation & Webhook ─────────────────────────────────────

interface CreateJobParams {
  supabase: SupabaseClient;
  userId: string;
  userEmail: string;
  inputType: InputType;
  topic?: string;
  url?: string;
  urlType?: UrlType;
}

interface CreateJobResult {
  success: boolean;
  jobId: string | null;
  error: {
    what: string;
    why: string;
    nextStep: string;
  } | null;
}

/**
 * Creates a job in Supabase and fires the n8n intake webhook.
 * 
 * The webhook is fire-and-forget — we don't wait for n8n to finish.
 * The frontend immediately subscribes to Realtime for status updates.
 * 
 * Deduplication, content hashing, scraping, and AI normalization
 * are all handled by the n8n workflow — not the frontend.
 */
export async function createJobAndFireWebhook(params: CreateJobParams): Promise<CreateJobResult> {
  const {
    supabase, userId, userEmail, inputType, topic, url, urlType,
  } = params;

  // 1. Insert job into Supabase
  const { data: job, error: insertError } = await supabase
    .from('content_jobs')
    .insert({
      user_id: userId,
      input_type: inputType,
      topic: topic || null,
      source_url: url || null,
      url_type: urlType || null,
      status: 'submitted',
      current_phase_detail: 'Job submitted, queued for processing',
    })
    .select('id')
    .single();

  if (insertError || !job) {
    console.error('[Intake] Job creation failed:', insertError?.message);
    return {
      success: false,
      jobId: null,
      error: {
        what: 'Failed to create your content project.',
        why: insertError?.message?.includes('duplicate')
          ? 'A project with this information already exists.'
          : 'There was a problem saving to the database. This is usually temporary.',
        nextStep: 'Please try again. If the problem persists, contact support.',
      },
    };
  }

  // 2. Fire the n8n intake webhook (fire-and-forget)
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_INTAKE;

  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      // Don't await the full response — fire and forget
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          inputType,
          url: url || null,
          urlType: urlType || null,
          topic: topic || null,
          userEmail,
        }),
      }).catch((err) => {
        // Log webhook failure but don't block the user
        console.error('[Intake] Webhook fire failed:', err.message);
        // Update the job with a note about the trigger failure
        supabase
          .from('content_jobs')
          .update({
            current_phase_detail: 'Submitted but automation trigger failed. Please contact support.',
          })
          .eq('id', job.id)
          .then(() => {});
      });
    } catch {
      // Network error on fetch itself — very rare
      console.error('[Intake] Could not fire webhook');
    }
  } else {
    console.warn('[Intake] n8n webhook URL not configured. Job created but automation will not start.');
  }

  return { success: true, jobId: job.id, error: null };
}
