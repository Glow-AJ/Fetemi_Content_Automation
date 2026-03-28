'use client';

import React, { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Eye, Rocket, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customImageUrl?: string) => void;
  onViewContent?: () => void;
  platform: 'linkedin' | 'email' | 'newsletter';
  isOverview?: boolean;
  loading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function PublishConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onViewContent,
  platform,
  isOverview = false,
  loading = false
}: PublishConfirmModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const platformName = platform === 'email' ? 'Newsletter' : platform.charAt(0).toUpperCase() + platform.slice(1);

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

  const handleConfirmInternal = async () => {
    if (!selectedFile) {
      onConfirm();
      return;
    }

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('platform_media')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('platform_media')
        .getPublicUrl(filePath);

      onConfirm(publicUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again or use default image.');
    } finally {
      setUploading(false);
    }
  };

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

        {/* Custom Image Selection Section */}
        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 border-dashed">
          {!showUpload ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Image Selection</p>
                <div className="px-2 py-0.5 rounded bg-green-100/50 text-green-600 text-[9px] font-bold uppercase tracking-tighter">System Image Detected</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-zinc-100 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                    <ImageIcon size={16} />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 uppercase tracking-tight">Use Draft Image</p>
                </div>
                <button 
                  onClick={() => setShowUpload(true)}
                  className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest px-3 py-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all"
                >
                  Change to Custom
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Custom Graphic</label>
                 <button 
                  onClick={() => {
                    setShowUpload(false);
                    handleClearFile();
                  }}
                  className="text-[9px] font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-widest"
                 >
                   Back to System Image
                 </button>
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
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 hover:bg-orange-50/30 transition-all group"
                >
                  <div className="p-3 rounded-full bg-white text-zinc-400 group-hover:text-orange-500 shadow-sm transition-all">
                     <Upload size={20} />
                  </div>
                  <p className="text-xs font-bold text-zinc-50 group-hover:text-zinc-600">Click to upload custom image</p>
                  <p className="text-[9px] font-bold text-zinc-400">MAX 5MB</p>
                </button>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />

              {uploadError && (
                 <div className="mt-3 flex items-center gap-2 text-red-600">
                    <AlertCircle size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-tight">{uploadError}</p>
                 </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-zinc-600 leading-relaxed font-medium">
            Confirming this will trigger the n8n automation for immediate delivery on {platformName}.
          </p>
          
          {isOverview && (
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-start gap-3">
              <AlertCircle size={16} className="text-zinc-400 mt-0.5" />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider leading-normal">
                Reviewing content in the workspace first is highly recommended.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {isOverview && onViewContent && (
            <Button 
              variant="outline" 
              onClick={onViewContent}
              disabled={loading || uploading}
              className="w-full h-12 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border-zinc-200"
            >
              <Eye size={14} /> View Content First
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={onClose}
              disabled={loading || uploading}
              className="flex-1 h-12 font-bold"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirmInternal}
              loading={loading || uploading}
              className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100"
            >
              {uploading ? 'Uploading...' : 'Confirm & Publish'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
