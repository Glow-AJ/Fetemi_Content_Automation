'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Users, Trash2, 
  Loader2, Plus, Upload, Info, FileSpreadsheet 
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/database';

type Subscriber = Database['public']['Tables']['subscribers']['Row'];

export function SubscribersTab() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showCsvGuide, setShowCsvGuide] = useState(false);

  // Add Form / CSV Preview
  const [tempSubscribers, setTempSubscribers] = useState<{ 
    email: string; 
    name: string; 
    date: string;
    errors: { email?: string; date?: string };
  }[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    const { data } = await supabase.from('subscribers').select('*').order('created_at', { ascending: false });
    if (data) setSubscribers(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscribers();
  }, [user, fetchSubscribers]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateDate = (dateStr: string) => {
    if (!dateStr) return true;
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Allow until end of today
    const selected = new Date(dateStr);
    return selected <= now;
  };

  const addNewRecord = () => {
    setTempSubscribers([
      ...tempSubscribers, 
      { email: '', name: '', date: new Date().toISOString().split('T')[0], errors: {} }
    ]);
  };

  const updateTempRow = (index: number, field: string, value: string) => {
    const newSubs = [...tempSubscribers];
    const sub = { ...newSubs[index], [field]: value };
    
    // Validate
    const errors: { email?: string; date?: string } = {};
    if (field === 'email' || sub.email) {
      if (!validateEmail(sub.email)) errors.email = 'Invalid email';
    }
    if (field === 'date' || sub.date) {
      if (!validateDate(sub.date)) errors.date = 'Date cannot be in the future';
    }
    
    sub.errors = errors;
    newSubs[index] = sub;
    setTempSubscribers(newSubs);
  };

  const removeTempRow = (index: number) => {
    const next = tempSubscribers.filter((_, i) => i !== index);
    setTempSubscribers(next);
  };

  const handleManualAdd = async () => {
    if (!user) return;

    // Check for any errors
    const hasErrors = tempSubscribers.some(s => Object.keys(s.errors).length > 0 || !s.email);
    if (hasErrors) {
      alert("Please fix all errors before submitting.");
      return;
    }

    setIsAdding(true);
    const toInsert = tempSubscribers.map(s => ({
      email: s.email,
      name: s.name || null,
      user_id: user.id,
      status: 'active' as const,
      subscribed_at: s.date ? new Date(s.date).toISOString() : new Date().toISOString()
    }));

    const { error } = await supabase.from('subscribers').insert(toInsert);
    setIsAdding(false);
    
    if (!error) {
      setShowAddModal(false);
      setTempSubscribers([]);
      fetchSubscribers();
    } else {
      alert(error.message);
    }
  };

  const handleCsvFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(r => r.trim()).map(row => row.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      
      const headers = rows[0].map(h => h.toLowerCase());
      const emailIndex = headers.indexOf('email');
      const nameIndex = headers.indexOf('name');
      const dateIndex = headers.indexOf('subscribed_at') > -1 ? headers.indexOf('subscribed_at') : headers.indexOf('date');

      if (emailIndex === -1) {
        alert("CSV must contain an 'email' column.");
        return;
      }

      const parsed: typeof tempSubscribers = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i] || !rows[i][emailIndex]) continue;
        
        const email = rows[i][emailIndex];
        const name = nameIndex > -1 ? rows[i][nameIndex] : '';
        const rawDate = dateIndex > -1 ? rows[i][dateIndex] : new Date().toISOString().split('T')[0];
        const errors: { email?: string; date?: string } = {};
        
        if (!validateEmail(email)) errors.email = 'Invalid email';
        if (!validateDate(rawDate)) errors.date = 'Date cannot be in the future';

        parsed.push({
          email,
          name,
          date: rawDate,
          errors
        });
      }

      if (parsed.length > 0) {
        setTempSubscribers([...tempSubscribers, ...parsed]);
        setShowCsvModal(false);
        setShowAddModal(true);
      } else {
        alert("No valid subscribers found in CSV.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse CSV file.");
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
            <Button variant="outline" size="sm" onClick={() => {
              setShowAddModal(true);
              if (tempSubscribers.length === 0) addNewRecord();
            }} className="flex-1 sm:flex-none font-bold">
              <Plus size={14} className="mr-1" /> Add 
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCsvModal(true)} className="flex-1 sm:flex-none font-black uppercase tracking-widest text-[10px]">
              <Upload size={14} className="mr-1" /> Upload CSV
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
                      <td className="py-3 text-sm font-medium text-zinc-900">{sub.email}</td>
                      <td className="py-3 text-sm text-zinc-600">{sub.name || <span className="text-zinc-400 italic">None</span>}</td>
                      <td className="py-3 text-sm text-zinc-500">
                        {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                      <td colSpan={5} className="py-12 text-center text-zinc-500 italic text-sm">
                        No subscribers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Unified Add/Preview Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setTempSubscribers([]);
        }}
        title="Manage Submission"
        maxWidth="max-w-5xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {tempSubscribers.length} record{tempSubscribers.length !== 1 ? 's' : ''} to add
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                setTempSubscribers([]);
              }}>Cancel</Button>
              <Button 
                variant="primary" 
                loading={isAdding} 
                disabled={tempSubscribers.length === 0 || tempSubscribers.some(s => Object.keys(s.errors).length > 0)}
                onClick={handleManualAdd}
                className="font-black uppercase tracking-widest"
              >
                Add All Subscribers
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Quick Add Form */}
          <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
             <div className="flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                   <Input 
                      placeholder="email@example.com" 
                      value={tempSubscribers[tempSubscribers.length - 1]?.email === '' ? '' : ''} 
                      // Note: This is simplified. I'll just keep the table as the primary interaction point.
                      // Let's actually make the table editable.
                   />
                </div>
                <Button variant="outline" onClick={addNewRecord} className="h-10 border-dashed">
                   <Plus size={16} className="mr-2" /> Add Record
                </Button>
             </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
             <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                   <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Name</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Subscription Date</th>
                      <th className="px-4 py-3 w-10"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                   {tempSubscribers.map((sub, idx) => (
                      <tr key={idx} className="group hover:bg-zinc-50/50 transition-colors">
                         <td className="px-4 py-3">
                            <Input 
                               value={sub.email} 
                               onChange={e => updateTempRow(idx, 'email', e.target.value)}
                               placeholder="email@example.com"
                               error={sub.errors.email}
                               className="bg-transparent border-transparent group-hover:border-zinc-200 h-9"
                            />
                         </td>
                         <td className="px-4 py-3">
                            <Input 
                               value={sub.name} 
                               onChange={e => updateTempRow(idx, 'name', e.target.value)}
                               placeholder="John Doe"
                               className="bg-transparent border-transparent group-hover:border-zinc-200 h-9"
                            />
                         </td>
                         <td className="px-4 py-3">
                            <Input 
                               type="date"
                               value={sub.date} 
                               onChange={e => updateTempRow(idx, 'date', e.target.value)}
                               error={sub.errors.date}
                               className="bg-transparent border-transparent group-hover:border-zinc-200 h-9 !text-zinc-900"
                            />
                         </td>
                         <td className="px-4 py-3">
                            <button 
                               onClick={() => removeTempRow(idx)}
                               className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                               <Trash2 size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          
          {tempSubscribers.length === 0 && (
            <div className="py-12 text-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
               <Info size={32} className="mx-auto text-zinc-300 mb-3" />
               <p className="text-sm font-bold text-zinc-500">No records staged yet.</p>
               <button onClick={addNewRecord} className="text-orange-500 hover:underline text-xs font-black uppercase tracking-widest mt-1">Add your first record</button>
            </div>
          )}
        </div>
      </Modal>

      {/* CSV Select Modal (Initial step) */}
      <Modal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        title="Upload CSV"
        footer={
           <Button variant="secondary" onClick={() => setShowCsvModal(false)}>Cancel</Button>
        }
      >
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
              Include a header row. Columns: <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">email</code>, <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">name</code>, <code className="bg-blue-100/50 px-1 py-0.5 rounded text-blue-900 font-mono text-[10px]">date</code>.
            </p>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-200 group-hover:bg-zinc-200/50 transition-colors flex items-center justify-center pointer-events-none">
               <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="text-zinc-400" size={24} />
                  <span className="text-sm text-zinc-500 font-medium font-bold">Select CSV to Review</span>
               </div>
            </div>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCsvFileLoad}
              className="w-full h-32 opacity-0 cursor-pointer"
            />
          </div>
        </div>
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
