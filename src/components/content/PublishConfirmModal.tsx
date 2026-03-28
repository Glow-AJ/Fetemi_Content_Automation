'use client';

import React, { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Eye, Rocket, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: 'none' | 'draft' | 'custom', customImageUrl?: string) => void;
  onViewContent?: () => void;
  platform: 'linkedin' | 'email' | 'newsletter';
  isOverview?: boolean;
  loading?: boolean;
  draftImageUrl?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function PublishConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onViewContent,
  platform,
  isOverview = false,
  loading = false,
  draftImageUrl
}: PublishConfirmModalProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageSelection, setImageSelection] = useState<'none' | 'draft' | 'custom'>('draft');
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
    if (imageSelection !== 'custom' || !selectedFile) {
      onConfirm(imageSelection);
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

      onConfirm('custom', publicUrl);
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
                None (Text)
             </button>
          </div>

          {/* Contextual UI based on selection */}
          <div className="p-4 rounded-3xl bg-white border border-zinc-100 shadow-sm min-h-[140px] flex flex-col justify-center">
            {imageSelection === 'draft' && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-24 h-24 rounded-2xl bg-zinc-100 overflow-hidden shrink-0 shadow-inner border border-zinc-200">
                   {draftImageUrl ? (
                     <img src={draftImageUrl} alt="Draft" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <ImageIcon size={24} />
                     </div>
                   )}
                </div>
                <div>
                   <p className="text-xs font-black text-zinc-900 uppercase tracking-tight mb-1">Standard AI Asset</p>
                   <p className="text-[10px] text-zinc-500 leading-relaxed">Using the high-resolution image generated during the SEO & Drafting phase.</p>
                </div>
              </div>
            )}

            {imageSelection === 'none' && (
              <div className="text-center animate-in fade-in slide-in-from-right-2 duration-300 py-2">
                 <div className="mx-auto w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
                    <X size={20} />
                 </div>
                 <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">Pure Text Publication</p>
                 <p className="text-[10px] text-zinc-500">No media will be attached to this post on {platformName}.</p>
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
                    <div className="p-3 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-orange-500 shadow-sm transition-all">
                       <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-zinc-900 uppercase tracking-tight text-center">Upload Post Graphic</p>
                      <p className="text-[9px] font-bold text-zinc-400 text-center">JPG, PNG • MAX 5MB</p>
                    </div>
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                />
              </div>
            )}
          </div>
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
