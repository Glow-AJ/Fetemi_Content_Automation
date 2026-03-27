'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, Check, ChevronRight, Clock, Edit3, Eye, FileText, Globe, Link2, 
  Loader2, MessageSquare, MoreHorizontal, PenTool, Plus, RefreshCw, Send, 
  Trash2, Zap, AlertCircle, Share2, Image as ImageIcon, Calendar, Mail, Linkedin, Twitter
} from 'lucide-react';
import { SelectConfirmationModal } from '@/components/content/SelectConfirmationModal';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  selectDraftAction, 
  regenerateDraftsAction, 
  updateDraftContentAction,
  publishNowAction,
  deleteJobAction,
  retryIntakeAction,
  schedulePostAction,
  cancelScheduleAction,
  markAsPostedAction
} from '@/app/actions/content';
import { Modal } from '@/components/ui/Modal';
import { RichTextEditor } from '@/components/ui/Editor';
import type { Job, Draft, PlatformPost } from '@/types/database';


const phases = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'researching', label: 'Researching' },
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
  
  // UI States
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingSelect, setIsConfirmingSelect] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [editorContent, setEditorContent] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);
  const [jobError, setJobError] = useState<any>(null);
  const [isSelectingFromList, setIsSelectingFromList] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    async function fetchData() {
      const [jobRes, draftsRes, postsRes, errorRes] = await Promise.all([
        supabase.from('content_jobs').select('*').eq('id', id).single(),
        supabase.from('article_drafts').select('*').eq('job_id', id).order('created_at', { ascending: false }),
        supabase.from('platform_posts').select('*').eq('job_id', id),
        supabase.from('job_errors').select('*').eq('job_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      if (jobRes.data) setJob(jobRes.data);
      if (draftsRes.data) {
        setActiveDrafts(draftsRes.data.filter(d => d.status === 'generated' || d.status === 'regenerating' || d.selected));
        setRevisionHistory(draftsRes.data.filter(d => d.status === 'rejected'));
        const currentlySelected = draftsRes.data.find(d => d.selected);
        if (currentlySelected) {
          setSelectedDraft(currentlySelected);
          setEditorContent(currentlySelected.content || '');
        }
      }
      if (postsRes.data) setPosts(postsRes.data);
      if (errorRes.data) setJobError(errorRes.data);
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
              setEditorContent(currentlySelected.content || '');
            } else {
              setSelectedDraft(null);
              setEditorContent('');
            }
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_posts', filter: `job_id=eq.${id}` }, () => {
        supabase.from('platform_posts').select('*').eq('job_id', id).then(res => setPosts(res.data || []));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, user, supabase]);

  // Safeguard: Ensure editorContent is synced with selectedDraft
  useEffect(() => {
    if (selectedDraft && selectedDraft.content && (!editorContent || editorContent.trim().length === 0)) {
      setEditorContent(selectedDraft.content);
    }
  }, [selectedDraft?.id, selectedDraft?.content]);

  const handleSelectClick = (draft: Draft, fromList: boolean = false) => {
    setSelectedDraft(draft);
    setIsSelectingFromList(fromList);
    setIsConfirmingSelect(true);
  };

  const handleConfirmSelect = async () => {
    if (!selectedDraft || !job) return;
    setIsConfirmingSelect(false);
    const res = await selectDraftAction(job.id, selectedDraft.id);
    if (!res.success) {
      alert(res.error || 'Failed to select draft');
    }
  };

  const handleEdit = (draft: Draft) => {
    setSelectedDraft(draft);
    setEditorContent(draft.content || '');
    setViewMode('view'); // Default to view mode when opening
  };

  const saveContent = async (draftId: string) => {
    setIsUpdating(true);
    const res = await updateDraftContentAction(draftId, editorContent);
    setIsUpdating(false);
    if (!res.success) {
      alert(res.error || 'Failed to save changes');
    } else {
      setViewMode('view');
    }
  };

  const handleRetryIntake = async () => {
    setIsUpdating(true);
    const res = await retryIntakeAction(id as string);
    setIsUpdating(false);
    if (!res.success) alert(res.error || 'Failed to retry intake');
    else alert('Intake retry triggered!');
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This will remove all drafts and platform posts.')) return;
    setIsDeleting(true);
    const res = await deleteJobAction(id as string);
    setIsDeleting(false);
    if (res.success) router.push('/projects');
    else alert(res.error || 'Failed to delete project');
  };

  const handleRegenerateDrafts = async () => {
    if (!revisionTargetId && !selectedDraft) return;
    const targetId = revisionTargetId || selectedDraft?.id;
    if (!targetId) return;
    
    setIsUpdating(true);
    const res = await regenerateDraftsAction(id as string, targetId, revisionNote);
    setIsUpdating(false);
    
    if (res.success) {
      setShowRevisionModal(false);
      setRevisionNote('');
      setRevisionTargetId(null);
      if (selectedDraft) setSelectedDraft(null); // Return to list if in editor
    } else {
      alert(res.error || 'Failed to trigger regeneration');
    }
  };

  const handleMarkAsPosted = async (postId: string) => {
    if (!window.confirm('Are you sure you want to mark this as posted? This will stop any further automation for this platform.')) return;
    const res = await markAsPostedAction(postId);
    if (!res.success) alert(res.error || 'Failed to update status');
    else alert('Success! Post marked as published.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="text-sm text-zinc-500">Syncing project data...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <p className="text-zinc-500 mt-2">The project you are looking for does not exist or you don't have access.</p>
        <Button onClick={() => router.push('/projects')} className="mt-6" variant="outline">Back to Projects</Button>
      </div>
    );
  }

  // Logic Helpers
  const currentPhaseIndex = phases.findIndex(p => p.key === job.status);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div>
        <button onClick={() => router.push('/projects')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 mb-4 cursor-pointer transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-zinc-900 truncate flex items-center gap-3">
              {job.input_type === 'url' ? 'Source Content' : 'Project Idea'}
              <span className="text-[10px] font-black text-white bg-zinc-900 px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
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
              <span className="w-1 h-1 rounded-full bg-zinc-200 shrink-0" />
              <div className="text-xs text-zinc-400 truncate max-w-[300px] italic">
                {job.original_input}
              </div>
              <span className="w-1 h-1 rounded-full bg-zinc-200 shrink-0" />
              <span className="text-xs text-zinc-400 shrink-0">Started {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Pending'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(job.status === 'submitted' || job.status === 'failed') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryIntake}
                disabled={isUpdating}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <RefreshCw size={14} className={isUpdating ? 'mr-2 animate-spin' : 'mr-2'} /> 
                Retry Intake
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={14} className={isDeleting ? 'mr-2 animate-spin' : 'mr-2'} /> 
              Delete
            </Button>

            {job.status === 'awaiting_review' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRevisionModal(true)}
                disabled={(job.revision_count || 0) >= 3}
              >
                <RefreshCw size={14} className="mr-2" /> 
                Regenerate ({job.revision_count || 0}/3)
              </Button>
            )}
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-600 border border-orange-200 uppercase tracking-wider">
                {job.status?.replace('_', ' ') || 'Processing'}
              </span>
              {job.is_retry && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                  RETRY
                </span>
              )}
              {job.duplicate_warning && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                  POSSIBLE DUPLICATE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${!selectedDraft ? 'lg:grid-cols-4' : ''} gap-8 items-start`}>
        {/* Status Timeline - STICKY (Hide when draft is selected) */}
        {!selectedDraft && (
          <aside className="lg:col-span-1 sticky top-8 self-start transition-all animate-in slide-in-from-left duration-300">
            <Card className="border-none shadow-sm !bg-zinc-50/50 p-6">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8">Pipeline Status</h3>
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
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-zinc-900' : isDone ? 'text-zinc-500' : 'text-zinc-400'}`}>{phase.label}</p>
                    {isCurrent && <p className="text-[10px] font-bold text-orange-600 uppercase mt-0.5 tracking-tighter">In Progress</p>}
                    {isFailed && <p className="text-[10px] font-bold text-red-600 uppercase mt-0.5 tracking-tighter">Failed</p>}
                  </div>
                </div>
              );
            })}
            </div>
            </Card>
          </aside>
        )}

        {/* Drafts Section */}
        <div className={`${!selectedDraft ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-4 h-full`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-zinc-900">Article Drafts</h3>
          </div>

          {!selectedDraft ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeDrafts.length > 0 ? (
                activeDrafts.map((draft, i) => {
                  if (draft.status === 'regenerating') {
                    return (
                      <Card key={draft.id} className="py-12 text-center border-dashed border-2 bg-zinc-50 border-orange-200">
                        <Loader2 className="animate-spin mx-auto text-orange-400 mb-4" size={32} />
                        <p className="text-sm font-bold text-orange-600 uppercase tracking-widest">AI is regenerating this draft...</p>
                        <p className="text-xs text-zinc-400 mt-1 italic">Based on your feedback (Round #{draft.revision_round || 0})</p>
                      </Card>
                    );
                  }

                  const score = (draft.seo_validation_score as any)?.score || 0;
                  const sc = seoColor(score);
                  return (
                    <Card 
                      key={draft.id} 
                      onClick={() => handleEdit(draft)}
                      className={`relative border border-zinc-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col p-4 cursor-pointer ${draft.selected ? 'ring-2 ring-orange-500' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Draft #{activeDrafts.length - i}</p>
                            <p className="text-xs font-bold text-zinc-900 mt-1 line-clamp-1">{draft.angle || 'General Draft'}</p>
                          </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black ${sc.bg} ${sc.text} border border-current/10`}>
                           {score}%
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed mb-4 italic">
                          "{draft.content?.substring(0, 120)}..."
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <Zap size={10} />
                            {draft.word_count || 0}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                            <Clock size={10} />
                            Round {draft.revision_round || 0}
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs font-bold hover:bg-orange-50 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all font-sans"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectClick(draft, true);
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="py-20 text-center border-dashed border-2 bg-zinc-50 w-full col-span-full">
                  <Loader2 className="animate-spin mx-auto text-zinc-400 mb-4" size={32} />
                  <p className="text-sm font-medium text-zinc-500">Generating initial drafts...</p>
                </Card>
              )}
            </div>
          ) : (
            /* Selected Draft View */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
              {/* Editor Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedDraft(null)}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors group"
                  >
                    <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
                        Draft View
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        Round #{selectedDraft.revision_round || 0}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-300 border border-zinc-100 px-1.5 py-0.5 rounded ml-2">
                        {editorContent?.length || selectedDraft.content?.length || 0} chars
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900">{selectedDraft.angle || 'Article Draft'}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex items-center bg-zinc-100 p-1 rounded-lg mr-2">
                      <button 
                        onClick={() => setViewMode('view')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'view' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button 
                        onClick={() => setViewMode('edit')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                   </div>

                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="h-10 px-6 font-bold gap-2"
                    disabled={!selectedDraft}
                    onClick={() => selectedDraft && handleSelectClick(selectedDraft, false)}
                  >
                    <Zap size={16} />
                    Select & Adapt
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 min-h-0">
                {/* Content Area */}
                <div className="xl:col-span-3 flex flex-col min-h-0">
                   <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
                      {/* Featured Image */}
                      {selectedDraft.image_url && (
                        <div className="w-full h-80 bg-zinc-100 overflow-hidden border-b border-zinc-100 relative group">
                           <img src={selectedDraft.image_url} alt="Cover" className="w-full h-full object-cover" />
                           <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-white/50 text-[10px] font-bold text-zinc-900 flex items-center gap-2">
                              <ImageIcon size={14} />
                              Featured Image
                           </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                        {viewMode === 'view' ? (
                          <div className="max-w-3xl mx-auto">
                            <div className="prose prose-zinc prose-sm md:prose-base max-w-none prose-headings:font-black prose-p:leading-relaxed selection:bg-orange-100">
                              <ReactMarkdown>
                                {editorContent || selectedDraft.content || ''}
                              </ReactMarkdown>

                              {(!editorContent && !selectedDraft.content) && (
                                <div className="mt-8 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-center">
                                  <p className="text-sm text-zinc-400 font-medium italic">This draft has no content yet.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full">
                            <RichTextEditor 
                              content={editorContent} 
                              onChange={setEditorContent} 
                              editable={viewMode === 'edit'}
                            />
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                {/* Sidebar Info */}
                <div className="xl:col-span-1 space-y-6">
                  <Card className="border-none bg-zinc-50/50 p-6">
                     <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Draft Metrics</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-xs text-zinc-500 font-medium">Word Count</span>
                           <span className="text-sm font-bold text-zinc-900">{selectedDraft.word_count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs text-zinc-500 font-medium">SEO Score</span>
                           <div className={`px-2 py-0.5 rounded text-[10px] font-black ${seoColor((selectedDraft.seo_validation_score as any)?.score || 0).bg} ${seoColor((selectedDraft.seo_validation_score as any)?.score || 0).text}`}>
                              {(selectedDraft.seo_validation_score as any)?.score || 0}%
                           </div>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs text-zinc-500 font-medium">Readability</span>
                           <span className="text-xs font-bold text-zinc-900">{(selectedDraft.seo_validation_score as any)?.readability || 'Standard'}</span>
                        </div>
                     </div>
                  </Card>

                  <div className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl">
                     <div className="flex gap-3 items-start mb-4">
                        <div className="p-2 bg-orange-100 rounded-xl">
                           <MessageSquare className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-orange-900">Need changes?</p>
                           <p className="text-[10px] text-orange-700 leading-relaxed mt-0.5">Tell the AI what to improve. Max 3 rounds.</p>
                        </div>
                     </div>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="w-full bg-white hover:bg-orange-50 border-orange-100 text-orange-600 font-black h-9 text-xs"
                       onClick={() => {
                          setRevisionTargetId(selectedDraft.id);
                          setShowRevisionModal(true);
                       }}
                     >
                       Request Revision
                     </Button>
                  </div>
                </div>
              </div>

              {/* Botton Toolbar for Edit mode */}
              {viewMode === 'edit' && (
                <div className="mt-6 flex justify-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Button variant="ghost" className="font-bold text-zinc-500 font-sans" onClick={() => setViewMode('view')}>
                    Discard Edits
                  </Button>
                  <Button 
                    variant="primary" 
                    className="font-bold px-8 font-sans"
                    onClick={() => saveContent(selectedDraft.id)}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Job Errors Display */}
          {job.status === 'failed' && (jobError || job.error_message) && (
            <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl shadow-sm animate-in shake duration-500">
               <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl text-red-600">
                     <AlertCircle size={24} />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-red-900 font-bold uppercase tracking-tight text-xs mb-1">Execution Error</h4>
                     <p className="text-red-800 text-sm font-medium leading-relaxed">
                        {jobError?.error_description || job.error_message || 'An unexpected error occurred during content generation.'}
                     </p>
                     {jobError?.execution_url && (
                        <div className="mt-3">
                          <a 
                            href={jobError.execution_url} 
                            target="_blank" 
                            className="text-[10px] font-bold text-red-600 hover:outline rounded px-2 py-1 bg-red-100/50 inline-flex items-center gap-1 transition-all"
                          >
                             View n8n Debug Log <ArrowLeft size={10} className="rotate-180 ml-1" />
                          </a>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Revision History */}
          {revisionHistory.length > 0 && (
            <div className="mt-12 space-y-4">
               <div className="flex items-center gap-2 text-zinc-400">
                  <MessageSquare size={16} />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Revision History</h3>
               </div>
               <div className="space-y-4">
                  {revisionHistory.map((rev) => (
                    <Card key={rev.id} className="!bg-zinc-50 border-zinc-200 opacity-75 grayscale hover:grayscale-0 transition-all p-6">
                       <div className="flex items-center justify-between mb-3 text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                          <span>Round #{rev.revision_round || 0}</span>
                          <span>{new Date(rev.created_at || '').toLocaleDateString()}</span>
                       </div>
                       <div className="p-4 bg-white rounded-xl border border-zinc-100 text-xs text-zinc-500 italic mb-3 flex gap-2">
                          <MessageSquare size={14} className="shrink-0 mt-0.5 text-zinc-300" />
                          <span>&quot;{rev.manager_feedback || 'No feedback provided'}&quot;</span>
                       </div>
                       <p className="text-sm font-bold text-zinc-600 mb-2">{rev.angle}</p>
                       <div className="text-xs text-zinc-400 line-clamp-2 prose prose-xs">
                          <ReactMarkdown>{rev.content || ''}</ReactMarkdown>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {/* Platform Status (Shown when Adaptation begins) */}
          {(currentPhaseIndex >= 5 || job.status === 'adapting' || job.status === 'ready_to_publish' || job.status === 'published') && (
            <div className="mt-8 space-y-4">
               <h3 className="text-lg font-bold text-zinc-900">Platform Previews</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['linkedin', 'twitter', 'email'].map((platform) => {
                    const post = posts.find(p => p.platform === platform);
                    const iconMap = { linkedin: Linkedin, twitter: Twitter, email: Mail };
                    const Icon = iconMap[platform as keyof typeof iconMap];

                    return (
                      <Card key={platform} className="flex flex-col gap-3 group p-5">
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

                        <div className="flex-grow p-3 rounded-xl bg-zinc-50 border border-zinc-100 min-h-[120px] text-xs text-zinc-600 prose prose-xs leading-relaxed overflow-hidden">
                          {post?.content ? (
                            <ReactMarkdown>{post.content}</ReactMarkdown>
                          ) : (
                            <p className="italic text-zinc-400">Generating optimized content for this platform...</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                           {platform === 'twitter' ? (
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="w-full text-[10px] h-8 border-green-200 text-green-700 hover:bg-green-50 font-sans"
                               disabled={!post || post.status === 'published'}
                               onClick={() => handleMarkAsPosted(post!.id)}
                             >
                               <Check size={12} className="mr-1" /> Mark as Posted
                             </Button>
                           ) : (
                             <>
                               <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-[10px] h-8 font-sans"
                                disabled={!post || post.status === 'published'}
                                onClick={async () => {
                                  if (!post) return;
                                  const time = window.prompt('Enter schedule time (YYYY-MM-DD HH:MM):');
                                  if (time) {
                                    const res = await schedulePostAction(post.id, time);
                                    if (!res.success) alert(res.error || 'Failed to schedule');
                                    else alert('Post scheduled successfully!');
                                  }
                                }}
                              >
                                 <Calendar size={12} className="mr-1" /> {post?.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                               </Button>
                               <Button 
                                variant="primary" 
                                size="sm" 
                                className="flex-1 text-[10px] h-8 font-sans"
                                disabled={!post || post.status === 'published'}
                                onClick={async () => {
                                  const res = await publishNowAction(id as string, platform as any, post!.id);
                                  if (!res.success) alert(res.error || 'Failed to publish');
                                  else alert('Post published successfully!');
                                }}
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

      {/* Select Confirmation Modal */}
      {selectedDraft && (
        <SelectConfirmationModal
          isOpen={isConfirmingSelect}
          onClose={() => {
            setIsConfirmingSelect(false);
            if (isSelectingFromList) setSelectedDraft(null); // Reset if coming from list and cancelled
          }}
          onConfirm={handleConfirmSelect}
          onViewDraft={() => {
            setIsConfirmingSelect(false);
            handleEdit(selectedDraft);
          }}
          draftTitle={selectedDraft.angle || ''}
          isFromList={isSelectingFromList} 
        />
      )}

      {/* REVISION MODAL */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Request Revision"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="ghost" onClick={() => setShowRevisionModal(false)} className="font-bold">Cancel</Button>
            <Button 
              variant="primary"
              loading={isUpdating}
              disabled={!revisionNote.trim()}
              onClick={handleRegenerateDrafts}
              className="px-8 font-bold"
            >
              Start Revision
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">Tell us what to change about this draft. Be specific for better results (e.g. &quot;More professional tone&quot; or &quot;Focus on technical details&quot;).</p>
          <textarea
            className="w-full h-32 p-4 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-sans leading-relaxed"
            placeholder="Type your instructions here..."
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
          />
        </div>
      </Modal>
      
      {/* ORIGINAL INPUT MODAL */}
      <Modal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        title={job.input_type === 'url' ? 'Source URL' : 'Content Idea'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
            <p className="text-sm text-zinc-600 leading-relaxed font-sans whitespace-pre-wrap break-words">
              {job.original_input}
            </p>
          </div>
          {job.input_type === 'url' && (
            <a 
              href={job.original_input} 
              target="_blank" 
              className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:underline"
            >
              <Link2 size={14} />
              Open source link in new tab
            </a>
          )}
        </div>
      </Modal>

    </div>
  );
}
