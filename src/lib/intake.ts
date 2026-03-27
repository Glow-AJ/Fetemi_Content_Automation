// ==========================================
// Intake Workflow — Core Logic
// URL validation, job creation, webhook firing
// Dedup and hashing are handled by n8n, not the frontend.
// ==========================================

import { SOCIAL_DOMAINS, KNOWN_PAYWALL_DOMAINS } from './constants';
import type { UrlType } from '@/types/database';

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


