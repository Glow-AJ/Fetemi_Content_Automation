'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Check, Clock, FileText, Linkedin, Twitter, Mail } from 'lucide-react';

const phases = [
  { key: 'submitted', label: 'Submitted', time: 'Mar 24, 2026 10:00 AM', done: true },
  { key: 'seo_research', label: 'SEO Research', time: 'Mar 24, 2026 10:01 AM', done: true },
  { key: 'drafting', label: 'Draft Generation', time: 'Mar 24, 2026 10:03 AM', done: true },
  { key: 'awaiting_review', label: 'Awaiting Review', time: null, done: false, current: true },
  { key: 'adapting', label: 'Platform Adaptation', time: null, done: false },
  { key: 'publishing', label: 'Publishing', time: null, done: false },
];

const mockDrafts = [
  { id: 1, title: 'How-To Guide: AI in Content Marketing', angle: 'Educational', wordCount: 1450, seoScore: 92 },
  { id: 2, title: 'Why AI Will Transform Content Creation', angle: 'Opinion', wordCount: 1320, seoScore: 85 },
  { id: 3, title: '5 Data Points: AI Content Marketing ROI', angle: 'Data-Driven', wordCount: 1280, seoScore: 78 },
];

function seoColor(score: number) {
  if (score >= 90) return { text: 'text-green-600', bg: 'bg-green-50' };
  if (score >= 70) return { text: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { text: 'text-red-600', bg: 'bg-red-50' };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4 cursor-pointer transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">The Future of AI in Content Marketing</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Project ID: {params.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Timeline */}
        <Card className="lg:col-span-1">
          <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Progress</h3>
          <div className="space-y-0">
            {phases.map((phase, i) => (
              <div key={phase.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    phase.done ? 'bg-green-100 text-green-600' : phase.current ? 'bg-orange-100 text-orange-600' : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]'
                  }`}>
                    {phase.done ? <Check size={14} /> : <Clock size={14} />}
                  </div>
                  {i < phases.length - 1 && <div className={`w-px h-8 ${phase.done ? 'bg-green-200' : 'bg-[var(--color-border)]'}`} />}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-medium ${phase.current ? 'text-[var(--color-text)]' : phase.done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>{phase.label}</p>
                  {phase.time && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{phase.time}</p>}
                  {phase.current && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 mt-1 inline-block">Current</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Drafts */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-semibold text-[var(--color-text)]">Select a Draft</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">Review the 3 generated drafts below and select one to proceed with platform adaptation.</p>

          {mockDrafts.map((draft) => {
            const sc = seoColor(draft.seoScore);
            return (
              <Card key={draft.id} hover className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--color-text)]">{draft.title}</h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{draft.angle} angle • {draft.wordCount} words</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{draft.seoScore}/100</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                  This draft explores how artificial intelligence is reshaping content marketing strategies. It covers key trends, practical applications, and actionable insights for marketing teams looking to leverage AI tools effectively...
                </p>
                <div className="flex justify-end">
                  <Button variant="primary" size="sm">Select This Draft</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Platform Previews (shown after adaptation) */}
      <Card>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Platform Previews</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'LinkedIn', icon: Linkedin, status: 'Pending' },
            { name: 'X (Twitter)', icon: Twitter, status: 'Pending' },
            { name: 'Email', icon: Mail, status: 'Pending' },
          ].map((p) => (
            <div key={p.name} className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <p.icon size={16} className="text-[var(--color-text-secondary)]" />
                <span className="text-sm font-medium text-[var(--color-text)]">{p.name}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">Content will appear here after draft selection and adaptation.</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mt-2 inline-block">{p.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
