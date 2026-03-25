'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Intake - Creates a job and fires n8n webhook
 */
export async function createJobAction(formData: {
  inputType: 'idea' | 'url';
  originalInput: string;
  sourceUrl?: string;
  userEmail: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Insert into Supabase
  const { data: job, error: insertError } = await supabase
    .from('content_jobs')
    .insert({
      user_id: user.id,
      input_type: formData.inputType,
      original_input: formData.originalInput,
      source_url: formData.sourceUrl || null,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (insertError || !job) {
    console.error('[Action] Job creation failed:', insertError);
    return { success: false, error: insertError?.message };
  }

  // 2. Fire n8n Intake Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_INTAKE;
  if (webhookUrl && webhookUrl !== 'placeholder') {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          input_text: formData.inputType === 'idea' ? formData.originalInput : null,
          input_url: formData.inputType === 'url' ? formData.sourceUrl : null,
          user_id: user.id,
          use_email: formData.userEmail,
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
