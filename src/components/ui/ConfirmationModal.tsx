'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmText,
  cancelLabel = 'Cancel',
  variant = 'warning',
  loading = false
}: ConfirmationModalProps) {
  
  const colors = {
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-500',
      border: 'border-red-100',
      shadow: 'shadow-red-50',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-100'
    },
    warning: {
      bg: 'bg-orange-50',
      icon: 'text-orange-500',
      border: 'border-orange-100',
      shadow: 'shadow-orange-50',
      button: 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      border: 'border-blue-100',
      shadow: 'shadow-blue-50',
      button: 'bg-zinc-900 hover:bg-black shadow-zinc-200'
    },
    primary: {
      bg: 'bg-orange-50',
      icon: 'text-orange-500',
      border: 'border-orange-100',
      shadow: 'shadow-orange-50',
      button: 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'
    }
  }[variant];

  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertTriangle : Info;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-8 py-4">
        <div className={`p-8 rounded-[2rem] ${colors.bg} border ${colors.border} shadow-lg ${colors.shadow} flex flex-col items-center text-center animate-in zoom-in-95 duration-300`}>
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm">
            <Icon className={`w-8 h-8 ${colors.icon}`} strokeWidth={2.5} />
          </div>
          <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest leading-relaxed mb-3">
            {message}
          </h4>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-70">
            This action might be irreversible. Please confirm to proceed.
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            className="flex-1 h-14 font-black uppercase tracking-widest text-xs rounded-2xl" 
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant="primary" 
            loading={loading}
            className={`flex-1 h-14 font-black uppercase tracking-widest text-xs rounded-2xl text-white shadow-xl ${colors.button}`}
            onClick={onConfirm}
          >
            {confirmText || confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
