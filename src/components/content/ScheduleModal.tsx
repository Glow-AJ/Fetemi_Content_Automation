'use client';

import React, { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, Globe, Upload, X, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledTime: string, customImageUrl?: string) => void;
  loading?: boolean;
  platform?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  platform = 'Post'
}: ScheduleModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Max limit is 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG/PNG).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSchedule = async () => {
    if (!date || !time) return;
    const selected = new Date(`${date}T${time}`);
    if (selected < new Date()) {
      alert("You cannot schedule a post in the past.");
      return;
    }

    let publicUrl: string | undefined = undefined;

    if (selectedFile) {
      try {
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('platform_media')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('platform_media')
          .getPublicUrl(filePath);
        
        publicUrl = url;
      } catch (err: any) {
        console.error('Upload failed:', err);
        setUploadError('Upload failed. Please try again or skip image.');
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    onConfirm(selected.toISOString(), publicUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule ${platform}`} maxWidth="max-w-md">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Date</label>
            <div className="relative group">
              <input 
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Time</label>
            <div className="relative group">
              <input 
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-4 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-900 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Custom Image Upload Section */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 border-dashed">
          <div className="flex items-center justify-between mb-3">
             <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Custom Graphic (Optional)</label>
             <span className="text-[9px] font-bold text-zinc-400">MAX 5MB</span>
          </div>

          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-200 border border-zinc-200 group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={handleClearFile}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 hover:bg-orange-50/30 transition-all group"
            >
              <div className="p-2 rounded-full bg-white text-zinc-400 group-hover:text-orange-500 shadow-sm transition-all">
                 <Upload size={16} />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Upload Image</p>
            </button>
          )}

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

          {uploadError && (
             <div className="mt-3 flex items-center gap-2 text-red-600">
                <AlertCircle size={14} />
                <p className="text-[10px] font-bold uppercase tracking-tight">{uploadError}</p>
             </div>
          )}
        </div>

        <div className="p-4 bg-zinc-100/50 border border-zinc-200 rounded-2xl flex items-start gap-3">
          <div className="p-1.5 bg-white border border-zinc-200 rounded-xl text-zinc-400">
            <Globe size={14} />
          </div>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            Local scheduling: <span className="font-black text-zinc-900">Africa/Lagos (GMT+01:00)</span>
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1 font-bold h-12" onClick={onClose} disabled={loading || uploading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 font-black uppercase tracking-widest text-[10px] h-12" 
            onClick={handleSchedule}
            disabled={!date || !time || loading || uploading}
            loading={loading || uploading}
          >
            {uploading ? 'Uploading...' : 'Schedule Post'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
