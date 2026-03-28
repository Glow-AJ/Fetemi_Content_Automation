'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteTeamMemberAction(email: string) {
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Send Supabase Auth Invite
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    });

    if (inviteError) throw inviteError;

    // 2. Record in team_invitations table for UI tracking
    const { error: dbError } = await supabase
      .from('team_invitations')
      .insert({
        email,
        inviter_id: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
      });

    if (dbError) console.error('[Action] Database invite sync failed:', dbError);
    
    revalidatePath('/settings');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error inviting team member:', error);
    const message = error instanceof Error ? error.message : 'Failed to invite team member';
    return { success: false, error: message };
  }
}

export async function getTeamDataAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const [profilesRes, invitesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('team_invitations')
        .select('*')
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
    ]);

    return { 
      success: true, 
      members: profilesRes.data || [], 
      invites: invitesRes.data || [] 
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    return { success: false, error: 'Failed to fetch team data' };
  }
}
