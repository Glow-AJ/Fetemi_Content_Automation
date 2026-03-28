'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, Check, Clock, Edit3, Eye, FileText, Globe, 
  Loader2, MessageSquare, RefreshCw, Send, Trash2, Zap,
  AlertCircle, Image as ImageIcon, Calendar, Mail, Linkedin, Twitter,
  ChevronDown, ChevronUp, Search, Target, PenTool, Info, ExternalLink, Hash
} from 'lucide-react';
import { PublishConfirmModal } from '@/components/content/PublishConfirmModal';
import { SelectConfirmationModal } from '@/components/content/SelectConfirmationModal';
import { ScheduleModal } from '@/components/content/ScheduleModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  selectDraftAction, 
  regenerateDraftsAction, 
  updateDraftContentAction,
  updatePostContentAction,
  publishNowAction,
  deleteJobAction,
  retryIntakeAction,
  schedulePostAction,
  cancelScheduleAction,
  markAsPostedAction,
  getNewsletterRecipientsAction,
  markJobAsPublishedAction
} from '@/app/actions/content';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/ui/Editor';
import type { Job, Draft, PlatformPost, SEOBrief } from '@/types/database';


const phases = [
  { key: 'submitted', label: 'Intake' },
  { key: 'researching', label: 'SEO' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'awaiting_review', label: 'Review' },
  { key: 'adapting', label: 'Adaptation' },
  { key: 'ready_to_publish', label: 'Ready' },
  { key: 'published', label: 'Published' },
];



