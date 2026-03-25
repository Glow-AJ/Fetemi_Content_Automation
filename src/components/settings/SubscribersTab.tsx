'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Upload, X, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
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

  // Add Form
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail || !user) return;
    setIsAdding(true);
    const { error } = await supabase.from('subscribers').insert([{ 
      email: addEmail, 
      name: addName || null, 
      user_id: user.id,
      status: 'active' 
    }]);
    setIsAdding(false);
    if (!error) {
      setShowAddModal(false);
      setAddEmail('');
      setAddName('');
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
    
    // Simple CSV parser
    const text = await csvFile.text();
    const rows = text.split('\n').map(row => row.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    const headers = rows[0].map(h => h.toLowerCase());
    const emailIndex = headers.indexOf('email');
    const nameIndex = headers.indexOf('name');

    if (emailIndex === -1) {
      alert("CSV must contain an 'email' column.");
      setIsUploading(false);
      return;
    }

    const newSubs = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i] || !rows[i][emailIndex]) continue;
      newSubs.push({
        email: rows[i][emailIndex],
        name: nameIndex > -1 ? rows[i][nameIndex] : null,
        user_id: user.id,
        status: 'active' as const
      });
    }

    if (newSubs.length > 0) {
      const BATCH_SIZE = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < newSubs.length; i += BATCH_SIZE) {
        const batch = newSubs.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('subscribers').insert(batch);
        if (error) {
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
    setIsUploading(false);
  };

  const removeSubscriber = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to remove ${email} from your subscribers list?`)) {
      await supabase.from('subscribers').delete().eq('id', id);
      fetchSubscribers();
    }
  };

  return (
    <div className="space-y-6 relative">
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
                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
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

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[var(--color-text)]">Add Subscriber</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <Input label="Email Address" type="email" required placeholder="subscriber@example.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
              <Input label="Full Name (Optional)" type="text" placeholder="John Doe" value={addName} onChange={e => setAddName(e.target.value)} />
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isAdding || !addEmail}>
                  {isAdding ? <><Loader2 size={16} className="animate-spin mr-2" /> Adding...</> : 'Add Subscriber'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[var(--color-text)]">Upload CSV</h3>
              <button onClick={() => setShowCsvModal(false)} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {uploadSuccessCount !== null ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <p className="text-xl font-bold text-[var(--color-text)] mb-2">Upload Complete</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Successfully added {uploadSuccessCount} subscribers.</p>
              </div>
            ) : (
              <form onSubmit={handleCsvUpload} className="space-y-6">
                <div className="bg-blue-50/50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100/50">
                  <p className="font-semibold mb-1">CSV Format Guide:</p>
                  <p className="text-blue-700/80">Your CSV file must contain a header row. An <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-xs">email</code> column is required. An optional <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-xs">name</code> column is supported.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Select File</label>
                  <input 
                    type="file" 
                    accept=".csv" 
                    required 
                    onChange={e => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary-soft)] file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary-soft)]/80 cursor-pointer border border-zinc-200 rounded-xl bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowCsvModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={isUploading || !csvFile}>
                    {isUploading ? <><Loader2 size={16} className="animate-spin mr-2" /> Uploading...</> : 'Upload Subscribers'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
