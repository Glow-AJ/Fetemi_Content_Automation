// ==========================================
// Supabase Realtime Hook for Job Status Updates
// Subscribes to changes on a specific job row
// ==========================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Job } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseJobRealtimeReturn {
  job: Job | null;
  loading: boolean;
  error: string | null;
  /** Force-refresh the job from the database */
  refresh: () => Promise<void>;
}

/**
 * Hook that fetches a job by ID and subscribes to Realtime updates.
 * Automatically cleans up the subscription on unmount.
 *
 * Usage:
 *   const { job, loading, error } = useJobRealtime('some-uuid');
 */
export function useJobRealtime(jobId: string | null): UseJobRealtimeReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        console.error('[useJobRealtime] Fetch error:', fetchError.message);
        setError('Could not load project details. Please refresh the page.');
        setJob(null);
      } else {
        setJob(data as Job);
        setError(null);
      }
    } catch (err) {
      console.error('[useJobRealtime] Unexpected error:', err);
      setError('An unexpected error occurred while loading the project.');
    } finally {
      setLoading(false);
    }
  }, [jobId, supabase]);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchJob();

    // Subscribe to Realtime updates for this specific job
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          console.log('[useJobRealtime] Realtime update received:', payload.new?.status);
          setJob(payload.new as Job);
          setError(null);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[useJobRealtime] Subscribed to job ${jobId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useJobRealtime] Realtime channel error');
          setError('Live updates connection failed. Status may be delayed.');
        }
      });

    // Cleanup on unmount or jobId change
    return () => {
      if (channel) {
        console.log(`[useJobRealtime] Unsubscribing from job ${jobId}`);
        supabase.removeChannel(channel);
      }
    };
  }, [jobId, fetchJob, supabase]);

  return { job, loading, error, refresh: fetchJob };
}
