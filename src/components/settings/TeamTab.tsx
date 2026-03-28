'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle2, Clock, Mail, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { inviteTeamMemberAction, getTeamDataAction } from '@/app/actions/team';
import { createClient } from '@/utils/supabase/client';

export function TeamTab() {
  const { user } = useAuth();
  const supabase = createClient();
  
  // Data state
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const fetchTeam = async () => {
    const res = await getTeamDataAction();
    if (res.success) {
      setMembers(res.members || []);
      setInvites(res.invites || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();

    // Listen for changes
    const profilesChannel = supabase.channel('profiles-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchTeam)
      .subscribe();

    const invitesChannel = supabase.channel('invites-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_invitations' }, fetchTeam)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(invitesChannel);
    };
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      setInviteError('');
      const res = await inviteTeamMemberAction(inviteEmail);
      if (res.success) {
        setInviteSuccess(true);
        setInviteEmail('');
        setTimeout(() => {
          setInviteSuccess(false);
          setShowInviteModal(false);
          fetchTeam();
        }, 2000);
      } else {
        setInviteError(res.error || 'Failed to send invite.');
      }
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative animate-in fade-in duration-500">
      <Card className="border-none shadow-sm bg-white overflow-hidden p-0">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">Team Members</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active users with access to this workspace</p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            className="font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100"
            onClick={() => setShowInviteModal(true)}
          >
            <Plus size={14} className="mr-2" strokeWidth={3} /> Invite Member
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/30">
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Member</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map((member) => (
                <tr key={member.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-zinc-200">
                        {member.full_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900 leading-none mb-1.5">{member.full_name || 'Anonymous User'}</p>
                        <p className="text-xs text-zinc-400 font-bold">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 shadow-sm shadow-blue-50">
                      <Shield size={10} strokeWidth={3} /> Manager
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs text-zinc-400 font-bold hidden sm:table-cell">
                    {member.created_at ? new Date(member.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {invites.length > 0 && (
        <Card className="border-none shadow-sm bg-zinc-50/30 p-0 overflow-hidden">
          <div className="p-8 border-b border-zinc-100">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none mb-1 flex items-center gap-2">
              <Clock size={14} className="text-orange-500" /> Pending Invitations
            </h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {invites.map((invite) => (
              <div key={invite.id} className="p-8 flex items-center justify-between group bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center border border-zinc-200">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-zinc-900 mb-1">{invite.email}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
      >
        {inviteSuccess ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-100 shadow-lg shadow-green-50">
              <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in duration-500" strokeWidth={3} />
            </div>
            <p className="text-xl font-black text-zinc-900 uppercase tracking-widest mb-2">Invite Sent!</p>
            <p className="text-xs text-zinc-400 font-bold leading-relaxed px-8">
              An invitation email has been sent to the new member.
            </p>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-8">
            <div className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50">
                <p className="text-xs text-orange-900/70 font-bold leading-relaxed">
                  Send an email invitation to a new team member. They will receive a secure link to join your Fetemi content engine.
                </p>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Team Member Email</label>
              <Input 
                type="email" 
                required 
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-12 rounded-2xl border-zinc-200 focus:border-orange-500/50"
              />
            </div>
            
            {inviteError && (
              <p className="text-xs font-black text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 animate-in shake duration-300">
                {inviteError}
              </p>
            )}

            <div className="flex gap-4 pt-4">
               <Button variant="ghost" className="flex-1 h-12 font-black uppercase tracking-widest text-xs" onClick={() => setShowInviteModal(false)}>Cancel</Button>
               <Button variant="primary" loading={isInviting} className="flex-1 h-12 font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-100" type="submit">Send Invite</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
