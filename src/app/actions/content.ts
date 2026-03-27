'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { validateUrl } from '@/lib/intake';
import { PLATFORMS } from '@/lib/constants';

/**
 * Intake - Creates a job and fires n8n webhook
 */
export async function createJobAction(formData: {
  inputType: 'idea' | 'url';
  originalInput: string;
  sourceUrl?: string;
  userEmail: string;
  bypassDedupe?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Calculate Hash & Check for duplicates (last 7 days)
  const inputHash = crypto.createHash('sha256').update(formData.originalInput || formData.sourceUrl || '').digest('hex');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { type: urlType } = formData.inputType === 'url' ? validateUrl(formData.sourceUrl || '') : { type: null };

  const { data: existingJob } = await supabase
    .from('content_jobs')
    .select('id, created_at')
    .eq('input_hash', inputHash)
    .gte('created_at', sevenDaysAgo.toISOString())
    .maybeSingle();

  // 2. Insert into Supabase
  const { data: job, error: insertError } = await supabase
    .from('content_jobs')
    .insert({
      user_id: user.id,
      input_type: formData.inputType,
      url_type: urlType,
      original_input: formData.originalInput,
      source_url: formData.sourceUrl || null,
      status: 'submitted',
      is_retry: false,
      input_hash: inputHash,
      duplicate_warning: !!existingJob
    })
    .select('id')
    .single();

  if (insertError || !job) {
    console.error('[Action] Job creation failed:', insertError);
    return { success: false, error: insertError?.message };
  }

  // 3. Fire n8n Intake Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_INTAKE;
  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          input_type: formData.inputType,
          url_type: urlType,
          input_text: formData.inputType === 'idea' ? formData.originalInput : null,
          input_url: formData.inputType === 'url' ? formData.sourceUrl : null,
          user_id: user.id,
          use_email: formData.userEmail,
          is_retry: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n intake failed: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('[Action] Webhook fire failed:', err);
      return { success: false, error: 'Content production could not be started. (Webhook failed)' };
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  return { success: true, jobId: job.id };
}

/**
 * Draft Selection - Marks a draft as selected and triggers adaptation
 */
export async function selectDraftAction(jobId: string, draftId: string) {
  const supabase = await createClient();
  
  // 1. Update draft statuses
  await supabase.from('article_drafts').update({ selected: false }).eq('job_id', jobId);
  const { error: selectError } = await supabase
    .from('article_drafts')
    .update({ selected: true, status: 'selected' })
    .eq('id', draftId);

  if (selectError) return { success: false, error: selectError.message };

  // 2. Job status update removed (Controlled by n8n workflow)

  // 3. Trigger Adaptation Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_SELECT_DRAFT;
  const { data: { user } } = await supabase.auth.getUser();

  console.log('[Action] SelectDraft triggered:', { jobId, draftId, userLink: !!user, urlSet: !!webhookUrl });

  if (!user) {
    console.error('[Action] Unauthorized: No user session found');
    return { success: false, error: 'Unauthorized: No user session found. Please log in again.' };
  }

  if (!webhookUrl || webhookUrl === 'placeholder') {
    console.error('[Action] Webhook skipped: URL is missing or placeholder');
    return { success: false, error: 'Configuration Error: SELECT_DRAFT webhook URL is not set in environment variables.' };
  }

  try {
    console.log('[Action] Firing webhook:', webhookUrl);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        job_id: jobId, 
        draft_id: draftId,
        user_id: user.id,
        user_email: user.email
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Action] Webhook response NOT OK:', response.status, errorText);
      throw new Error(`n8n webhook failed: ${response.status} ${errorText}`);
    }

    console.log('[Action] Webhook fire SUCCESS');
  } catch (err) {
    console.error('[Action] Adaptation webhook failed:', err);
    return { success: false, error: 'Could not trigger platform adaptation. Please check your connection and environment variables.' };
  }

  revalidatePath(`/projects/${jobId}`);
  return { success: true };
}

export async function regenerateDraftsAction(jobId: string, draftId: string, instructions: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  
  // 1. Get current job to check revision count
  const { data: job } = await supabase.from('content_jobs').select('revision_count').eq('id', jobId).single();
  const currentCount = job?.revision_count || 0;

  if (currentCount >= 3) {
    return { success: false, error: 'Maximum revision limit (3) reached.' };
  }

  // 2. Mark the specific draft as rejected and save feedback
  await supabase.from('article_drafts')
    .update({ 
      status: 'rejected', 
      manager_feedback: instructions 
    })
    .eq('id', draftId);

  // 3. Update job count and status
  await supabase.from('content_jobs').update({ 
    status: 'drafting', 
    revision_count: currentCount + 1 
  }).eq('id', jobId);

  // 4. Insert a placeholder draft for the next round
  const { data: newDraft } = await supabase.from('article_drafts').insert({
    job_id: jobId,
    user_id: user.id,
    status: 'regenerating',
    revision_round: currentCount + 1
  }).select('id').single();

  // 5. Trigger n8n
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_INTAKE;
  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job_id: jobId, 
          draft_id: newDraft?.id, // Pass the ID of the placeholder for n8n to update
          revision_instructions: instructions,
          is_regeneration: true,
          revision_round: currentCount + 1,
          user_id: user.id,
          user_email: user.email
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n regeneration failed: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('[Action] Regeneration webhook failed:', err);
      // Clean up the placeholder if it failed
      if (newDraft?.id) await supabase.from('article_drafts').delete().eq('id', newDraft.id);
      await supabase.from('content_jobs').update({ 
        status: 'drafting', 
        revision_count: currentCount // Revert count
      }).eq('id', jobId);
      return { success: false, error: 'Could not trigger AI regeneration. Please try again.' };
    }
  }

  revalidatePath(`/projects/${jobId}`);
  return { success: true };
}

