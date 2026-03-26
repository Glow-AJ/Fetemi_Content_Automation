'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, Eye } from 'lucide-react';

interface SelectConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onViewDraft?: () => void;
  draftTitle?: string;
  isFromList?: boolean;
}

export function SelectConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onViewDraft,
  draftTitle,
  isFromList = false
}: SelectConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Draft Selection">
      <div className="space-y-6">
        <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <div className="p-2 bg-orange-100 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-900">Important Decision</p>
            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
              Once you select this draft for platform adaptation, the other drafts will be locked. 
              You will not be able to go back and revise them.
            </p>
          </div>
        </div>

        <div className="px-1">
          <p className="text-sm text-zinc-600">
            Are you sure you want to proceed with:
          </p>
          <p className="text-sm font-bold text-zinc-900 mt-1 italic">
            "{draftTitle || 'this article draft'}"
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            variant="primary" 
            className="w-full justify-between group" 
            onClick={onConfirm}
          >
            <span>Confirm & Start Adaptation</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>

          {isFromList && onViewDraft && (
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={onViewDraft}
            >
              <Eye size={18} />
              Review Draft Details First
            </Button>
          )}

          <Button 
            variant="ghost" 
            className="w-full text-zinc-400 hover:text-zinc-600" 
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
