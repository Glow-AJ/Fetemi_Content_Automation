'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Check, Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function ProfileTab() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // Profile Form
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSaveProfile = async () => {
    try {
      setLoadingProfile(true);
      setProfileError('');
      
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });

      if (error) throw error;
      
      setProfileSuccess(true);
      router.refresh();
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setLoadingPassword(true);
      setPasswordError('');

      if (!currentPassword) {
        throw new Error('Current password is required');
      }
      if (!newPassword) {
        throw new Error('New password is required');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Personal Information</h3>
        {profileError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {profileError}
          </div>
        )}
        <div className="space-y-4">
          <Input 
            label="Display Name" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
          />
          <Input 
            label="Email" 
            value={user?.email || ''} 
            disabled 
            helperText="Email cannot be changed." 
          />
        </div>
        <div className="mt-6">
          <Button variant="primary" onClick={handleSaveProfile} disabled={loadingProfile}>
            {profileSuccess ? <><Check size={16} className="mr-2" /> Saved</> : loadingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Change Password</h3>
        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {passwordError}
          </div>
        )}
        <div className="space-y-4">
          <Input 
            label="Current Password" 
            type="password" 
            icon={<Lock size={16} />} 
            placeholder="••••••" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input 
            label="New Password" 
            type="password" 
            icon={<Lock size={16} />} 
            placeholder="••••••" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={!currentPassword}
          />
          <Input 
            label="Confirm Password" 
            type="password" 
            icon={<Lock size={16} />} 
            placeholder="••••••" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!newPassword}
          />
        </div>
        <div className="mt-6">
          <Button 
            variant="primary" 
            onClick={handleUpdatePassword} 
            disabled={loadingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {passwordSuccess ? <><Check size={16} className="mr-2" /> Updated</> : loadingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
