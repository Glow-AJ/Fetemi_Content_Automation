'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Menu, X, LayoutGrid, BarChart3, PlusCircle, 
  FolderOpen, Settings, LogOut, PanelLeftClose, PanelLeft,
  CheckCheck, Inbox, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLayout } from '@/context/LayoutContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  getNotificationsAction, 
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction 
} from '@/app/actions/notifications';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/new', label: 'New Content', icon: PlusCircle },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isSidebarCollapsed, toggleSidebar } = useLayout();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();
  
  // Real notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await getNotificationsAction();
    if (res.success) {
      setNotifications(res.notifications || []);
      const unread = res.notifications?.filter((n: any) => !n.is_read).length || 0;
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction();
    fetchNotifications();
  };

  // Close mobile menu when navigating
  useEffect(() => {
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

        {/* Sidebar Toggle (Desktop) */}
        <button 
          className="hidden md:flex p-2 -ml-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] rounded-lg transition-colors cursor-pointer" 
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>



        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
                showNotifications 
                  ? 'bg-[var(--color-bg-subtle)] text-[var(--color-text)]' 
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
              }`}
            >
              <Bell className={`w-5 h-5 ${unreadCount > 0 && !showNotifications ? 'animate-pulse' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-accent)] rounded-full border-2 border-[var(--color-bg-card)] shadow-[0_0_8px_var(--color-accent)]" />
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-xl)] z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-zinc-50/50">
                  <span className="font-black text-xs uppercase tracking-widest text-[var(--color-text)]">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck size={12} strokeWidth={3} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto scrolly">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-4 transition-colors cursor-pointer border-b border-[var(--color-border)] last:border-0 relative ${
                          !notif.is_read ? 'bg-orange-50/30' : 'hover:bg-[var(--color-bg-subtle)]'
                        }`}
                      >
                        {!notif.is_read && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-3 bg-[var(--color-accent)] rounded-full" />
                        )}
                        <p className={`text-sm leading-tight ${!notif.is_read ? 'font-bold text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 px-6 text-center">
                      <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-zinc-100">
                        <Inbox size={20} className="text-zinc-300" />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No notifications yet</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-[var(--color-border)] text-center bg-zinc-50/30">
                    <button className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer flex items-center justify-center gap-2 w-full">
                      View all <ArrowRight size={12} strokeWidth={3} />
                    </button>
                  </div>
                )}
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
