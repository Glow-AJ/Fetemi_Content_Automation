'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useLayout } from '@/context/LayoutContext';

export function SidebarWrapper() {
  const { isSidebarCollapsed } = useLayout();
  
  return (
    <div 
      className={`hidden md:block transition-all duration-300 ease-in-out border-r border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      <Sidebar />
    </div>
  );
}
