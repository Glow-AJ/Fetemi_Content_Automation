'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { inviteTeamMemberAction } from '@/app/actions/team';

export function TeamTab() {
  const { user } = useAuth();
  
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      setInviteError('');
      await inviteTeamMemberAction(inviteEmail);
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
      }, 2000);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--color-text)]">Team Members</h3>
          <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
            <Plus size={14} className="mr-1" /> Invite Member
          </Button>
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
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                    {(user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {user?.user_metadata?.name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3"><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Admin</span></td>
              <td className="py-3 text-sm text-[var(--color-text-muted)] hidden sm:table-cell">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        footer={!inviteSuccess ? (
          <>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button variant="primary" loading={isInviting} onClick={handleInvite}>Send Invite</Button>
          </>
        ) : null}
      >
        {inviteSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3 animate-in zoom-in duration-300" />
            <p className="text-lg font-bold text-[var(--color-text)] mb-1">Invite Sent!</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              An invitation email has been sent to the new member.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Send an email invitation to a new team member to join your Fetemi workspace. They will receive a link to set up their account.
            </p>
            
            <Input 
              label="Email Address" 
              type="email" 
              required 
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            
            {inviteError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-in shake duration-300">
                {inviteError}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
