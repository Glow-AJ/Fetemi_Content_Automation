'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { User, Users, Globe, Lock, Mail, Plus, Trash2, RefreshCcw, Check, AlertCircle } from 'lucide-react';

type Tab = 'profile' | 'team' | 'platforms' | 'subscribers';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'team' as Tab, label: 'Team', icon: Users },
    { id: 'platforms' as Tab, label: 'Platforms', icon: Globe },
    { id: 'subscribers' as Tab, label: 'Subscribers', icon: Mail },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your profile, team, and platform connections.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-xl space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Personal Information</h3>
            <div className="space-y-4">
              <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              <Input label="Email" value={user?.email || ''} disabled helperText="Email cannot be changed." />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button variant="primary" onClick={handleSave} loading={isSaving}>
                {saved ? <><Check size={16} /> Saved</> : 'Save Changes'}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Change Password</h3>
            <div className="space-y-4">
              <Input label="Current Password" type="password" placeholder="••••••" icon={<Lock size={16} />} />
              <Input label="New Password" type="password" placeholder="••••••" icon={<Lock size={16} />} />
              <Input label="Confirm New Password" type="password" placeholder="••••••" icon={<Lock size={16} />} />
            </div>
            <div className="mt-6">
              <Button variant="primary">Update Password</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Team Members</h3>
              <Button variant="primary" size="sm"><Plus size={14} /> Invite Member</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Role</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3 hidden sm:table-cell">Joined</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold">A</div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">{user?.email?.split('@')[0] || 'Admin'}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Admin</span></td>
                    <td className="py-3 text-sm text-[var(--color-text-muted)] hidden sm:table-cell">Mar 24, 2026</td>
                    <td className="py-3 text-right"><span className="text-xs text-[var(--color-text-muted)]">Owner</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">Pending Invites</h3>
            <p className="text-sm text-[var(--color-text-muted)]">No pending invitations.</p>
          </Card>
        </div>
      )}

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <div className="space-y-4">
          {[
            { name: 'LinkedIn', status: 'Connected', icon: Globe, statusColor: 'text-green-600', statusBg: 'bg-green-50' },
            { name: 'X (Twitter)', status: 'Connected', icon: Globe, statusColor: 'text-green-600', statusBg: 'bg-green-50' },
            { name: 'Email Newsletter', status: 'Connected', icon: Mail, statusColor: 'text-green-600', statusBg: 'bg-green-50' },
          ].map((p) => (
            <Card key={p.name} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-secondary)]">
                  <p.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{p.name}</p>
                  <span className={`text-xs font-medium ${p.statusColor}`}>{p.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><RefreshCcw size={14} /> Refresh</Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"><Trash2 size={14} /> Disconnect</Button>
              </div>
            </Card>
          ))}

          <Card className="bg-[var(--color-warning-soft)] border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">API Key Expiration Notice</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Your LinkedIn API key expires in 14 days. We recommend re-authorizing to avoid disruption.</p>
                <Button variant="outline" size="sm" className="mt-3">Re-authorize LinkedIn</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--color-text)]">Newsletter Subscribers</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Plus size={14} /> Add Manually</Button>
                <Button variant="primary" size="sm">Upload CSV</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3 hidden sm:table-cell">Subscribed Date</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Status</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-3 text-sm font-medium text-[var(--color-text)]">hello@example.com</td>
                    <td className="py-3 text-sm text-[var(--color-text-secondary)]">John Doe</td>
                    <td className="py-3 text-sm text-[var(--color-text-muted)] hidden sm:table-cell">Mar 24, 2026</td>
                    <td className="py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600">Active</span></td>
                    <td className="py-3 text-right"><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Remove</Button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
