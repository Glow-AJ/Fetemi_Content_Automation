'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Users, Globe, Mail } from 'lucide-react';

import { ProfileTab } from '@/components/settings/ProfileTab';
import { TeamTab } from '@/components/settings/TeamTab';
import { PlatformsTab } from '@/components/settings/PlatformsTab';
import { SubscribersTab } from '@/components/settings/SubscribersTab';

type Tab = 'profile' | 'team' | 'platforms' | 'subscribers';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'team' as Tab, label: 'Team', icon: Users },
    { id: 'platforms' as Tab, label: 'Platforms', icon: Globe },
    { id: 'subscribers' as Tab, label: 'Subscribers', icon: Mail },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your profile, team, and platform connections.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto scrolly">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[var(--color-text)] border-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'platforms' && <PlatformsTab />}
        {activeTab === 'subscribers' && <SubscribersTab />}
      </div>
    </div>
  );
}
