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
  const inputHash = crypto.createHash('md5').update(formData.originalInput || formData.sourceUrl || '').digest('hex');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
      const { type: urlType } = formData.inputType === 'url' ? validateUrl(formData.sourceUrl || '') : { type: null };
      
      await fetch(webhookUrl, {
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
    } catch (err) {
      console.error('[Action] Webhook fire failed:', err);
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

  // 2. Update job status
  await supabase.from('content_jobs').update({ status: 'adapting' }).eq('id', jobId);

  // 3. Trigger Adaptation Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_SELECT_DRAFT;
  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, selected_draft_id: draftId }),
      });
    } catch (err) {
      console.error('[Action] Adaptation webhook failed:', err);
    }
  }

  revalidatePath(`/projects/${jobId}`);
  return { success: true };
}

/**
 * Regeneration - Guided revision loop (max 3)
 */
export async function regenerateDraftsAction(jobId: string, instructions: string) {
  const supabase = await createClient();
  
  // 1. Get current job to check revision count
  const { data: job } = await supabase.from('content_jobs').select('revision_count').eq('id', jobId).single();
  const currentCount = job?.revision_count || 0;

  if (currentCount >= 3) {
    return { success: false, error: 'Maximum revision limit (3) reached.' };
  }

  // 2. Mark existing drafts as rejected
  await supabase.from('article_drafts').update({ status: 'rejected' }).eq('job_id', jobId).eq('status', 'generated');

  // 3. Update job count and status
  await supabase.from('content_jobs').update({ 
    status: 'drafting', 
    revision_count: currentCount + 1 
  }).eq('id', jobId);

  // 4. Trigger n8n (use same intake/generation webhook but with instructions)
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_INTAKE; // Or a dedicated revision webhook if preferred
  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job_id: jobId, 
          revision_instructions: instructions,
          is_regeneration: true 
        }),
      });
    } catch (err) {
      console.error('[Action] Regeneration webhook failed:', err);
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
 * Publishing - LinkedIn or Email only
 */
export async function publishNowAction(jobId: string, platform: 'linkedin' | 'email', postId: string) {
  const supabase = await createClient();
  
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_PUBLISH;
  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, platform, post_id: postId }),
      });
      
      // Update local status to prevent clicking twice
      await supabase.from('platform_posts').update({ status: 'ready_to_publish' }).eq('id', postId);
      
      return { success: true };
    } catch (err) {
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
  const inputHash = crypto.createHash('md5').update(input).digest('hex');
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
