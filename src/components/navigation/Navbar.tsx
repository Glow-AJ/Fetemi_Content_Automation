'use client';

import React, { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 2;

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 flex items-center justify-between sticky top-0 z-[90]">
      {/* Search */}
      <div className="relative w-full max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input 
          type="text" 
          placeholder="Search projects..." 
          className="w-full bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all duration-200"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-accent)] rounded-full" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-lg)] z-[100] overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                <span className="font-semibold text-sm text-[var(--color-text)]">Notifications</span>
                <button className="text-xs font-medium text-[var(--color-accent)] hover:underline cursor-pointer">Mark all read</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="p-4 hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors border-b border-[var(--color-border)]">
                  <p className="text-sm font-medium text-[var(--color-text)]">Draft ready for review</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Advanced SaaS Architecture Patterns 2026</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">2 minutes ago</p>
                </div>
                <div className="p-4 hover:bg-[var(--color-bg-subtle)] cursor-pointer transition-colors">
                  <p className="text-sm font-medium text-[var(--color-text)]">Published to LinkedIn</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Engine Core Optimization</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">1 hour ago</p>
                </div>
              </div>
              <div className="p-3 border-t border-[var(--color-border)] text-center">
                <button className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--color-border)]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-[var(--color-text)] leading-none">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Manager</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold">
            {user?.email?.[0].toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
