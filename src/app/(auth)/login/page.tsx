'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, LayoutGrid } from 'lucide-react';

export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      setIsProcessing((prev) => {
        if (prev) {
          setError('Connection timed out. Please check your internet and try again.');
          return false;
        }
        return prev;
      });
    }, 15000);

    try {
      const { error: signInError } = await signIn(email, password);
      clearTimeout(timeoutId);

      if (signInError) {
        const msg = signInError.message?.toLowerCase() || '';
        if (msg.includes('invalid login') || msg.includes('invalid_credentials')) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (msg.includes('network')) {
          setError('Unable to connect. Please check your internet connection.');
        } else {
          setError(signInError.message || 'Something went wrong. Please try again.');
        }
        setIsProcessing(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      clearTimeout(timeoutId);
      setError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white mb-6">
            <LayoutGrid size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Enter your credentials to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 shadow-[var(--shadow-sm)]">
          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@company.com" 
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isProcessing}
              required
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => router.push('/forgot-password')}
                  className="text-xs font-medium text-[var(--color-accent)] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isProcessing}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all duration-200 pl-10 pr-4"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--color-error-soft)] border border-red-200 text-[var(--color-error)] text-sm font-medium">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              variant="primary"
              loading={isProcessing}
            >
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          Invite-only platform. Contact your administrator for access.
        </p>
      </div>
    </main>
  );
}