/**
 * Manual Update - Save edits to a draft
 */
export async function updateDraftContentAction(draftId: string, content: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('article_drafts')
    .update({ content })
    .eq('id', draftId);

  return { success: !error, error: error?.message };
}

/**
 * Manual Update - Save edits to a platform post
 */
export async function updatePostContentAction(postId: string, content: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_posts')
    .update({ content })
    .eq('id', postId);

  return { success: !error, error: error?.message };
}

/**
 * Publishing - LinkedIn or Email only
 */
export async function publishNowAction(jobId: string, platform: 'linkedin' | 'email', postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'User not authenticated' };

  const webhookUrl = platform === 'linkedin' 
    ? process.env.NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH_LINKEDIN 
    : process.env.NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH_EMAIL;

  if (webhookUrl && webhookUrl !== 'placeholder' && webhookUrl !== '') {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          post_id: postId,
          job_id: jobId, 
          user_id: user.id,
          user_email: user.email
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n webhook failed: ${response.status} ${errorText}`);
      }
      
      // Update local status to prevent clicking twice
      await supabase.from('platform_posts').update({ status: 'published' }).eq('id', postId);
      
      return { success: true };
    } catch (err) {
      console.error('[Action] Publish webhook failed:', err);
      return { success: false, error: 'Failed to trigger publishing automation.' };
    }
  }
  
  return { success: false, error: 'Publishing webhook not configured.' };
}

/**
 * Scheduling
 */
export async function schedulePostAction(postId: string, scheduledTime: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_posts')
    .update({ 
      publish_at: scheduledTime,
      status: 'scheduled'
    })
    .eq('id', postId);

  return { success: !error, error: error?.message };
}

export async function cancelScheduleAction(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_posts')
    .update({ 
      publish_at: null,
      status: 'pending'
    })
    .eq('id', postId);

  return { success: !error, error: error?.message };
}

/**
 * Manual Publication - Mark a post as already published
 */
export async function markAsPostedAction(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_posts')
    .update({ 
      status: 'published',
      published_at: new Date().toISOString()
    })
    .eq('id', postId);

  return { success: !error, error: error?.message };
}

/**
 * Deletion - Securely delete job and cascading rows
 */
export async function deleteJobAction(jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('content_jobs').delete().eq('id', jobId);
  
  if (!error) {
    revalidatePath('/dashboard');
    revalidatePath('/projects');
  }
  
  return { success: !error, error: error?.message };
}

/**
 * Retry Intake - Re-trigger webhook for stuck jobs
 */
export async function retryIntakeAction(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { success: false, error: 'Unauthorized' };

  // 1. Get job data
  const { data: job, error: fetchError } = await supabase
    .from('content_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (fetchError || !job) return { success: false, error: 'Job not found' };

  // 2. Fire n8n Intake Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_INTAKE;
  if (webhookUrl && webhookUrl !== 'placeholder') {
    const { type: urlType } = job.input_type === 'url' ? validateUrl(job.source_url || '') : { type: null };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          input_type: job.input_type,
          url_type: urlType,
          input_text: job.input_type === 'idea' ? job.original_input : null,
          input_url: job.input_type === 'url' ? job.source_url : null,
          user_id: job.user_id,
          use_email: user.email, // Include the current user's email
          is_retry: true
        }),
      });
      
      // Reset status to submitted to show progress and mark as retry
      await supabase.from('content_jobs').update({ 
        status: 'submitted', 
        error_message: null,
        is_retry: true 
      }).eq('id', jobId);
      
      revalidatePath(`/projects/${jobId}`);
      return { success: true };
    } catch (err) {
      console.error('[Action] Retry webhook failed:', err);
      return { success: false, error: 'Failed to trigger automation retry.' };
    }
  }
  
  return { success: false, error: 'Intake webhook not configured.' };
}

/**
 * Check for duplicates - Returns true if a similar job exists in the last 7 days
 */
export async function checkDuplicateAction(input: string) {
  const supabase = await createClient();
  const inputHash = crypto.createHash('sha256').update(input).digest('hex');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data } = await supabase
    .from('content_jobs')
    .select('id')
    .eq('input_hash', inputHash)
    .gte('created_at', sevenDaysAgo.toISOString())
    .maybeSingle();

  return { isDuplicate: !!data };
}
