'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FolderOpen, PlusCircle, CheckCircle2, Clock, 
  AlertCircle, ArrowRight, FileText, Link2, TrendingUp
} from 'lucide-react';

const stats = [
  { label: 'Total Projects', value: '124', icon: FolderOpen, change: null },
  { label: 'This Month', value: '18', icon: PlusCircle, change: null },
  { label: 'Published', value: '86', icon: CheckCircle2, change: null },
  { label: 'Awaiting Review', value: '3', icon: Clock, change: null, highlight: true },
];

const recentProjects = [
  { id: '1', title: 'The Future of AI in Content Marketing', status: 'reviewing', date: '3/24/2026', type: 'idea' },
  { id: '2', title: 'Sustainable Living Guide', status: 'published', date: '3/23/2026', type: 'url' },
  { id: '3', title: '10 Tips for Remote Team Management', status: 'drafting', date: '3/22/2026', type: 'idea' },
  { id: '4', title: 'Digital Marketing Trends 2026', status: 'seo_research', date: '3/22/2026', type: 'url' },
  { id: '5', title: 'How to Build a Personal Brand', status: 'published', date: '3/20/2026', type: 'idea' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50' },
  seo_research: { label: 'Researching', color: 'text-blue-600', bg: 'bg-blue-50' },
  drafting: { label: 'Drafting', color: 'text-purple-600', bg: 'bg-purple-50' },
  reviewing: { label: 'Reviewing', color: 'text-[var(--color-accent)]', bg: 'bg-orange-50' },
  adapting: { label: 'Adapting', color: 'text-blue-600', bg: 'bg-blue-50' },
  ready_to_publish: { label: 'Ready', color: 'text-green-600', bg: 'bg-green-50' },
  published: { label: 'Published', color: 'text-green-600', bg: 'bg-green-50' },
  failed: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50' },
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alert Banner */}
      <div className="bg-[var(--color-warning-soft)] border border-amber-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-[var(--color-warning)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">3 Projects Awaiting Review</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Your attention is needed to finalize drafts for publication.</p>
          </div>
        </div>
        <Link href="/projects?status=reviewing">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label} 
            className={`${stat.highlight ? 'border-[var(--color-warning)] bg-[var(--color-warning-soft)]' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.highlight ? 'bg-amber-100 text-[var(--color-warning)]' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]'}`}>
                <stat.icon size={20} />
              </div>
              {stat.highlight && <span className="text-xs font-medium text-[var(--color-warning)]">Action needed</span>}
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
          {recentProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="flex items-center gap-4 !py-4 group" hover>
                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                  {project.type === 'url' ? <Link2 size={18} /> : <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">{project.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig[project.status]?.bg || ''} ${statusConfig[project.status]?.color || ''}`}>
                      {statusConfig[project.status]?.label || project.status}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">{project.date}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors shrink-0" />
              </Card>
            </Link>
          ))}
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
