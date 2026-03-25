'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, LayoutGrid, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 2000);
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
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Set your password</h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center">Create a strong password for your account.</p>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 shadow-[var(--shadow-sm)]">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Check size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Password updated</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="New Password"
                type="password"
                placeholder="Min 8 characters"
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                icon={<Lock size={16} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && (
                <div className="p-3 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-[var(--color-error)] text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Set Password</Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
