'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, Check, Clock, FileText, Linkedin, 
  Twitter, Mail, Loader2, AlertCircle, Edit3, 
  RefreshCcw, Send, Calendar, XCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  selectDraftAction, 
  regenerateDraftsAction, 
  updateDraftContentAction,
  publishNowAction,
  schedulePostAction,
  cancelScheduleAction
} from '@/app/actions/content';
import type { Job, Draft, PlatformPost } from '@/types/database';

const phases = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'seo_research', label: 'SEO Research' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'awaiting_review', label: 'Awaiting Review' },
  { key: 'adapting', label: 'Adaptation' },
  { key: 'ready_to_publish', label: 'Ready' },
  { key: 'published', label: 'Published' },
];

function seoColor(score: number) {
  if (score >= 90) return { text: 'text-green-600', bg: 'bg-green-50' };
  if (score >= 70) return { text: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { text: 'text-red-600', bg: 'bg-red-50' };
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  
  // UI States
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    async function fetchData() {
      const [jobRes, draftsRes, postsRes] = await Promise.all([
        supabase.from('content_jobs').select('*').eq('id', id).single(),
        supabase.from('article_drafts').select('*').eq('job_id', id).order('created_at', { ascending: false }),
        supabase.from('platform_posts').select('*').eq('job_id', id)
      ]);

      if (jobRes.data) setJob(jobRes.data);
      if (draftsRes.data) setDrafts(draftsRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      setLoading(false);
    }

    fetchData();

    // Subscribe to job and children updates
    const channel = supabase.channel(`project-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_jobs', filter: `id=eq.${id}` }, (payload) => {
        setJob(payload.new as Job);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'article_drafts', filter: `job_id=eq.${id}` }, () => {
        supabase.from('article_drafts').select('*').eq('job_id', id).order('created_at', { ascending: false }).then(res => setDrafts(res.data || []));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_posts', filter: `job_id=eq.${id}` }, () => {
        supabase.from('platform_posts').select('*').eq('job_id', id).then(res => setPosts(res.data || []));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
        <p className="text-sm text-[var(--color-text-secondary)]">Syncing project data...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <p className="text-[var(--color-text-secondary)] mt-2">The project you are looking for does not exist or you don't have access.</p>
        <Button onClick={() => router.push('/projects')} className="mt-6" variant="outline">Back to Projects</Button>
      </div>
    );
  }

  // Logic Helpers
  const currentPhaseIndex = phases.findIndex(p => p.key === job.status);
  const activeDrafts = drafts.filter(d => d.status !== 'rejected');
  const selectedDraft = drafts.find(d => d.selected);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/projects')} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4 cursor-pointer transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{job.original_input}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-[var(--color-text-muted)]">ID: {job.id}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span className="text-xs text-[var(--color-text-muted)]">Started {new Date(job.created_at!).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {job.status === 'awaiting_review' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRevisionModal(true)}
                disabled={(job as any).revision_count >= 3}
              >
                <RefreshCcw size={14} className="mr-2" /> 
                Regenerate ({(job as any).revision_count || 0}/3)
              </Button>
            )}
            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary-soft)] uppercase tracking-wider`}>
              {job.status!.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status Timeline */}
        <Card className="lg:col-span-1 border-none shadow-sm !bg-zinc-50/50">
          <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-6">Pipeline Status</h3>
          <div className="space-y-0">
            {phases.map((phase, i) => {
              const isDone = i < currentPhaseIndex || job.status === 'published';
              const isCurrent = i === currentPhaseIndex && job.status !== 'published';
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
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-[var(--color-text)]' : isDone ? 'text-[var(--color-text-secondary)]' : 'text-zinc-400'}`}>{phase.label}</p>
                    {isCurrent && <p className="text-[10px] font-bold text-orange-600 uppercase mt-0.5 tracking-tighter">In Progress</p>}
                    {isFailed && <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5 tracking-tighter">Failed</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Drafts Section */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-[var(--color-text)]">Article Drafts</h3>
          </div>

          {!selectedDraft ? (
            <div className="grid grid-cols-1 gap-4">
              {activeDrafts.length > 0 ? (
                activeDrafts.map((draft) => {
                  const sc = seoColor(75); // Mock score for now until SEO score data exists
                  return (
                    <Card key={draft.id} hover className="border-none shadow-sm transition-all hover:shadow-md group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-[var(--color-text)]">{draft.angle || 'Draft Content'}</h4>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1 uppercase font-semibold">
                              {draft.word_count || 0} words • Grade 7 Readability
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-lg ${sc.bg} ${sc.text} font-bold text-sm border`}>
                          75/100
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-600 leading-relaxed max-h-32 overflow-hidden relative">
                        {draft.content}
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-50 to-transparent" />
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingDraftId(draft.id!);
                            setEditContent(draft.content || '');
                          }}
                        >
                          <Edit3 size={14} className="mr-2" /> Edit
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={async () => {
                            setIsUpdating(true);
                            await selectDraftAction(job.id, draft.id!);
                            setIsUpdating(false);
                          }}
                          disabled={isUpdating}
                        >
                          Select & Adapt
                        </Button>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="py-20 text-center border-dashed border-2 bg-zinc-50">
                  <Loader2 className="animate-spin mx-auto text-zinc-400 mb-4" size={32} />
                  <p className="text-sm font-medium text-zinc-500">Generating initial drafts...</p>
                </Card>
              )}
            </div>
          ) : (
            /* Selected Draft View */
            <Card className="border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)]/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] bg-white px-2.5 py-1 rounded-full border border-[var(--color-primary-soft)] shadow-sm">
                    <Check size={12} strokeWidth={3} /> Selected
                  </span>
               </div>
               
               <h4 className="text-lg font-bold text-[var(--color-text)] mb-2">{selectedDraft.angle || 'Selected Draft'}</h4>
               <div className="prose prose-sm max-w-none text-zinc-700 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm leading-relaxed whitespace-pre-wrap">
                  {selectedDraft.content}
               </div>
               
               <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingDraftId(selectedDraft.id!);
                      setEditContent(selectedDraft.content || '');
                    }}
                  >
                    <Edit3 size={14} className="mr-2" /> Edit Draft
                  </Button>
               </div>
            </Card>
          )}

          {/* Platform Status (Shown when Adaptation begins) */}
          {currentPhaseIndex >= 4 && (
            <div className="mt-8 space-y-4">
               <h3 className="text-lg font-bold text-[var(--color-text)]">Platform Previews</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['linkedin', 'twitter', 'email'].map((platform) => {
                    const post = posts.find(p => p.platform === platform);
                    const iconMap = { linkedin: Linkedin, twitter: Twitter, email: Mail };
                    const Icon = iconMap[platform as keyof typeof iconMap];

                    return (
                      <Card key={platform} className="flex flex-col gap-3 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon size={18} className="text-zinc-600" />
                            <span className="text-sm font-bold capitalize">{platform === 'twitter' ? 'X (Twitter)' : platform}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${
                            post?.status === 'published' ? 'bg-green-100 text-green-700' :
                            post?.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-zinc-100 text-zinc-500'
                          }`}>
                            {post?.status || 'Pending'}
                          </span>
                        </div>

                        <div className="flex-grow p-3 rounded-xl bg-zinc-50 border border-zinc-100 min-h-[100px] text-xs text-zinc-600 line-clamp-4">
                          {post?.content || 'Generating optimized content for this platform...'}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                           {platform === 'twitter' ? (
                             <Button variant="outline" size="sm" className="w-full text-[10px] h-8 border-green-200 text-green-700 hover:bg-green-50">
                               <Check size={12} className="mr-1" /> Mark as Posted
                             </Button>
                           ) : (
                             <>
                               <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-8"
                                disabled={!post || post.status === 'published'}
                              >
                                 <Calendar size={12} className="mr-1" /> Schedule
                               </Button>
                               <Button 
                                variant="primary" 
                                size="sm" 
                                className="flex-1 text-[10px] h-8"
                                disabled={!post || post.status === 'published'}
                                onClick={() => publishNowAction(id as string, platform as any, post!.id!)}
                              >
                                 <Send size={12} className="mr-1" /> Publish Now
                               </Button>
                             </>
                           )}
                        </div>
                      </Card>
                    );
                  })}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* REVISION MODAL */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold mb-2">Request Reconstructions</h3>
            <p className="text-sm text-zinc-500 mb-4">Tell us what to change about current drafts. For example: "More conversational", "Focus on ROI", etc.</p>
            
            <textarea
              className="w-full h-32 p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all mb-4"
              placeholder="What would you like changed? (Optional)"
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRevisionModal(false)}>Cancel</Button>
              <Button 
                variant="primary"
                onClick={async () => {
                   setIsUpdating(true);
                   await regenerateDraftsAction(id as string, revisionNote);
                   setShowRevisionModal(false);
                   setIsUpdating(false);
                }}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="animate-spin" size={16} /> : 'Regenerate Drafts'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingDraftId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Article Draft</h3>
              <button onClick={() => setEditingDraftId(null)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <XCircle size={20} className="text-zinc-400" />
              </button>
            </div>
            
            <textarea
              className="flex-grow p-4 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-mono leading-relaxed"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />

            <div className="flex gap-3 justify-end mt-4">
              <Button variant="outline" onClick={() => setEditingDraftId(null)}>Discard Changes</Button>
              <Button 
                variant="primary"
                onClick={async () => {
                  setIsUpdating(true);
                  await updateDraftContentAction(editingDraftId, editContent);
                  setEditingDraftId(null);
                  setIsUpdating(false);
                }}
                disabled={isUpdating}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
