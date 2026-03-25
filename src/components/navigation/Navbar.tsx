'use client';

import React, { useState } from 'react';
import { Bell, Menu, X, LayoutGrid, BarChart3, PlusCircle, FolderOpen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/new', label: 'New Content', icon: PlusCircle },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const unreadCount = 2;

  // Close mobile menu when navigating
  React.useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  return (
    <>
      <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 md:px-6 flex items-center justify-between sticky top-0 z-[90]">
        
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 -ml-2 text-[var(--color-text-secondary)]" 
          onClick={() => setShowMobileMenu(true)}
        >
          <Menu className="w-6 h-6" />
        </button>



        <div className="flex items-center gap-2 md:gap-4 ml-auto">
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
          <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-[var(--color-border)]">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-[var(--color-text)] leading-none">{user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Manager</p>
            </div>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold">
              {(user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] bg-[var(--color-bg)] flex flex-col md:hidden animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white">
                <LayoutGrid size={16} />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Fetemi</h2>
            </div>
            <button className="p-2 text-[var(--color-text-secondary)]" onClick={() => setShowMobileMenu(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive 
                      ? 'bg-[var(--color-bg-subtle)] text-[var(--color-text)] font-semibold' 
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-[var(--color-accent)]' : ''} />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t border-[var(--color-border)]">
            <button 
              onClick={signOut} 
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
