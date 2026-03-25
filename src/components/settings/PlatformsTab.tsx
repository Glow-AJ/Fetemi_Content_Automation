'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Globe, Mail, RefreshCcw, Trash2, AlertCircle } from 'lucide-react';

export function PlatformsTab() {
  const platforms = [
    { name: 'LinkedIn', status: 'Connected', icon: Globe, statusColor: 'text-green-600' },
    { name: 'X (Twitter)', status: 'Connected', icon: Globe, statusColor: 'text-green-600' },
    { name: 'Email Newsletter', status: 'Connected', icon: Mail, statusColor: 'text-green-600' },
  ];

  return (
    <div className="space-y-4">
      {platforms.map((p) => (
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
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Your LinkedIn API key expires in 14 days.</p>
            <Button variant="outline" size="sm" className="mt-3">Re-authorize</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
