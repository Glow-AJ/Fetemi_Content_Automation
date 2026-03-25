'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Check, Lock } from 'lucide-react';

export function ProfileTab() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 1000);
  };

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Personal Information</h3>
        <div className="space-y-4">
          <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="Email" value={user?.email || ''} disabled helperText="Email cannot be changed." />
        </div>
        <div className="mt-6">
          <Button variant="primary" onClick={handleSave} loading={loading}>
            {success ? <><Check size={16} /> Saved</> : 'Save Changes'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Change Password</h3>
        <div className="space-y-4">
          <Input label="Current Password" type="password" icon={<Lock size={16} />} placeholder="••••••" />
          <Input label="New Password" type="password" icon={<Lock size={16} />} placeholder="••••••" />
          <Input label="Confirm Password" type="password" icon={<Lock size={16} />} placeholder="••••••" />
        </div>
        <div className="mt-6">
          <Button variant="primary">Update Password</Button>
        </div>
      </Card>
    </div>
  );
}
