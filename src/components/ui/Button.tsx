'use client';

import { Loader2 } from 'lucide-react';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants: Record<string, string> = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus:ring-[var(--color-primary)]',
    secondary: 'bg-[var(--color-bg-subtle)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-muted)] focus:ring-[var(--color-border)]',
    outline: 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] focus:ring-[var(--color-border)]',
    ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] focus:ring-[var(--color-border)]',
    danger: 'bg-[var(--color-error)] text-white hover:bg-red-700 focus:ring-[var(--color-error)]',
  };

  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-sm gap-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin h-4 w-4" />}
      {children}
    </button>
  );
}
