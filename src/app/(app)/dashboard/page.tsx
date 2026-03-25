'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FolderOpen, PlusCircle, CheckCircle2, Clock, 
  AlertCircle, ArrowRight, FileText, Link2, TrendingUp, Loader2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    monthly: 0,
    published: 0,
    awaiting: 0
  });
  const [recentProjects, setRecentProjects] = useState<Job[]>([]);

  useEffect(() => {
    if (!user) return;

    async function fetchDashboardData() {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [totalRes, monthlyRes, publishedRes, awaitingRes, recentRes] = await Promise.all([
          supabase.from('content_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
          supabase.from('content_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', startOfMonth.toISOString()),
          supabase.from('content_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'published'),
          supabase.from('content_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'awaiting_review'),
          supabase.from('content_jobs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5)
        ]);

        setStats({
          total: totalRes.count || 0,
          monthly: monthlyRes.count || 0,
          published: publishedRes.count || 0,
          awaiting: awaitingRes.count || 0
        });
        setRecentProjects(recentRes.data || []);
      } catch (err) {
        console.error('[Dashboard] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    // Subscribe to Realtime changes
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_jobs', filter: `user_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
          <p className="text-sm text-[var(--color-text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: stats.total.toString(), icon: FolderOpen },
    { label: 'This Month', value: stats.monthly.toString(), icon: PlusCircle },
    { label: 'Published', value: stats.published.toString(), icon: CheckCircle2 },
    { label: 'Awaiting Review', value: stats.awaiting.toString(), icon: Clock, highlight: stats.awaiting > 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alert Banner */}
      {stats.awaiting > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{stats.awaiting} Projects Awaiting Review</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Your attention is needed to finalize drafts for publication.</p>
            </div>
          </div>
          <Link href="/projects?status=awaiting_review">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.label} 
            className={`${stat.highlight ? 'border-orange-200 bg-orange-50' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.highlight ? 'bg-orange-100 text-orange-600' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'}`}>
                <stat.icon size={20} />
              </div>
              {stat.highlight && <span className="text-xs font-medium text-orange-600">Action needed</span>}
            </div>
            <p className="text-3xl font-bold text-[var(--color-text)]">{stat.value}</p>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1 uppercase tracking-wide">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Recent Projects</h2>
          <Link href="/projects" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center gap-1 cursor-pointer transition-colors">
            View Archive <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="space-y-2">
          {recentProjects.length > 0 ? (
            recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="flex items-center gap-4 !py-4 group" hover>
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                    {project.input_type === 'url' ? <Link2 size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {project.original_input}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[project.status!]?.bg || 'bg-gray-50'} ${statusConfig[project.status!]?.color || 'text-gray-600'}`}>
                        {statusConfig[project.status!]?.label || project.status}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {new Date(project.created_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors shrink-0" />
                </Card>
              </Link>
            ))
          ) : (
            <Card className="py-12 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No projects created yet.</p>
              <Link href="/new" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Create your first project</Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Action */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center">
            <TrendingUp size={20} className="text-[var(--color-text-secondary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">Ready to create new content?</p>
            <p className="text-xs text-[var(--color-text-muted)]">Submit an idea or URL to start the automation pipeline.</p>
          </div>
        </div>
        <Link href="/new">
          <Button variant="primary" size="md">
            <PlusCircle size={16} /> New Content
          </Button>
        </Link>
      </Card>
    </div>
  );
}
