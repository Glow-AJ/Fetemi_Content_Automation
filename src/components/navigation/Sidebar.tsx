'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutGrid, BarChart3, PlusCircle, FolderOpen, Settings, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/new', label: 'New Content', icon: PlusCircle },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="w-[240px] h-screen bg-[var(--color-bg-card)] border-r border-[var(--color-border)] flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[var(--color-border)]">
        <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white">
          <LayoutGrid size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text)] leading-none">Fetemi</h2>
          <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">Content Automation</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-[var(--color-bg-subtle)] text-[var(--color-text)] font-semibold' 
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]'
                }
              `}
            >
              <item.icon size={18} className={isActive ? 'text-[var(--color-accent)]' : ''} />
              {item.label}
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[var(--color-border)]">
        <button 
          onClick={signOut} 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all duration-200 w-full cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
