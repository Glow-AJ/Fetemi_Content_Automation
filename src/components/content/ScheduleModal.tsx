'use client';

import React, { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, Globe, Upload, X, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledTime: string, selection: 'none' | 'draft' | 'custom', customImageUrl?: string) => void;
  loading?: boolean;
  platform?: string;
  draftImageUrl?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  platform = 'Post',
  draftImageUrl
}: ScheduleModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [imageSelection, setImageSelection] = useState<'none' | 'draft' | 'custom'>('draft');
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
    let publicUrl: string | undefined = undefined;

    if (imageSelection !== 'custom' || !selectedFile) {
      setUploading(false);
      onConfirm(selected.toISOString(), imageSelection);
      return;
    }

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
    onConfirm(selected.toISOString(), 'custom', publicUrl);
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

        {/* Image Selection Toggle */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Visual Selection</label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200">
             <button 
                onClick={() => setImageSelection('draft')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${imageSelection === 'draft' ? 'bg-white text-orange-600 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
             >
                Draft Image
             </button>
             <button 
                onClick={() => setImageSelection('custom')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${imageSelection === 'custom' ? 'bg-white text-orange-600 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
             >
                Custom
             </button>
             <button 
                onClick={() => setImageSelection('none')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${imageSelection === 'none' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
             >
                None
             </button>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-zinc-100 shadow-sm min-h-[140px] flex flex-col justify-center">
            {imageSelection === 'draft' && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-20 h-20 rounded-2xl bg-zinc-100 overflow-hidden shrink-0 shadow-inner border border-zinc-200">
                   {draftImageUrl ? (
                     <img src={draftImageUrl} alt="Draft" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <Globe size={24} />
                     </div>
                   )}
                </div>
                <div>
                   <p className="text-xs font-black text-zinc-900 uppercase tracking-tight mb-1">AI Asset</p>
                   <p className="text-[10px] text-zinc-500 leading-tight">Using the standard high-resolution graphic.</p>
                </div>
              </div>
            )}

            {imageSelection === 'none' && (
              <div className="text-center animate-in fade-in slide-in-from-right-2 duration-300 py-2">
                 <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
                    <X size={20} />
                 </div>
                 <p className="text-xs font-black text-zinc-900 uppercase tracking-tight leading-none mb-1">Text Only</p>
                 <p className="text-[10px] text-zinc-500">No media attachments.</p>
              </div>
            )}

            {imageSelection === 'custom' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[2/1] bg-zinc-200 border border-zinc-200 group">
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
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 hover:bg-orange-50/10 transition-all group"
                  >
                    <div className="p-2 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-orange-500 shadow-sm transition-all">
                       <Upload size={16} />
                    </div>
                    <p className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">Select Graphic</p>
                  </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
            )}
          </div>
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
