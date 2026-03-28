'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function inviteTeamMemberAction(email: string) {
  const adminClient = createAdminClient();
  const supabase = await createClient(); // Still need this for inviter_id logic
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fetemi-content-automation.vercel.app';

    // 1. Send Supabase Auth Invite using Admin Client
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/set-password`
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
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // 1. Fetch profiles, invites, and auth users
    const [profilesRes, invitesRes, authRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('team_invitations')
        .select('*')
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
      adminClient.auth.admin.listUsers()
    ]);

    const authUsers = authRes.data?.users || [];

    // 2. Map profiles with auth data
    const members = (profilesRes.data || []).map(profile => {
      const authUser = authUsers.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email,
        confirmed: !!authUser?.email_confirmed_at,
        last_sign_in: authUser?.last_sign_in_at
      };
    });

    return { 
      success: true, 
      members, 
      invites: invitesRes.data || [] 
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    return { success: false, error: 'Failed to fetch team data' };
  }
}
