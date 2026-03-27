'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, Globe } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledTime: string) => void;
  loading?: boolean;
  platform?: string;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  platform = 'Post'
}: ScheduleModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSchedule = () => {
    if (!date || !time) return;
    const isoString = new Date(`${date}T${time}`).toISOString();
    onConfirm(isoString);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule ${platform}`}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Date</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors">
                <Calendar size={18} />
              </div>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Time</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors">
                <Clock size={18} />
              </div>
              <input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-3">
          <div className="p-1.5 bg-white border border-zinc-200 rounded-lg text-zinc-400">
            <Globe size={14} />
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Scheduled relative to your timezone: <span className="font-bold text-zinc-900">Africa/Lagos (GMT+01:00)</span>
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1 font-bold" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 font-bold" 
            onClick={handleSchedule}
            disabled={!date || !time || loading}
            loading={loading}
          >
            Schedule
          </Button>
        </div>
      </div>
    </Modal>
  );
}