export default function ProjectDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [activeDrafts, setActiveDrafts] = useState<Draft[]>([]);
  const [revisionHistory, setRevisionHistory] = useState<Draft[]>([]);
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [seoBrief, setSeoBrief] = useState<SEOBrief | null>(null);
  
  // UI States
  const [isUpdating, setIsUpdating] = useState(false);
  // Confirmation Modal States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmMarkAsPosted, setConfirmMarkAsPosted] = useState<{ id: string } | null>(null);
  const [confirmCancelSchedule, setConfirmCancelSchedule] = useState<{ id: string } | null>(null);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [isConfirmingSelect, setIsConfirmingSelect] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<{ error_description?: string; execution_url?: string } | null>(null);
  const [isSelectingFromList, setIsSelectingFromList] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingInfo, setPublishingInfo] = useState<{ platform: 'linkedin' | 'email', postId: string } | null>(null);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [viewingRecipientsPostId, setViewingRecipientsPostId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [showSEOModal, setShowSEOModal] = useState(false);

  const [viewState, setViewState] = useState<'overview' | 'editor'>('overview');

  // Multi-editor states
  const [contents, setContents] = useState<Record<string, string>>({
    article: '',
    linkedin: '',
    twitter: '',
    newsletter: ''
  });
  const [viewModes, setViewModes] = useState<Record<string, 'view' | 'edit'>>({
    article: 'view',
    linkedin: 'view',
    twitter: 'view',
    newsletter: 'view'
  });
  const [inFlightPublishing, setInFlightPublishing] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    article: true,
    linkedin: true,
    twitter: true,
    newsletter: true
  });

  // Scheduling state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [schedulingPlatform, setSchedulingPlatform] = useState('');
  const [actionStatus, setActionStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Clear action status after 5s
  useEffect(() => {
    if (actionStatus) {
      const timer = setTimeout(() => setActionStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionStatus]);

  useEffect(() => {
    if (!user || !id) return;

    async function fetchData() {
      const [jobRes, draftsRes, postsRes, errorRes, seoRes] = await Promise.all([
        supabase.from('content_jobs').select('*').eq('id', id).single(),
        supabase.from('article_drafts').select('*').eq('job_id', id).order('created_at', { ascending: false }),
        supabase.from('platform_posts').select('*').eq('job_id', id),
        supabase.from('job_errors').select('*').eq('job_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('seo_briefs').select('*').eq('job_id', id).maybeSingle()
      ]);

      if (jobRes.data) setJob(jobRes.data);
      if (draftsRes.data) {
        setActiveDrafts(draftsRes.data.filter(d => d.status === 'generated' || d.status === 'regenerating' || d.selected));
        setRevisionHistory(draftsRes.data.filter(d => d.status === 'rejected'));
        const currentlySelected = draftsRes.data.find(d => d.selected);
        if (currentlySelected) {
          setSelectedDraft(currentlySelected);
          setContents(prev => ({ ...prev, article: currentlySelected.content || '' }));
        }
      }
      if (postsRes.data) {
        setPosts(postsRes.data);
        const newContents = { ...contents };
        postsRes.data.forEach(p => {
          if (p.platform === 'linkedin') newContents.linkedin = p.content || '';
          if (p.platform === 'twitter') newContents.twitter = p.content || '';
          if (p.platform === 'email') newContents.newsletter = p.content || '';
        });
        setContents(prev => ({ ...prev, ...newContents }));
      }
      if (errorRes.data) setJobError(errorRes.data);
      if (seoRes.data) setSeoBrief(seoRes.data);
      setLoading(false);
    }

    fetchData();

    // Subscribe to job and children updates
    const channel = supabase.channel(`project-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_jobs', filter: `id=eq.${id}` }, (payload) => {
        setJob(payload.new as Job);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'article_drafts', filter: `job_id=eq.${id}` }, () => {
        supabase.from('article_drafts').select('*').eq('job_id', id).order('created_at', { ascending: false }).then(res => {
          if (res.data) {
            setActiveDrafts(res.data.filter(d => d.status === 'generated' || d.status === 'regenerating' || d.selected));
            setRevisionHistory(res.data.filter(d => d.status === 'rejected'));
            const currentlySelected = res.data.find(d => d.selected);
            if (currentlySelected) {
              setSelectedDraft(currentlySelected);
              setContents(prev => ({ ...prev, article: currentlySelected.content || '' }));
            } else {
              setSelectedDraft(null);
              setContents(prev => ({ ...prev, article: '' }));
            }
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_posts', filter: `job_id=eq.${id}` }, () => {
        supabase.from('platform_posts').select('*').eq('job_id', id).then(res => {
          if (res.data) {
            setPosts(res.data);
            
            // Clear in-flight status if post reached target state
            setInFlightPublishing(prev => 
              prev.filter(id => {
                const post = res.data.find(p => p.id === id);
                return post?.status !== 'published';
              })
            );

            const newContents: Record<string, string> = { linkedin: '', twitter: '', newsletter: '' };
            res.data.forEach(p => {
              if (p.platform === 'linkedin') newContents.linkedin = p.content || '';
              if (p.platform === 'twitter') newContents.twitter = p.content || '';
              if (p.platform === 'email') newContents.newsletter = p.content || '';
            });
            setContents(prev => ({ ...prev, ...newContents }));
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user, supabase]);
  
  // Auto-sync job status to 'published' when all relevant platform posts are live
  useEffect(() => {
    if (!job || job.status !== 'ready_to_publish') return;
    
    // Core platforms: LinkedIn and Email
    const relevantPosts = posts.filter(p => (p.platform === 'linkedin' || p.platform === 'email') && p.status !== 'failed');
    if (relevantPosts.length > 0 && relevantPosts.every(p => p.status === 'published')) {
      const syncStatus = async () => {
        setIsUpdating(true);
        try {
          // Trigger the job status update
          await markJobAsPublishedAction(job.id);
          // Optimistic local update for zero-latency UI feedback
          setJob(prev => prev ? { ...prev, status: 'published' } : null);
        } catch (err) {
          console.error('[Pipeline Status] Failed to sync job status to published:', err);
        } finally {
          setIsUpdating(false);
        }
      };
      syncStatus();
    }
  }, [posts, job]);


  const handleSelectClick = (draft: Draft, fromList: boolean = false) => {
    setSelectedDraft(draft);
    setContents(prev => ({ ...prev, article: draft.content || '' }));
    setIsSelectingFromList(fromList);
    setIsConfirmingSelect(true);
  };

  const handleConfirmSelect = async () => {
    if (!selectedDraft || !job) return;
    setIsConfirmingSelect(false);
    setIsUpdating(true);
    const res = await selectDraftAction(job.id, selectedDraft.id);
    setIsUpdating(false);
    if (!res.success) setActionStatus({ message: res.error || 'Failed to select draft', type: 'error' });
    else setActionStatus({ message: 'Draft selected successfully!', type: 'success' });
  };

  const handleFetchRecipients = async (postId: string) => {
    try {
      setLoadingRecipients(true);
      setViewingRecipientsPostId(postId);
      setShowRecipientsModal(true);
      const res = await getNewsletterRecipientsAction(postId);
      if (res.success) setRecipients(res.recipients || []);
      else setActionStatus({ message: res.error || 'Failed to fetch recipients', type: 'error' });
    } catch (err) {
      console.error('Recipients fetch error:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleEdit = (draft: Draft, scrollTarget?: string) => {
    setSelectedDraft(draft);
    setContents(prev => ({ ...prev, article: draft.content || '' }));
    setViewModes(prev => ({ ...prev, article: 'view' }));
    setViewState('editor');
    
    if (scrollTarget) {
      setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveContent = async (section: string, id: string) => {
    setIsUpdating(true);
    const content = contents[section];
    
    let res;
    if (section === 'article') {
      res = await updateDraftContentAction(id, content);
    } else {
      res = await updatePostContentAction(id, content);
    }

    setIsUpdating(false);
    if (!res?.success) {
      alert(res?.error || 'Failed to save changes');
    } else {
      setViewModes(prev => ({ ...prev, [section]: 'view' }));
    }
  };

  const openScheduleModal = (postId: string, platform: string) => {
    setSchedulingPostId(postId);
    setSchedulingPlatform(platform);
    setScheduleModalOpen(true);
  };

  const handleScheduleConfirm = async (scheduledTime: string, customImageUrl?: string) => {
    if (!schedulingPostId) return;
    setIsUpdating(true);
    const res = await schedulePostAction(schedulingPostId, scheduledTime, customImageUrl);
    setIsUpdating(false);
    if (res.success) {
      setScheduleModalOpen(false);
      alert('Post scheduled successfully!');
    } else {
      alert(res.error || 'Failed to schedule post');
    }
  };

  const handlePublish = async (platform: 'linkedin' | 'email', postId: string, customImageUrl?: string) => {
    setPublishingInfo({ platform, postId });
    setInFlightPublishing(prev => [...prev, postId]);
    
    const res = await publishNowAction(id as string, platform, postId, customImageUrl);
    setShowPublishModal(false);

    if (!res.success) {
      alert(res.error);
      setInFlightPublishing(prev => prev.filter(id => id !== postId));
    }
  };

  const triggerPublishModal = (platform: 'linkedin' | 'email', postId: string) => {
    setPublishingInfo({ platform, postId });
    setShowPublishModal(true);
  };

  const handleRetryIntake = async () => {
    setIsUpdating(true);
    const res = await retryIntakeAction(id as string);
    setIsUpdating(false);
    if (!res.success) setActionStatus({ message: res.error || 'Failed to retry intake', type: 'error' });
    else setActionStatus({ message: 'Intake retry triggered!', type: 'success' });
  };

  const handleDeleteProject = async () => {
    setIsUpdating(true);
    const res = await deleteJobAction(id as string);
    setIsUpdating(false);
    if (res.success) router.push('/projects');
    else {
      setActionStatus({ message: res.error || 'Failed to delete project', type: 'error' });
      setShowDeleteConfirm(false);
    }
  };



  const handleMarkAsPosted = async (postId: string) => {
    setIsUpdating(true);
    const res = await markAsPostedAction(postId);
    setIsUpdating(false);
    if (!res.success) setActionStatus({ message: res.error || 'Failed to update status', type: 'error' });
    else {
      setConfirmMarkAsPosted(null);
      setActionStatus({ message: 'Success! Post marked as published.', type: 'success' });
    }
  };

  if (loading || !job) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Syncing with Supabase...</p>
        </div>
      );
    }
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <p className="text-zinc-500 mt-2">The project you are looking for does not exist or you don&apos;t have access.</p>
        <Button onClick={() => router.push('/projects')} className="mt-6" variant="outline">Back to Projects</Button>
      </div>
    );
  }

  // Logic Helpers
  const handleRevisionSubmit = async () => {
    if (!job || !user) return;
    
    try {
      setIsUpdating(true);
      
      // 1. Call n8n Revision Webhook
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_REVISION;
      if (webhookUrl && webhookUrl !== 'placeholder') {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            user_id: user.id,
            user_email: user.email,
            feedback: revisionNote || 'No specific feedback provided.'
          })
        });
      }

      // 2. Update Database State
      const res = await regenerateDraftsAction(job.id, revisionNote);
      if (res.success) {
        setShowRevisionModal(false);
        setRevisionNote('');
        setActionStatus({ message: 'Revision request sent to AI!', type: 'success' });
      } else {
        setActionStatus({ message: res.error || 'Failed to request revision', type: 'error' });
      }
    } catch (err) {
      console.error('Revision error:', err);
      setActionStatus({ message: 'Failed to connect to revision pipeline', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSchedule = async (postId: string) => {
    try {
      setIsUpdating(true);
      const res = await cancelScheduleAction(postId);
      if (!res.success) setActionStatus({ message: res.error || 'Failed to cancel schedule', type: 'error' });
      else {
        setConfirmCancelSchedule(null);
        setActionStatus({ message: 'Schedule cancelled successfully.', type: 'success' });
      }
    } catch (err) {
      console.error('Cancel schedule error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentPhaseIndex = phases.findIndex(p => p.key === job?.status) || 0;
  const hasSelectedDraft = activeDrafts.some(d => d.selected);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setViewMode = (section: string, mode: 'view' | 'edit') => {
    setViewModes(prev => ({ ...prev, [section]: mode }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header - Stagnant (Not Sticky) */}
      <div className="flex items-center justify-between py-4 border-b border-zinc-100 mb-6">
        <button 
          onClick={() => viewState === 'editor' ? setViewState('overview') : router.push('/projects')} 
          className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={16} /> 
          {viewState === 'editor' ? 'Back to Project Detail' : 'Back to Projects'}
        </button>
        <div className="flex items-center gap-2">
           <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
             job.status === 'published' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-orange-100 text-orange-600 border border-orange-200'
           }`}>
            {job.status?.replace('_', ' ') || 'Processing'}
          </span>
        </div>
      </div>

      {/* Action Status Banner */}
      {actionStatus && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          actionStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          <AlertCircle size={18} />
          <p className="text-sm font-bold">{actionStatus.message}</p>
        </div>
      )}

      <div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-zinc-900 truncate flex items-center gap-3">
              {job.input_type === 'url' ? 'Source Content' : 'Project Idea'}
              <span className="text-[10px] font-black text-white bg-zinc-900 px-3 py-1 rounded-full uppercase tracking-tighter shrink-0">
                {job.input_type}
              </span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={() => setShowInputModal(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group transition-colors"
              >
                <Eye size={12} className="group-hover:scale-110 transition-transform" />
                View Original Input
              </button>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 shrink-0" />
              <div className="text-sm text-zinc-400 truncate max-w-[400px] font-medium italic">
                {job.original_input}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(job.status === 'submitted' || job.status === 'failed') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryIntake}
                disabled={isUpdating}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 h-10 px-4 font-bold"
              >
                <RefreshCw size={14} className={isUpdating ? 'mr-2 animate-spin' : 'mr-2'} strokeWidth={3} /> 
                Retry Intake
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating}
              className="text-red-600 border-red-200 hover:bg-red-50 h-10 px-4 font-bold"
            >
              <Trash2 size={14} className={isUpdating ? 'mr-2 animate-spin' : 'mr-2'} strokeWidth={3} /> 
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Status Timeline - Always visible in Overview */}
        {viewState === 'overview' && (
          <aside className="lg:col-span-1 border-r border-zinc-100 pr-8">
            <div className="sticky top-8 space-y-8">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Pipeline Status</h3>
              <div className="space-y-0">
                {phases.map((phase, i) => {
                  const isPublished = job.status === 'published';
                  const isReady = job.status === 'ready_to_publish';
                  
                  // A phase is done if:
                  // 1. We are past it in the sequence
                  // 2. OR the whole job is published
                  // 3. OR it's the 'Ready' phase and the status IS published
                  // 4. OR it's the 'Adaptation' phase and the status is 'ready_to_publish' or 'published'
                  let isDone = i < currentPhaseIndex || isPublished;
                  
                  if (phase.key === 'adapting' && (isReady || isPublished)) isDone = true;
                  if (phase.key === 'ready_to_publish' && isPublished) isDone = true;

                  const isCurrent = (i === currentPhaseIndex && !isPublished) || 
                                   (phase.key === 'ready_to_publish' && isReady);
                  const isFailed = job.status === 'failed' && i === currentPhaseIndex;

                  return (
                    <div key={phase.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          isDone ? 'bg-green-500 border-green-500 text-white' : 
                          isFailed ? 'bg-red-500 border-red-500 text-white' :
                          isCurrent ? 'bg-orange-100 border-orange-500 text-orange-600' : 
                          'bg-white border-zinc-200 text-zinc-300'
                        }`}>
                          {isDone ? <Check size={12} strokeWidth={3} /> : <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-orange-500' : 'bg-transparent'}`} />}
                        </div>
                        {i < phases.length - 1 && <div className={`w-0.5 h-10 ${isDone ? 'bg-green-500' : 'bg-zinc-200'}`} />}
                      </div>
                      <div className="pb-6">
                        <p className={`text-sm font-semibold ${isCurrent ? 'text-zinc-900' : isDone ? 'text-zinc-500' : 'text-zinc-400'}`}>{phase.label}</p>
                        {isCurrent && <p className="text-[10px] font-bold text-orange-600 uppercase mt-0.5 tracking-tighter">In Progress</p>}
                        {isFailed && <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5 tracking-tighter">Failed</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Sidebar Footer Info */}
              <div className="mt-12 pt-8 border-t border-zinc-100">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Internal Notes</p>
                  <p className="text-[11px] font-medium text-zinc-500 leading-relaxed italic">
                    AI generation is optimized for {job.input_type} content. 3 drafts are provided per revision round.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}

        <main className={`${viewState === 'overview' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-12`}>
          {viewState === 'overview' ? (
            <div className="space-y-16">
              {/* 1. Article Drafts (Always visible in Overview) */}
              <section id="drafts" className="scroll-mt-24">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-widest">Article Drafts</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-900 text-white uppercase tracking-tighter">
                      Rev {job.revision_count || 0}/3
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowRevisionModal(true)}
                      disabled={hasSelectedDraft || isUpdating || (job.revision_count || 0) >= 3}
                      className={`h-9 px-4 text-[10px] font-black uppercase tracking-widest ${hasSelectedDraft ? 'opacity-50' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                    >
                      <RefreshCw size={14} className={isUpdating ? 'mr-2 animate-spin' : 'mr-2'} strokeWidth={3} />
                      {hasSelectedDraft ? 'Selection Locked' : 'Revise All Drafts'}
                    </Button>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{activeDrafts.length} Unique Angles</div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeDrafts.length > 0 ? (
                  activeDrafts.map((draft, i) => {
                    const isSelectedElsewhere = activeDrafts.some(d => d.selected) && !draft.selected;
                    if (draft.status === 'regenerating') {
                      return (
                        <Card key={draft.id} className="py-12 text-center border-dashed border-2 bg-zinc-50 border-orange-200">
                          <Loader2 className="animate-spin mx-auto text-orange-400 mb-4" size={32} />
                          <p className="text-sm font-bold text-orange-600 uppercase tracking-widest">AI is regenerating this draft...</p>
                        </Card>
                      );
                    }

                    return (
                      <Card 
                        key={draft.id} 
                        onClick={() => handleEdit(draft)}
                        className={`relative border border-zinc-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col p-6 cursor-pointer ${draft.selected ? 'ring-2 ring-orange-500' : ''} ${isSelectedElsewhere ? 'opacity-70' : ''}`}
                      >
                          <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Angle #{activeDrafts.length - i}</p>
                              <p className="text-sm font-bold text-zinc-900 mt-1 line-clamp-1">{draft.angle || 'General Draft'}</p>
                            </div>
                          </div>
                          <div className="px-2 py-0.5 rounded text-[10px] font-black bg-zinc-50 text-zinc-400 border border-current/10">
                             Draft
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-sm text-zinc-500 line-clamp-4 leading-relaxed mb-6 italic">
                             {draft.content?.substring(0, 160).replace(/#+/g, '')}...
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                              <Zap size={12} className="text-orange-500" />
                              {draft.word_count || 0} words
                            </div>
                          </div>
                          
                          {draft.selected ? (
                            <div className="bg-zinc-200 text-zinc-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-300">
                              Adapted
                            </div>
                          ) : (
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest transition-all ${isSelectedElsewhere ? 'bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-100' : ''}`}
                              disabled={!!isSelectedElsewhere}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectClick(draft, true);
                              }}
                            >
                              {isSelectedElsewhere ? 'Locked' : 'Select'}
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="py-24 text-center border-dashed border-2 bg-zinc-50 w-full col-span-full">
                    <Loader2 className="animate-spin mx-auto text-orange-400 mb-4" size={40} />
                    <p className="text-sm font-black text-zinc-900 uppercase tracking-[0.2em]">Crafting content hooks...</p>
                    <p className="text-xs text-zinc-500 mt-2 font-medium">Sit tight, our AI is analyzing your intake.</p>
                  </Card>
                )}
                </div>

                {/* Expanded SEO Research Section */}
                <SEOBriefSection 
                  seoBrief={seoBrief as any} 
                  job={job as any}
                  expanded={expandedSummary} 
                  onToggle={() => setExpandedSummary(!expandedSummary)} 
                />
              </section>

              {/* 2. Platform Adaptations (Visible after draft selection) */}
              {(posts.length > 0 || job.status === 'adapting' || job.status === 'ready_to_publish' || job.status === 'published') && (
                <section className="animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-zinc-900 uppercase tracking-widest">Platform Adaptations</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                       <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Live Adaptations</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {['linkedin', 'twitter', 'email'].map((platform) => {
                      const post = posts.find(p => p.platform === platform);
                      const iconMap = { linkedin: Linkedin, twitter: Twitter, email: Mail };
                      const Icon = iconMap[platform as keyof typeof iconMap];

                      if (!post && job.status !== 'adapting') return null;

                      return (
                        <Card 
                          key={platform} 
                          className="relative border border-zinc-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col p-6 cursor-pointer"
                          onClick={() => {
                            const adaptedDraft = activeDrafts.find(d => d.selected);
                            if (adaptedDraft) {
                              handleEdit(adaptedDraft, `section-${platform}`);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                                platform === 'linkedin' ? 'bg-[#0077b5]' : 
                                platform === 'twitter' ? 'bg-zinc-900' : 'bg-orange-500'
                              }`}>
                                <Icon size={18} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Drafting</p>
                                <p className="text-base font-black text-zinc-900 mt-1 capitalize">{platform === 'email' ? 'Newsletter' : platform}</p>
                              </div>
                            </div>
                            {post && (
                              <div className="flex flex-col gap-1 items-end">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-current/10 ${
                                  post.status === 'published' ? 'bg-green-100 text-green-600' : 
                                  post.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                  {post.status}
                                </span>
                                {post.status === 'scheduled' && post.publish_at && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 uppercase tracking-tighter">
                                    <Clock size={10} />
                                    {new Date(post.publish_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            {post ? (
                              <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed mb-6 italic">
                                {post.content?.substring(0, 120).replace(/#+/g, '')}...
                              </p>
                            ) : (
                              <div className="flex items-center gap-2 py-8 text-zinc-400">
                                <Loader2 className="animate-spin" size={16} />
                                <span className="text-xs font-bold uppercase tracking-tighter">AI Adapting...</span>
                              </div>
                            )}
                          </div>

                          {post && (
                            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-50" onClick={(e) => e.stopPropagation()}>
                              {platform === 'twitter' ? (
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  className="w-full h-8 text-[10px] font-black uppercase bg-zinc-900 group-hover:bg-black"
                                  disabled={post.status === 'published'}
                                  onClick={() => setConfirmMarkAsPosted({ id: post.id })}
                                >
                                  {post.status === 'published' ? 'Marked as Posted' : 'Mark as Posted'}
                                </Button>
                              ) : (
                                <div className="grid grid-cols-2 gap-2">
                                  {post.status === 'scheduled' ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-[9px] font-black uppercase tracking-tighter border-red-100 text-red-500 hover:bg-red-50"
                                      onClick={() => setConfirmCancelSchedule({ id: post.id })}
                                    >
                                      Cancel
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-[9px] font-black uppercase tracking-tighter border-zinc-200"
                                      disabled={post.status === 'published'}
                                      onClick={() => {
                                        setSchedulingPostId(post.id);
                                        setSchedulingPlatform(platform);
                                        setScheduleModalOpen(true);
                                      }}
                                    >
                                      Schedule
                                    </Button>
                                  )}
                                  
                                  {post.status === 'published' && platform === 'email' ? (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-[9px] font-black uppercase tracking-widest border-green-200 text-green-600 hover:bg-green-50"
                                      onClick={() => handleFetchRecipients(post.id)}
                                    >
                                      Report
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="primary" 
                                      size="sm" 
                                      className="h-8 text-[9px] font-black uppercase tracking-widest"
                                      loading={inFlightPublishing.includes(post.id)}
                                      disabled={post.status === 'published' || post.status === 'scheduled' || inFlightPublishing.includes(post.id)}
                                      onClick={() => {
                                        setPublishingInfo({ platform: platform as 'linkedin' | 'email', postId: post.id });
                                        setShowPublishModal(true);
                                      }}
                                    >
                                      {post.status === 'published' ? 'Sent' : post.status === 'scheduled' ? 'Scheduled' : 'Publish'}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* Selected Multi-Editor Workspace */
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-16">
              {selectedDraft && (
                <>
                  {/* Article Editor */}
                  <div className="section-container border-b border-zinc-50 pb-16">
                    <div 
                      onClick={() => toggleSection('article')}
                      className="flex items-center justify-between mb-8 group cursor-pointer hover:bg-zinc-50/50 p-4 -mx-4 rounded-3xl transition-colors"
                    >
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-2xl text-white shadow-xl transition-all duration-500 scale-110 ${expandedSections.article ? 'bg-zinc-900 rotate-0' : 'bg-zinc-400 -rotate-12 opacity-50'}`}>
                            <FileText size={28} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1.5">
                              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] bg-orange-100/80 px-2.5 py-1 rounded leading-none shadow-sm">Draft Editor</span>
                              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded">Round #{selectedDraft.revision_round || 0}</span>
                            </div>
                            <h2 className={`text-4xl font-black transition-all ${expandedSections.article ? 'text-zinc-900' : 'text-zinc-300'}`}>
                              {selectedDraft.angle || 'Article Draft'}
                            </h2>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className={`transition-transform duration-500 ${expandedSections.article ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronDown size={24} className="text-zinc-300" />
                          </div>
                          <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl shadow-inner" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setViewMode('article', 'view')}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewModes.article === 'view' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                              <Eye size={14} /> VIEW
                            </button>
                            <button 
                              onClick={() => setViewMode('article', 'edit')}
                              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${viewModes.article === 'edit' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                              <Edit3 size={14} /> EDIT
                            </button>
                          </div>
                        </div>
                    </div>

                    {expandedSections.article && (
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 animate-in fade-in duration-300 w-full">
                        {/* Editor Main Content - EXPANSIVE */}
                        <div className="min-w-0">
                          <div className="bg-white border border-zinc-100 rounded-[2.5rem] overflow-visible shadow-2xl shadow-zinc-200/50 flex flex-col min-h-[700px]">
                            {selectedDraft.image_url && (
                              <div className="w-full h-[400px] bg-zinc-100 overflow-hidden relative group border-b border-zinc-100">
                                <img src={selectedDraft.image_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              </div>
                            )}
                            <div className="flex-1 p-8 lg:p-10">
                              {viewModes.article === 'view' ? (
                                <div className="max-w-none prose prose-zinc prose-lg selection:bg-orange-100">
                                  <ReactMarkdown>{contents.article || selectedDraft.content || ''}</ReactMarkdown>
                                </div>
                              ) : (
                                <RichTextEditor 
                                  content={contents.article} 
                                  onChange={(c) => setContents(prev => ({ ...prev, article: c }))} 
                                  editable={true}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Editor Sidebar - PERMANENT 360px & FLOATING */}
                        <aside className="w-full lg:w-[360px] shrink-0">
                          <div className="sticky top-24 space-y-6 pb-20 z-50">
                             <Card className="border border-zinc-100 bg-zinc-50/50 p-6 rounded-3xl shadow-sm">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Metrics & Actions</h3>
                                 <div className="space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-zinc-200/50">
                                       <span className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Draft Status</span>
                                       <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded uppercase tracking-tighter">
                                          Primary Draft
                                       </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-zinc-200/50">
                                       <span className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Revision</span>
                                       <span className="text-sm font-black text-zinc-900">#{selectedDraft.revision_round || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-zinc-200/50">
                                       <span className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Word Count</span>
                                       <span className="text-sm font-black text-zinc-900">{selectedDraft.word_count || 0}</span>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                       {!selectedDraft.selected ? (
                                          <Button 
                                            variant="primary" 
                                            className="w-full h-12 font-black text-xs uppercase tracking-widest shadow-lg"
                                            onClick={() => handleSelectClick(selectedDraft as Draft, false)}
                                            disabled={job.status !== 'awaiting_review' || activeDrafts.some(d => d.selected)}
                                          >
                                            {activeDrafts.some(d => d.selected) ? 'OTHER SELECTED' : 'SELECT DRAFT'}
                                          </Button>
                                       ) : (
                                          <div className="bg-zinc-200 text-zinc-500 p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-zinc-300">
                                              ADAPTED
                                          </div>
                                       )}

                                       {viewModes.article === 'edit' ? (
                                          <div className="grid grid-cols-2 gap-2 mt-4">
                                             <Button variant="ghost" className="text-[10px] font-black" onClick={() => setViewMode('article', 'view')}>DISCARD</Button>
                                             <Button variant="outline" className="text-[10px] font-black border-zinc-200" onClick={() => saveContent('article', selectedDraft.id)}>SAVE</Button>
                                          </div>
                                       ) : (
                                          <div className="space-y-3">
                                            <Button 
                                              variant="outline" 
                                              className="w-full h-10 bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                              onClick={() => setShowSEOModal(true)}
                                            >
                                              <Search size={14} className="text-zinc-400" /> SEO Research
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              className="w-full h-10 text-red-500 border-red-100 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest"
                                              onClick={() => setShowDeleteConfirm(true)}
                                            >
                                              <Trash2 size={14} className="mr-2" /> Delete
                                            </Button>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                             </Card>

                             {/* Revision Loop */}
                             <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl shadow-sm">
                                <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-4">Revision Management</p>
                                <Button 
                                  variant="outline" 
                                  className="w-full bg-white border-orange-200 text-orange-600 font-black h-12 text-[10px] uppercase tracking-widest"
                                  onClick={() => {
                                     setRevisionTargetId(selectedDraft.id);
                                     setShowRevisionModal(true);
                                  }}
                                  disabled={(job.revision_count || 0) >= 3 || !!selectedDraft.selected}
                                >
                                  {(job.revision_count || 0) >= 3 ? 'Limit Reached' : selectedDraft.selected ? 'Draft Adapted' : `Request Revision #${(job.revision_count || 0) + 1}`}
                                </Button>
                                {selectedDraft.selected && (
                                  <p className="text-[9px] text-orange-800 text-center font-bold uppercase mt-3 tracking-tighter opacity-60">
                                    Revisions locked after adaptation
                                  </p>
                                )}
                             </div>
                          </div>
                        </aside>
                      </div>
                    )}
                  </div>

                  {/* Platform Adaptation Editor Sub-sections (Only for selected/adapted draft) */}
                  {selectedDraft.selected && (
                    <div className="space-y-16 mt-20 border-t-2 border-zinc-50 pt-20">
                      <div className="flex items-center gap-4 mb-12">
                         <div className="h-1 shadow-sm bg-orange-500 w-12 rounded-full" />
                         <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-widest">Post Adaptations</h3>
                      </div>

                      <div className="space-y-24">
                        {['linkedin', 'twitter', 'email'].map((platform) => {
                          const post = posts.find(p => p.platform === platform);
                          if (!post) return null;

                          const iconMap = { linkedin: Linkedin, twitter: Twitter, email: Mail };
                          const Icon = iconMap[platform as keyof typeof iconMap];
                          const platformKey = platform === 'email' ? 'newsletter' : platform;

                          return (
                            <div key={platform} id={`section-${platform}`} className="section-container border-b border-zinc-50 pb-20 last:border-0">
                               <div 
                                  onClick={() => toggleSection(platformKey)}
                                  className="flex items-center justify-between mb-8 group cursor-pointer hover:bg-zinc-50/50 p-4 -mx-4 rounded-3xl transition-colors"
                               >
                                  <div className="flex items-center gap-6">
                                     <div className={`p-3.5 rounded-2xl text-white shadow-xl transition-all duration-500 scale-110 ${
                                       expandedSections[platformKey] ? (
                                         platform === 'linkedin' ? 'bg-[#0077b5] rotate-0' : 
                                         platform === 'twitter' ? 'bg-zinc-900 rotate-0' : 'bg-orange-500 rotate-0'
                                       ) : 'bg-zinc-400 -rotate-12 opacity-50'
                                     }`}>
                                        <Icon size={24} />
                                     </div>
                                     <div>
                                       <div className="flex items-center gap-3 mb-1.5">
                                         <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-zinc-100 px-2.5 py-1 rounded leading-none shadow-sm">Platform Adaptation</span>
                                         <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-current/10 ${
                                            post.status === 'published' ? 'bg-green-100 text-green-600' : 
                                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                         }`}>
                                            {post.status}
                                         </span>
                                       </div>
                                       <h4 className={`text-3xl font-black capitalize transition-all ${expandedSections[platformKey] ? 'text-zinc-900' : 'text-zinc-300'}`}>
                                         {platform === 'email' ? 'Newsletter' : platform} Version
                                       </h4>
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                     <div className={`transition-transform duration-500 ${expandedSections[platformKey] ? 'rotate-180' : 'rotate-0'}`}>
                                       <ChevronDown size={24} className="text-zinc-300" />
                                     </div>
                                     <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl shadow-inner" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => setViewMode(platformKey, 'view')}
                                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewModes[platformKey] === 'view' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                          VIEW
                                        </button>
                                        <button 
                                          onClick={() => setViewMode(platformKey, 'edit')}
                                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewModes[platformKey] === 'edit' ? 'bg-white text-zinc-900 shadow-md' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                          EDIT
                                        </button>
                                     </div>
                                  </div>
                               </div>

                                {expandedSections[platformKey] && (
                                 <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="min-w-0">
                                       <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-zinc-200/50 min-h-[400px]">
                                          {viewModes[platformKey] === 'view' ? (
                                            <div className="max-w-none prose prose-zinc prose-lg selection:bg-orange-100 font-medium leading-relaxed">
                                              <ReactMarkdown>{contents[platformKey] || post.content || ''}</ReactMarkdown>
                                            </div>
                                          ) : (
                                            <RichTextEditor 
                                              content={contents[platformKey]} 
                                              onChange={(c) => setContents(prev => ({ ...prev, [platformKey]: c }))} 
                                              editable={true}
                                              toolbar={false}
                                            />
                                          )}
                                       </div>
                                    </div>

                                     <div className="w-full lg:w-[360px]">
                                        <div className="sticky top-24 space-y-6 pb-20 z-50">
                                          <Card className="border-none bg-zinc-50 p-6 rounded-3xl">
                                             <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Status & Controls</h5>
                                             <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                   <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Current Status</span>
                                                   <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                      post.status === 'published' ? 'bg-green-100 text-green-600' : 
                                                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                                   }`}>
                                                      {post.status}
                                                   </span>
                                                </div>
                                                {post.publish_at && (
                                                  <div className="pt-2 border-t border-zinc-200/50">
                                                     <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Scheduled for</p>
                                                     <div className="flex items-center gap-1.5 text-xs text-zinc-900 font-black">
                                                        <Clock size={12} className="text-blue-500" />
                                                        {new Date(post.publish_at).toLocaleString()}
                                                     </div>
                                                  </div>
                                                )}
                                             </div>

                                             <div className="mt-8 pt-6 border-t border-zinc-200/50 space-y-2" onClick={(e) => e.stopPropagation()}>
                                                {platform === 'twitter' ? (
                                                  <Button 
                                                    variant="primary" 
                                                    size="sm" 
                                                    className="w-full h-10 text-[10px] font-black uppercase bg-zinc-900 hover:bg-black shadow-lg"
                                                    disabled={post.status === 'published'}
                                                    onClick={() => setConfirmMarkAsPosted({ id: post.id })}
                                                  >
                                                    {post.status === 'published' ? 'Posted on X' : 'Mark as Posted'}
                                                  </Button>
                                                ) : (
                                                  <div className="flex flex-col gap-2">
                                                    <Button 
                                                      variant="primary" 
                                                      size="sm" 
                                                      className="w-full h-10 text-[10px] font-black uppercase tracking-widest shadow-lg"
                                                      loading={inFlightPublishing.includes(post.id)}
                                                      disabled={post.status === 'published' || inFlightPublishing.includes(post.id)}
                                                      onClick={() => triggerPublishModal(post.platform as 'linkedin' | 'email', post.id)}
                                                    >
                                                      {post.status === 'published' ? 'Published' : 'Publish Now'}
                                                    </Button>
                                                    <div className="grid grid-cols-2 gap-2">
                                                      <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-10 text-[9px] font-black uppercase border-zinc-200"
                                                        disabled={post.status === 'published'}
                                                        onClick={() => openScheduleModal(post.id, platform)}
                                                      >
                                                        {post.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                                                      </Button>
                                                      {post.status === 'scheduled' && (
                                                        <Button 
                                                          variant="ghost" 
                                                          size="sm" 
                                                          className="h-10 text-[9px] font-black uppercase text-red-500 hover:bg-red-50"
                                                          onClick={() => setConfirmCancelSchedule({ id: post.id })}
                                                        >
                                                          Cancel
                                                        </Button>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                {viewModes[platformKey] === 'edit' && (
                                                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-200/50">
                                                     <Button variant="ghost" className="text-[9px] font-black" onClick={() => setViewMode(platformKey, 'view')}>DISCARD</Button>
                                                     <Button variant="outline" className="text-[9px] font-black border-zinc-200" onClick={() => saveContent(platformKey, post.id)}>SAVE</Button>
                                                  </div>
                                                )}
                                             </div>
                                          </Card>
                                       </div>
                                    </div>
                                 </div>
                               )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>


      {/* Job Errors Display */}
      {job.status === 'failed' && (jobError || job.error_message) && (
        <div className="mt-12 p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] shadow-sm animate-in shake duration-500">
           <div className="flex items-start gap-6">
              <div className="p-4 bg-red-100 rounded-2xl text-red-600 shadow-lg shadow-red-200">
                 <AlertCircle size={32} />
              </div>
              <div className="flex-1">
                 <h4 className="text-red-900 font-black uppercase tracking-widest text-xs mb-2">Automated Execution Failed</h4>
                 <p className="text-red-800 text-sm font-bold leading-relaxed">
                    {jobError?.error_description || job.error_message || 'An unexpected error occurred during content generation.'}
                 </p>
                 {jobError?.execution_url && (
                    <div className="mt-4">
                      <a 
                        href={jobError.execution_url} 
                        target="_blank" 
                        className="text-[11px] font-black text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-all shadow-lg shadow-red-200"
                      >
                         DEBUG n8n WORKFLOW <ArrowLeft size={10} className="rotate-180" />
                      </a>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Revision History */}
      {revisionHistory.length > 0 && (
        <div className="mt-20 space-y-8">
           <div className="flex items-center gap-3 text-zinc-400">
              <Clock size={20} />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Revision History</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {revisionHistory.map((rev) => (
                <Card key={rev.id} className="!bg-zinc-50 border-none opacity-80 grayscale hover:grayscale-0 transition-all p-8 rounded-3xl">
                   <div className="flex items-center justify-between mb-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <span>Round #{rev.revision_round || 0}</span>
                      <span>{new Date(rev.created_at || '').toLocaleDateString()}</span>
                   </div>
                   <div className="p-4 bg-white rounded-2xl border border-zinc-100 text-xs text-zinc-500 italic mb-4 flex gap-3 shadow-sm">
                      <MessageSquare size={16} className="shrink-0 text-orange-500" />
                      <span>&quot;{rev.manager_feedback || 'No feedback provided'}&quot;</span>
                   </div>
                   <p className="text-sm font-black text-zinc-900 mb-3">{rev.angle}</p>
                </Card>
              ))}
           </div>
        </div>
      )}

      {/* Modals outside everything */}
      <SelectConfirmationModal
        isOpen={isConfirmingSelect}
        onClose={() => setIsConfirmingSelect(false)}
        onConfirm={handleConfirmSelect}
        draftTitle={selectedDraft?.angle || 'this draft'}
        isFromList={isSelectingFromList}
        onViewDraft={() => {
          setIsConfirmingSelect(false);
          if (selectedDraft) handleEdit(selectedDraft);
        }}
      />

      <ScheduleModal 
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onConfirm={handleScheduleConfirm}
        platform={schedulingPlatform}
        loading={isUpdating}
      />

      <Modal 
        isOpen={showRevisionModal} 
        onClose={() => setShowRevisionModal(false)}
        title="Request AI Revision"
      >
        <div className="space-y-6">
           <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-xs text-orange-800 leading-relaxed italic">
                &quot;Be specific. Instead of &apos;make it better&apos;, try &apos;add more focus on profitability&apos; or &apos;make the tone more aggressive&apos;.&quot;
              </p>
           </div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Revision Instructions</label>
              <textarea 
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="What should the AI change?"
                className="w-full h-32 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 !text-zinc-900 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all resize-none font-medium"
              />
           </div>

           <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold" onClick={() => setShowRevisionModal(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="flex-1 font-black uppercase tracking-widest text-xs h-12"
                onClick={handleRevisionSubmit}
                disabled={isUpdating}
                loading={isUpdating}
              >
                Trigger AI Fix
              </Button>
           </div>
        </div>
      </Modal>

      <Modal 
        isOpen={showInputModal} 
        onClose={() => setShowInputModal(false)}
        title="Original Input View"
      >
        <div className="space-y-4">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Input Type</p>
              <p className="text-sm font-bold text-zinc-900 capitalize">{job.input_type}</p>
           </div>
           <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Raw Content / URL</p>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 max-h-60 overflow-y-auto">
                 <p className="text-sm text-zinc-600 leading-relaxed font-medium break-words">
                   {job.original_input}
                 </p>
              </div>
           </div>
           {job.source_url && (
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Source URL</p>
                 <a 
                   href={job.source_url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-sm font-bold text-orange-600 hover:text-orange-700 underline truncate block"
                 >
                    {job.source_url}
                 </a>
              </div>
           )}
           <Button className="w-full mt-4 font-bold" onClick={() => setShowInputModal(false)}>Close</Button>
        </div>
      </Modal>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project?"
        message="This will permanently remove the project, all drafts, and platform adaptations. This action cannot be undone."
        confirmText="Delete permanently"
        variant="danger"
        loading={isUpdating}
      />

      <ConfirmationModal
        isOpen={!!confirmMarkAsPosted}
        onClose={() => setConfirmMarkAsPosted(null)}
        onConfirm={() => confirmMarkAsPosted && handleMarkAsPosted(confirmMarkAsPosted.id)}
        title="Mark as Posted?"
        message="This will stop any further automation for this platform. Are you sure you want to mark this as published manually?"
        confirmText="Mark as Published"
        variant="primary"
        loading={isUpdating}
      />

      <ConfirmationModal
        isOpen={!!confirmCancelSchedule}
        onClose={() => setConfirmCancelSchedule(null)}
        onConfirm={() => confirmCancelSchedule && handleCancelSchedule(confirmCancelSchedule.id)}
        title="Cancel Schedule?"
        message="This will remove the scheduled publication time. You can schedule it again or publish immediately later."
        confirmText="Cancel Schedule"
        variant="danger"
        loading={isUpdating}
      />

      {/* SEO Research Modal for Editor */}
      <Modal
        isOpen={showSEOModal}
        onClose={() => setShowSEOModal(false)}
        title="SEO Research Brief"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-8">
           <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl">
              <div>
                 <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest leading-none">Primary Keyword</p>
                 <p className="text-sm font-black text-orange-600 mt-1">{seoBrief?.primary_keyword || 'Calculating...'}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest leading-none">Search Phrase</p>
                 <p className="text-[11px] font-bold text-orange-800 italic mt-1 truncate max-w-xs">&quot;{job.search_phrase}&quot;</p>
              </div>
           </div>


           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div>
                    <div className="flex items-center gap-2 mb-3">
                       <Target size={14} className="text-orange-500" />
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Target Audience</p>
                    </div>
                    <p className="text-sm text-zinc-700 font-medium leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                       {seoBrief?.target_audience || 'General professionals'}
                    </p>
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-3">
                       <PenTool size={14} className="text-orange-500" />
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tone & Style</p>
                    </div>
                    <p className="text-sm text-zinc-700 font-medium leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                       {seoBrief?.tone_style || 'Professional'}
                    </p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <div className="flex items-center gap-2 mb-3">
                       <Hash size={14} className="text-orange-500" />
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Keywords</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {seoBrief?.short_tail_keywords?.map((kw: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-zinc-100 text-[10px] font-bold text-zinc-600 rounded-lg border border-zinc-200">{kw}</span>
                       ))}
                       {seoBrief?.long_tail_keywords?.map((kw: string, i: number) => (
                          <span key={`l-${i}`} className="px-2 py-1 bg-orange-50 text-[10px] font-bold text-orange-600 rounded-lg border border-orange-100">{kw}</span>
                       ))}
                    </div>
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-3">
                       <ExternalLink size={14} className="text-orange-500" />
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Top Competitors</p>
                    </div>
                    <div className="space-y-2">
                       {seoBrief?.competitor_urls?.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-xs font-bold text-zinc-500 hover:text-orange-600 transition-colors truncate underline">
                             {url}
                          </a>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
           
           <Button variant="primary" className="w-full h-12 font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-200" onClick={() => setShowSEOModal(false)}>Close Research</Button>
        </div>
      </Modal>

      {/* Publish Confirm Modal */}
      {publishingInfo && (
        <PublishConfirmModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={(url) => handlePublish(publishingInfo.platform, publishingInfo.postId, url)}
          onViewContent={() => {
            setShowPublishModal(false);
            const adaptedDraft = activeDrafts.find(d => d.selected);
            if (adaptedDraft) {
               handleEdit(adaptedDraft, `section-${publishingInfo.platform}`);
            }
          }}
          platform={publishingInfo.platform}
          isOverview={viewState === 'overview'}
          loading={inFlightPublishing.includes(publishingInfo.postId)}
        />
      )}

      {/* Newsletter Recipients Modal */}
      <Modal
        isOpen={showRecipientsModal}
        onClose={() => setShowRecipientsModal(false)}
        title="Newsletter Delivery Report"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recipients & Status</h4>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-tighter">
              {recipients.length} Total
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loadingRecipients ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-orange-500" size={32} />
              </div>
            ) : recipients.length > 0 ? (
              recipients.map((rec, i) => (
                <div key={rec.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-500">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 leading-none mb-1">{rec.subscribers?.email || 'Unknown'}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter italic">
                        {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                    rec.status === 'sent' ? 'bg-green-100 text-green-600 border-green-200' :
                    rec.status === 'failed' ? 'bg-red-100 text-red-600 border-red-200' :
                    'bg-zinc-100 text-zinc-400 border-zinc-200'
                  }`}>
                    {rec.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-400">
                <Mail className="mx-auto mb-3 opacity-20" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest">No delivery data available</p>
              </div>
            )}
          </div>

          <Button className="w-full font-bold" onClick={() => setShowRecipientsModal(false)}>Close Report</Button>
        </div>
      </Modal>
    </div>
  );
}

// Local Component for SEO Brief Section
function SEOBriefSection({ seoBrief, job, expanded, onToggle }: { seoBrief: any, job: any, expanded: boolean, onToggle: () => void }) {
  if (!seoBrief) return null;

  return (
    <div className="mt-8 border-2 border-zinc-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all group">
      <button 
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Search size={20} />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">SEO Research Brief</h4>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mt-1">
              Primary: <span className="text-zinc-600">{seoBrief.primary_keyword}</span>
            </p>
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-zinc-100 text-zinc-400 group-hover:text-orange-600 transition-all ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </button>

      {expanded && (
        <div className="p-8 pt-2 border-t border-zinc-50 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-orange-500" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Target Audience</p>
                </div>
                <p className="text-sm text-zinc-700 font-medium leading-relaxed pl-6">
                  {seoBrief.target_audience || 'General industry professionals and decision makers.'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PenTool size={14} className="text-orange-500" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tone & Style</p>
                </div>
                <p className="text-sm text-zinc-700 font-medium leading-relaxed pl-6">
                  {seoBrief.tone_style || 'Professional, authoritative, yet accessible and engaging.'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hash size={14} className="text-orange-500" />
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Secondary Keywords</p>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {seoBrief.short_tail_keywords?.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-zinc-100 text-[10px] font-bold text-zinc-600 rounded-lg border border-zinc-200">
                      {kw}
                    </span>
                  ))}
                  {seoBrief.long_tail_keywords?.map((kw: string, i: number) => (
                    <span key={`l-${i}`} className="px-2 py-1 bg-orange-50 text-[10px] font-bold text-orange-600 rounded-lg border border-orange-100">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink size={14} className="text-orange-500" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Top Competitors</p>
              </div>
              <div className="space-y-2 pl-6">
                {(seoBrief.competitor_urls || []).map((link: string, i: number) => (
                  <a 
                    key={i} 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-orange-600 transition-colors truncate group/link"
                  >
                    <div className="w-1 h-1 rounded-full bg-zinc-300 group-hover/link:bg-orange-500" />
                    {new URL(link).hostname.replace('www.', '')}
                  </a>
                ))}
                {(!seoBrief.competitor_urls || seoBrief.competitor_urls.length === 0) && (
                  <p className="text-xs text-zinc-400 italic">No competitor links stored.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-50">
            <div className="flex items-center gap-2 mb-4">
              <Info size={14} className="text-orange-500" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Search Phrase Context</p>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
              <p className="text-sm text-zinc-600 font-medium italic">
                "{job.search_phrase || 'Automated SEO research based on initial intake data.'}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
