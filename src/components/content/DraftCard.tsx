'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Check } from 'lucide-react';

type Draft = {
  id: string;
  title: string;
  angle: string;
  content: string;
  wordCount: number;
  seoScore: number;
};

type DraftCardProps = {
  draft: Draft;
  onSelect: (id: string) => void;
  loading?: boolean;
};

function seoColor(score: number) {
  if (score >= 90) return { text: 'text-green-600', bg: 'bg-green-50' };
  if (score >= 70) return { text: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { text: 'text-red-600', bg: 'bg-red-50' };
}

export function DraftCard({ draft, onSelect, loading = false }: DraftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(draft.content);
  const sc = seoColor(draft.seoScore);

  return (
    <Card hover className="space-y-4">
      {/* Header */}
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
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text} shrink-0`}>{draft.seoScore}/100</span>
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full h-40 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm p-3 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 resize-none"
        />
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-4">{draft.content}</p>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border)]">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Done Editing' : 'Edit Draft'}
        </Button>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => onSelect(draft.id)}
          loading={loading}
        >
          <Check size={14} /> Select Draft
        </Button>
      </div>
    </Card>
  );
}
