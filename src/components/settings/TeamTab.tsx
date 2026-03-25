'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

export function TeamTab() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--color-text)]">Team Members</h3>
          <Button variant="primary" size="sm"><Plus size={14} /> Invite Member</Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Name</th>
              <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Role</th>
              <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3 hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold">A</div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Admin</span></td>
              <td className="py-3 text-sm text-[var(--color-text-muted)] hidden sm:table-cell">Mar 24, 2026</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
