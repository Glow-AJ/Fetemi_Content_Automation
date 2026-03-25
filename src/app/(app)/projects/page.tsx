'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, FileText, Link2, ArrowRight, Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

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

const mockProjects = [
  { id: '1', title: 'The Future of AI in Content Marketing', status: 'awaiting_review', date: '2026-03-24', type: 'idea', linkedin: 'success', x: 'pending', email: 'pending' },
  { id: '2', title: 'Sustainable Living Guide', status: 'published', date: '2026-03-23', type: 'url', linkedin: 'success', x: 'success', email: 'success' },
  { id: '3', title: '10 Tips for Remote Team Management', status: 'drafting', date: '2026-03-22', type: 'idea', linkedin: 'pending', x: 'pending', email: 'pending' },
  { id: '4', title: 'Digital Marketing Trends 2026', status: 'seo_research', date: '2026-03-22', type: 'url', linkedin: 'pending', x: 'pending', email: 'pending' },
  { id: '5', title: 'How to Build a Personal Brand', status: 'published', date: '2026-03-20', type: 'idea', linkedin: 'success', x: 'failed', email: 'success' },
  { id: '6', title: 'Content Strategy for Startups', status: 'published', date: '2026-03-18', type: 'idea', linkedin: 'success', x: 'success', email: 'success' },
];

function PlatformIcon({ status }: { status: string }) {
  if (status === 'success') return <Check size={14} className="text-green-500" />;
  if (status === 'failed') return <X size={14} className="text-red-500" />;
  return <Clock size={14} className="text-[var(--color-text-muted)]" />;
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockProjects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Projects</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{mockProjects.length} total projects</p>
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
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-6 py-3">Project</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-6 py-3 hidden md:table-cell">Date</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-6 py-3 hidden lg:table-cell">LinkedIn</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-6 py-3 hidden lg:table-cell">X</th>
                <th className="text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Email</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors shrink-0">
                        {project.type === 'url' ? <Link2 size={14} /> : <FileText size={14} />}
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text)] truncate max-w-[250px]">{project.title}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig[project.status]?.bg || ''} ${statusConfig[project.status]?.color || ''}`}>
                      {statusConfig[project.status]?.label || project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] hidden md:table-cell">{project.date}</td>
                  <td className="px-6 py-4 text-center hidden lg:table-cell"><PlatformIcon status={project.linkedin} /></td>
                  <td className="px-6 py-4 text-center hidden lg:table-cell"><PlatformIcon status={project.x} /></td>
                  <td className="px-6 py-4 text-center hidden lg:table-cell"><PlatformIcon status={project.email} /></td>
                  <td className="px-6 py-4">
                    <Link href={`/projects/${project.id}`}>
                      <ArrowRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">No projects match your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">Showing {filtered.length} of {mockProjects.length}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled><ChevronLeft size={16} /></Button>
          <Button variant="primary" size="sm">1</Button>
          <Button variant="outline" size="sm" disabled><ChevronRight size={16} /></Button>
        </div>
      </div>
    </div>
  );
}
