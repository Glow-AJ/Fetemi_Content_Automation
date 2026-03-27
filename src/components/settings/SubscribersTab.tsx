'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Users, Mail, Trash2, CheckCircle2, 
  Loader2, Plus, Upload, Info, FileSpreadsheet 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database';

type Subscriber = Database['public']['Tables']['subscribers']['Row'];

export function SubscribersTab() {
  const { user } = useAuth();
  const supabase = createClient();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showCsvGuide, setShowCsvGuide] = useState(false);

  // Add Form
  const [manualSubscribers, setManualSubscribers] = useState<{ email: string; name: string; date: string }[]>([
    { email: '', name: '', date: new Date().toISOString().split('T')[0] }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<number, string>>({});

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSubscribers();
  }, [user]);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
    if (data) setSubscribers(data);
    setLoading(false);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addMoreRow = () => {
    setManualSubscribers([...manualSubscribers, { email: '', name: '', date: new Date().toISOString().split('T')[0] }]);
  };

  const removeRow = (index: number) => {
    if (manualSubscribers.length > 1) {
      setManualSubscribers(manualSubscribers.filter((_, i) => i !== index));
      const newErrors = { ...formErrors };
      delete newErrors[index];
      setFormErrors(newErrors);
    }
  };

  const updateRow = (index: number, field: string, value: string) => {
    const newSubs = [...manualSubscribers];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setManualSubscribers(newSubs);
    
    if (field === 'email' && value && !validateEmail(value)) {
      setFormErrors({ ...formErrors, [index]: 'Invalid email format' });
    } else {
      const newErrors = { ...formErrors };
      delete newErrors[index];
      setFormErrors(newErrors);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validSubs = manualSubscribers.filter(s => s.email.trim() !== '');
    if (validSubs.length === 0) return;

    // Final validation check
    const errors: Record<number, string> = {};
    validSubs.forEach((s, i) => {
      if (!validateEmail(s.email)) {
        errors[i] = 'Invalid email';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsAdding(true);
    const toInsert = validSubs.map(s => ({
      email: s.email,
      name: s.name || null,
      user_id: user.id,
      status: 'active',
      subscribed_at: s.date ? new Date(s.date).toISOString() : new Date().toISOString()
    }));

    const { error } = await supabase.from('subscribers').insert(toInsert);
    setIsAdding(false);
    
    if (!error) {
      setShowAddModal(false);
      setManualSubscribers([{ email: '', name: '', date: new Date().toISOString().split('T')[0] }]);
      setFormErrors({});
      fetchSubscribers();
    } else {
      alert(error.message);
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !user) return;
    setIsUploading(true);
    setUploadSuccessCount(null);
    
    try {
      const text = await csvFile.text();
      const rows = text.split('\n').map(row => row.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      
      // Header detection
      const headers = rows[0].map(h => h.toLowerCase());
      const emailIndex = headers.indexOf('email');
      const nameIndex = headers.indexOf('name');
      const dateIndex = headers.indexOf('subscribed_at') > -1 ? headers.indexOf('subscribed_at') : headers.indexOf('date');

      if (emailIndex === -1) {
        alert("CSV must contain an 'email' column.");
        setIsUploading(false);
        return;
      }

      const newSubs = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i] || !rows[i][emailIndex]) continue;
        const subDate = dateIndex > -1 && rows[i][dateIndex] ? new Date(rows[i][dateIndex]) : new Date();
        newSubs.push({
          email: rows[i][emailIndex],
          name: nameIndex > -1 ? rows[i][nameIndex] : null,
          user_id: user.id,
          status: 'active' as const,
          subscribed_at: isNaN(subDate.getTime()) ? new Date().toISOString() : subDate.toISOString()
        });
      }

      if (newSubs.length > 0) {
        const BATCH_SIZE = 100;
        let insertedCount = 0;
        
        for (let i = 0; i < newSubs.length; i += BATCH_SIZE) {
          const batch = newSubs.slice(i, i + BATCH_SIZE);
          const { error } = await supabase.from('subscribers').insert(batch);
          if (error) {
            console.error('Batch error:', error);
            alert(`Error uploading batch: ${error.message}`);
            break;
          }
          insertedCount += batch.length;
        }
        
        if (insertedCount > 0) {
          setUploadSuccessCount(insertedCount);
          setTimeout(() => {
            setShowCsvModal(false);
            setCsvFile(null);
            setUploadSuccessCount(null);
            fetchSubscribers();
          }, 2000);
        }
      } else {
        alert("No valid subscribers found in CSV.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse CSV file.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeSubscriber = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to remove ${email} from your subscribers list?`)) {
      await supabase.from('subscribers').delete().eq('id', id);
      fetchSubscribers();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Newsletter Subscribers</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage your audience for email newsletters.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} className="flex-1 sm:flex-none">
              <Plus size={14} className="mr-1" /> Add
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCsvModal(true)} className="flex-1 sm:flex-none">
              <Upload size={14} className="mr-1" /> CSV
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">Loading subscribers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[600px] px-4 sm:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Subscribed Date</th>
                    <th className="text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-3">Status</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(sub => (
                    <tr key={sub.id} className="border-b last:border-0 border-[var(--color-border)] hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 text-sm font-medium text-[var(--color-text)]">{sub.email}</td>
                      <td className="py-3 text-sm text-[var(--color-text-secondary)]">{sub.name || <span className="text-zinc-400 italic">None</span>}</td>
                      <td className="py-3 text-sm text-[var(--color-text-muted)]">
                        {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {sub.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeSubscriber(sub.id, sub.email)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {subscribers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="max-w-xs mx-auto text-zinc-500">
                          <p className="text-sm font-medium mb-1">No subscribers yet</p>
                          <p className="text-xs">Add subscribers manually or upload a CSV file to get started.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Subscriber"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" loading={isAdding} onClick={handleManualAdd}>Add Subscriber</Button>
          </>
        }
      >
        <form onSubmit={handleManualAdd} className="space-y-6">
          <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-8 custom-scrollbar">
            {manualSubscribers.map((sub, index) => (
              <div key={index} className="relative p-6 bg-zinc-50 border border-zinc-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                {manualSubscribers.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeRow(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Email Address" 
                    type="email" 
                    required 
                    placeholder="example@mail.com" 
                    value={sub.email} 
                    onChange={e => updateRow(index, 'email', e.target.value)}
                    error={formErrors[index]}
                  />
                  <Input 
                    label="Full Name" 
                    type="text" 
                    placeholder="John Doe" 
                    value={sub.name} 
                    onChange={e => updateRow(index, 'name', e.target.value)} 
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Subscription Date" 
                      type="date" 
                      value={sub.date} 
                      onChange={e => updateRow(index, 'date', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            type="button"
            onClick={addMoreRow}
            className="w-full border-dashed border-2 py-6 hover:bg-zinc-50 hover:border-zinc-300 transition-all group"
          >
            <div className="flex flex-col items-center gap-1">
              <Plus size={20} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 group-hover:text-zinc-600">Add Another Record</span>
            </div>
          </Button>
        </form>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        title="Upload CSV"
        footer={uploadSuccessCount === null ? (
          <>
            <Button variant="secondary" onClick={() => setShowCsvModal(false)}>Cancel</Button>
            <Button variant="primary" loading={isUploading} disabled={!csvFile} onClick={handleCsvUpload}>Upload Subscribers</Button>
          </>
        ) : null}
      >
        {uploadSuccessCount !== null ? (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-[var(--color-text)] mb-2">Upload Complete</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Successfully added {uploadSuccessCount} subscribers.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50/50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100/50">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-xs uppercase tracking-wider">CSV Format Guide</p>
                <button 
                  type="button"
                  onClick={() => setShowCsvGuide(true)}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-bold text-xs"
                >
                  <Info size={12} /> View Details
                </button>
              </div>
              <p className="text-blue-700/80 leading-relaxed">
                Include a header row. Columns required: <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">email</code>. 
                Optional: <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">name</code>, <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">subscribed_at</code>.
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select CSV File</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-200 group-hover:bg-zinc-200/50 transition-colors flex items-center justify-center pointer-events-none">
                   <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="text-zinc-400" size={24} />
                      <span className="text-sm text-zinc-500 font-medium">{csvFile ? csvFile.name : 'Choose a file...'}</span>
                   </div>
                </div>
                <input 
                  type="file" 
                  accept=".csv" 
                  required 
                  onChange={e => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full h-32 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Nested Guide Modal */}
      <Modal
        isOpen={showCsvGuide}
        onClose={() => setShowCsvGuide(false)}
        title="CSV Detailed Guide"
        maxWidth="max-w-md"
        footer={<Button variant="primary" onClick={() => setShowCsvGuide(false)}>Got It</Button>}
      >
         <div className="space-y-4">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 font-mono text-[11px] leading-relaxed text-zinc-600">
               <p className="text-zinc-900 font-bold mb-1 underline">File Content Example:</p>
               <p>email, name, subscribed_at</p>
               <p>john@example.com, John Doe, 2024-03-25</p>
               <p>jane@smith.org, Jane Smith, 2024-01-10</p>
               <p>test@dummy.co, , 2023-12-01</p>
            </div>
            <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4">
               <li>Names are optional and can be left blank.</li>
               <li>Dates should be in **YYYY-MM-DD** format.</li>
               <li>If date is missing, today&apos;s date will be used.</li>
            </ul>
         </div>
      </Modal>
    </div>
  );
}
