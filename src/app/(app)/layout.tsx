import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { LayoutProvider } from '@/context/LayoutContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider>
      <div className="flex h-screen bg-[var(--color-bg)] overflow-hidden">
        <SidebarWrapper />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
            <div className="max-w-[1440px] mx-auto w-full px-4 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}

// Low-level wrapper to avoid making the whole layout a client component if possible
// Though for the sidebar width transition we need context
import { SidebarWrapper } from './SidebarWrapper';
