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
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="w-full">
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
