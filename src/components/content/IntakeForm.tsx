'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Link2, FileText, AlertCircle, Info } from 'lucide-react';

const PLATFORMS = { LINKEDIN: 'linkedin', X: 'x', EMAIL: 'email' } as const;

export function IntakeForm() {
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([PLATFORMS.LINKEDIN]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDuplicateWarning] = useState(false);
  const router = useRouter();

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const classifyUrl = (inputUrl: string) => {
    const lower = inputUrl.toLowerCase();
    if (lower.includes('linkedin.com') || lower.includes('twitter.com') || lower.includes('x.com')) return 'social';
    if (['medium.com', 'nytimes.com', 'wsj.com'].some(d => lower.includes(d))) return 'paywall';
    return 'standard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic && !url) {
      setError('Please enter a topic idea or a URL.');
      return;
    }
    if (platforms.length === 0) {
      setError('Please select at least one platform.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submission logic will be wired to n8n webhooks
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/projects');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const urlType = url ? classifyUrl(url) : null;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Content Idea
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe your content idea..."
              rows={4}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all duration-200 p-3 resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">OR</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <Input
            label="Source URL"
            type="url"
            placeholder="https://example.com/article"
            icon={<Link2 size={16} />}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {urlType === 'social' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>Social media URL detected. We&apos;ll use specialized extraction.</p>
            </div>
          )}
          {urlType === 'paywall' && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-warning-soft)] border border-amber-200 text-amber-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>This site may restrict access. If extraction fails, you&apos;ll be asked to paste text directly.</p>
            </div>
          )}
        </div>

        {/* Platforms */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Target Platforms
          </label>
          <div className="flex gap-2">
            {Object.entries(PLATFORMS).map(([key, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => togglePlatform(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                  platforms.includes(value)
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]'
                }`}
              >
                {key === 'X' ? 'X (Twitter)' : key.charAt(0) + key.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {showDuplicateWarning && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-warning-soft)] border border-amber-200 text-amber-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>A similar project was created recently. Continue anyway?</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-[var(--color-error)] text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>
            <FileText size={14} /> Submit Content
          </Button>
        </div>
      </form>
    </Card>
  );
}
