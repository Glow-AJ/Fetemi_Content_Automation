'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Fetches the latest notifications for the current user.
 */
export async function getNotificationsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[Action] Error fetching notifications:', error);
    return { success: false, error: error.message };
  }

  return { success: true, notifications: data || [] };
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsReadAction(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('[Action] Error marking notification as read:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/'); // Revalidate to update Navbar status if needed
  return { success: true };
}

/**
 * Marks all notifications as read for the current user.
 */
export async function markAllNotificationsAsReadAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    console.error('[Action] Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
