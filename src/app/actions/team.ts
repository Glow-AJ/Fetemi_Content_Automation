'use server';

import { createClient } from '@supabase/supabase-js';

// Use admin client with service role key to bypass RLS and invite users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function inviteTeamMemberAction(email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    throw new Error(error.message || 'Failed to invite team member');
  }
}
