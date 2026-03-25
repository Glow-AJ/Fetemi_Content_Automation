'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  FileText, Link2, AlertCircle, ArrowLeft, Info,
  CheckCircle, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';
import {
  validateUrl,
  classifyUrlQuick,
} from '@/lib/intake';
import { createJobAction, checkDuplicateAction } from '@/app/actions/content';
import type { UrlType } from '@/types/database';

// ─── Structured Error Type ──────────────────────────────────────

interface StructuredError {
  what: string;
  why: string;
  nextStep: string;
}

// ─── Page Component ─────────────────────────────────────────────

export default function NewContentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Form state
  const [mode, setMode] = useState<'idea' | 'url'>('idea');
  const [idea, setIdea] = useState('');
  const [url, setUrl] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<StructuredError | null>(null);
  const [simpleError, setSimpleError] = useState<string | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // URL classification (real-time feedback - derived state)
  const urlClassification = React.useMemo(() => {
    if (mode === 'url' && url) {
      return classifyUrlQuick(url);
    }
    return { type: null, rejected: false, rejectReason: null };
  }, [url, mode]);

  // ─── Form Reset on Mode Switch ─────────────────────────────

  const switchMode = (newMode: 'idea' | 'url') => {
    setMode(newMode);
    setError(null);
    setSimpleError(null);
  };

  // ─── Submit Handler ─────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSimpleError(null);

    if (!user) {
      setSimpleError('You must be logged in to create content.');
      return;
    }

    // ── Validation ──
    if (mode === 'idea') {
      const trimmedIdea = idea.trim();
      if (trimmedIdea.length < 20) {
        setError({
          what: 'Your content idea is too short.',
          why: 'We need at least 20 characters to understand what you want to create.',
          nextStep: 'Add more detail about the topic, angle, or audience you have in mind.',
        });
        return;
      }
    }

    if (mode === 'url') {
      if (!url.trim()) {
        setError({
          what: 'No URL provided.',
          why: 'You selected URL mode but didn\'t enter a link.',
          nextStep: 'Paste the URL of the content you want to analyze, or switch to the "Write an Idea" tab.',
        });
        return;
      }

      const validation = validateUrl(url);
      if (!validation.valid) {
        setError({
          what: 'Invalid URL.',
          why: validation.error || 'The URL format is not recognized.',
          nextStep: 'Check the URL and try again. Make sure it starts with https://.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const input = mode === 'idea' ? idea.trim() : url.trim();

      // 1. Check for duplicates if not already bypassed
      if (!showDuplicateWarning) {
        const { isDuplicate } = await checkDuplicateAction(input);
        if (isDuplicate) {
          setShowDuplicateWarning(true);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Create Job
      const result = await createJobAction({
        inputType: mode,
        originalInput: input,
        sourceUrl: mode === 'url' ? url.trim() : undefined,
        userEmail: user.email || '',
        bypassDedupe: showDuplicateWarning,
      });

      if (!result.success || !result.jobId) {
        setError({
          what: 'Something went wrong.',
          why: result.error || 'The project could not be created.',
          nextStep: 'Please try again.',
        });
        setIsSubmitting(false);
        return;
      }

      // ── Success → Navigate to project detail page ──
      router.push(`/projects/${result.jobId}`);
    } catch (err) {
      console.error('[NewContent] Submit error:', err);
      setError({
        what: 'An unexpected error occurred.',
        why: 'There was a network issue or the server is temporarily unavailable.',
        nextStep: 'Check your internet connection and try again. If this keeps happening, contact support.',
      });
      setIsSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4 cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Create New Content</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Submit a raw idea or a URL to start the content automation pipeline.
        </p>
      </div>

      <Card padding={false}>
        {/* Mode Toggle */}
        <div className="flex border-b border-[var(--color-border)]">
          <button
            onClick={() => switchMode('idea')}
            className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors cursor-pointer ${
              mode === 'idea'
                ? 'text-[var(--color-text)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText size={16} /> Write an Idea
            </div>
          </button>
          <button
            onClick={() => switchMode('url')}
            className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors cursor-pointer ${
              mode === 'url'
                ? 'text-[var(--color-text)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Link2 size={16} /> Submit a URL
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ── Idea Input ── */}
          {mode === 'idea' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Content Idea
              </label>
              <textarea
                id="content-idea-input"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your content idea in detail. What topic should we cover? What angle or perspective?"
                rows={6}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all duration-200 p-4 resize-none"
              />
              <p className="text-xs text-[var(--color-text-muted)] text-right">
                {idea.length} characters (min 20)
              </p>
            </div>
          ) : (
            /* ── URL Input ── */
            <div className="space-y-4">
              <Input
                label="Source URL"
                type="url"
                placeholder="https://example.com/article or LinkedIn/Twitter post URL"
                icon={<Link2 size={16} />}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                id="source-url-input"
              />

              {/* URL Classification Banners */}
              {urlClassification.rejected && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-[var(--color-error)] text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{urlClassification.rejectReason}</p>
                </div>
              )}

              {!urlClassification.rejected && urlClassification.type === 'social' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p>Social media URL detected. We&apos;ll use specialized extraction to get the post content.</p>
                </div>
              )}

              {urlClassification.type === 'paywall' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-warning-soft)] border border-amber-200 text-amber-700 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>This site may restrict content access. If we can&apos;t extract enough content, we&apos;ll ask you to paste the text directly.</p>
                </div>
              )}

              {urlClassification.type === 'standard' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Standard URL detected. We&apos;ll extract the article content automatically.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Error display (structured 3-part) ── */}
          {error && (
            <div className="p-4 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-sm space-y-2">
              <div className="flex items-start gap-2 text-[var(--color-error)] font-semibold">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error.what}
              </div>
              <p className="text-[var(--color-error)]/80 pl-6">{error.why}</p>
              <p className="text-[var(--color-text-secondary)] pl-6 text-xs">{error.nextStep}</p>
            </div>
          )}

          {simpleError && (
            <div className="p-3 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-[var(--color-error)] text-sm font-medium flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {simpleError}
            </div>
          )}
 
          {showDuplicateWarning && (
            <div className="p-4 rounded-lg bg-[var(--color-warning-soft)] border border-amber-200 space-y-3">
              <div className="flex items-start gap-3 text-amber-900 text-sm">
                <AlertCircle size={18} className="shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold">Possible Duplicate Detected</p>
                  <p className="mt-1">A similar project was submitted in the last 7 days. Do you want to proceed anyway?</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowDuplicateWarning(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="primary" 
                  size="sm" 
                  className="bg-amber-600 hover:bg-amber-700 border-none"
                  onClick={handleSubmit}
                >
                  Yes, Proceed Anyway
                </Button>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting || urlClassification.rejected}
              id="submit-content-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Content'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
