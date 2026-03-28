'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, LayoutGrid, ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fetemi-content-automation.vercel.app'}/set-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white mb-6">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Reset password</h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center">Enter your email address and we&apos;ll send you a link to reset your password.</p>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 shadow-[var(--shadow-sm)]">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Mail size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Check your email</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">We&apos;ve sent a password reset link to <strong>{email}</strong>.</p>
              <Button variant="secondary" className="w-full" onClick={() => router.push('/login')}>Back to Sign In</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-[var(--color-error)] text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Send Reset Link</Button>
            </form>
          )}
        </div>

        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-6 mx-auto cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </div>
    </main>
  );
}
