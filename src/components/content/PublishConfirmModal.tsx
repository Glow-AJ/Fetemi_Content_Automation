'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Eye, Rocket, X } from 'lucide-react';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onViewContent?: () => void;
  platform: 'linkedin' | 'email' | 'newsletter';
  isOverview?: boolean;
  loading?: boolean;
}

export function PublishConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onViewContent,
  platform,
  isOverview = false,
  loading = false
}: PublishConfirmModalProps) {
  const platformName = platform === 'email' ? 'Newsletter' : platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Publication"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0 animate-pulse">
            <Rocket size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-orange-900 uppercase tracking-widest">Ready to go?</p>
            <p className="text-xs text-orange-700 font-medium">This will send your {platformName} content to the production queue.</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-zinc-600 leading-relaxed">
            Are you sure you want to publish this content now? This action will trigger the n8n automation for immediate delivery.
          </p>
          
          {isOverview && (
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-start gap-3">
              <AlertCircle size={16} className="text-zinc-400 mt-0.5" />
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-normal">
                You are currently in overview mode. We recommend reviewing the content in the workspace before publishing.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isOverview && onViewContent && (
            <Button 
              variant="outline" 
              onClick={onViewContent}
              disabled={loading}
              className="w-full h-12 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
            >
              <Eye size={14} /> View Content First
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 font-bold"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={onConfirm}
              loading={loading}
              className="flex-1 h-12 font-black uppercase tracking-widest text-[10px]"
            >
              Confirm & Publish
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
