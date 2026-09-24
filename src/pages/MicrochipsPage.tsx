import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PAGE_SIZE = 20;
const LIFECYCLE = ['manufactured','received','in_inventory','issued','activated','in_use','recovered','retired'];

export default function MicrochipsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ chip_code: '', batch_number: '', manufactured_date: '', expiry_date: '', location: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('microchips').select(`id, chip_code, batch_number, status, ear_tag_number, activated_at, recovered_at, created_at, animals(animal_code, species), farmers(farmer_code, profiles(full_name))`, { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, count } = await q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setRows(Array.isArray(data) ? data : []); setTotal(count ?? 0); setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.chip_code?.toLowerCase().includes(s) || r.batch_number?.toLowerCase().includes(s) || r.ear_tag_number?.toLowerCase().includes(s) || (r.animals as any)?.animal_code?.toLowerCase().includes(s) || (r.farmers as any)?.profiles?.full_name?.toLowerCase().includes(s);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('microchips').insert({ chip_code: form.chip_code, batch_number: form.batch_number || null, manufactured_date: form.manufactured_date || null, expiry_date: form.expiry_date || null, location: form.location || null, status: 'in_inventory' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Microchip registered'); setShowNew(false); setForm({ chip_code: '', batch_number: '', manufactured_date: '', expiry_date: '', location: '' }); load();
  };

  const lifecycleIdx = (status: string) => LIFECYCLE.indexOf(status);

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">Bio-Sentinel AI Microchip Management</h2>
            <p className="text-xs text-muted-foreground">{total.toLocaleString()} microchips in system</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Register Microchip</Button>
        </div>

        {/* Lifecycle overview */}
        <div className="flex gap-2 flex-wrap">
          {LIFECYCLE.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s === statusFilter ? 'all' : s); setPage(0); }}
              className={`px-3 py-1 text-xs rounded border transition-colors ${statusFilter === s ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent/50'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by chip code, batch, ear tag, animal…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Chip Code','Batch','Animal','Ear Tag','Farmer','Status','Activated','Registered'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No microchips found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.chip_code}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.batch_number || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.animals as any)?.animal_code || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.ear_tag_number || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farmers as any)?.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{r.activated_at ? new Date(r.activated_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={12} /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}><ChevronRight size={12} /></Button>
          </div>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Cpu size={16} />Register Microchip</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Chip Code *</Label><Input required placeholder="BSM-0000009" value={form.chip_code} onChange={e => setForm(f => ({ ...f, chip_code: e.target.value }))} className="px-3 font-mono" /></div>
              <div className="space-y-1"><Label>Batch Number</Label><Input value={form.batch_number} onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Manufactured Date</Label><Input type="date" value={form.manufactured_date} onChange={e => setForm(f => ({ ...f, manufactured_date: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="px-3" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Register'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
