'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, FileText, Link2, ArrowRight, Check, X, Clock, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { deleteJobAction } from '@/app/actions/content';
import type { Job } from '@/types/database';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50' },
  seo_research: { label: 'Researching', color: 'text-blue-600', bg: 'bg-blue-50' },
  drafting: { label: 'Drafting', color: 'text-purple-600', bg: 'bg-purple-50' },
  awaiting_review: { label: 'Reviewing', color: 'text-orange-600', bg: 'bg-orange-50' },
  adapting: { label: 'Adapting', color: 'text-blue-600', bg: 'bg-blue-50' },
  ready_to_publish: { label: 'Ready', color: 'text-green-600', bg: 'bg-green-50' },
  published: { label: 'Published', color: 'text-green-600', bg: 'bg-green-50' },
  failed: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50' },
};

function PlatformIcon({ status }: { status: string | null | undefined }) {
  if (status === 'published' || status === 'success') return <Check size={14} className="text-green-500" />;
  if (status === 'failed') return <X size={14} className="text-red-500" />;
  if (status === 'scheduled') return <Clock size={14} className="text-blue-500" />;
  return <Clock size={14} className="text-[var(--color-text-muted)]" />;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchProjects() {
      try {
        let query = supabase.from('content_jobs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('[Projects] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();

    const channel = supabase
      .channel('projects-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_jobs', filter: `user_id=eq.${user.id}` }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, statusFilter, supabase]);

  const filtered = projects.filter(p => 
    (p.original_input || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Projects</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{projects.length} total projects</p>
        </div>
        <Link href="/new">
          <Button variant="primary">+ New Content</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--color-text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Projects Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-gray-500">
                <th className="text-left text-xs font-semibold uppercase tracking-wide px-6 py-3">Project</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide px-6 py-3 hidden md:table-cell">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors shrink-0">
                        {project.input_type === 'url' ? <Link2 size={14} /> : <FileText size={14} />}
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)] truncate max-w-[250px]">{project.original_input}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${statusConfig[project.status!]?.bg || 'bg-gray-50'} ${statusConfig[project.status!]?.color || 'text-gray-600'}`}>
                        {statusConfig[project.status!]?.label || project.status}
                      </span>
                      {project.is_retry && (
                        <span className="text-[10px] text-blue-600 font-bold px-2 py-0.5 rounded bg-blue-100 border border-blue-200">
                          RETRY
                        </span>
                      )}
                      {project.duplicate_warning && (
                        <span className="text-[10px] text-orange-600 font-bold px-2 py-0.5 rounded bg-orange-100 border border-orange-200">
                          DUPLICATE WARNING
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] hidden md:table-cell">
                    {new Date(project.created_at!).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link href={`/projects/${project.id}`}>
                      <ArrowRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">No projects found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-bg-card)] rounded-xl shadow-[var(--shadow-xl)] w-full max-w-sm p-6 animate-scale-in border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">Delete Project?</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Are you sure you want to delete this project? This will permanently remove all drafts, posts, and related data. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="!bg-red-600 hover:!bg-red-700 !text-white border-none"
                onClick={async () => {
                  try {
                    await deleteJobAction(projectToDelete);
                    setProjectToDelete(null);
                  } catch (err) {
                    console.error("Failed to delete project:", err);
                    alert("Failed to delete project. Please try again.");
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
