'use client';

import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'glass';
  hover?: boolean;
  padding?: boolean;
  onClick?: () => void;
};

export function Card({ children, className = '', variant = 'default', hover = false, padding = true, onClick }: CardProps) {
  const base = 'rounded-xl transition-all duration-200';

  const variants: Record<string, string> = {
    default: 'bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
    outline: 'border border-[var(--color-border)] bg-transparent',
    glass: 'bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
  };

  const hoverEffect = hover ? 'hover:shadow-[var(--shadow-md)] hover:border-[var(--color-text-muted)]/30 cursor-pointer' : '';

  return (
    <div className={`${base} ${variants[variant]} ${hoverEffect} ${padding ? 'p-6' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
