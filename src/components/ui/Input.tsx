'use client';

import React from 'react';

type InputProps = {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  helperText?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, icon, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]
            text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10
            transition-all duration-200 disabled:opacity-50 disabled:bg-[var(--color-bg-subtle)]
            ${icon ? 'pl-10 pr-4' : 'px-4'}
            ${error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[var(--color-error)] font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>}
    </div>
  );
}
