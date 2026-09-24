import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['Mobile Money', 'Debit Card', 'Credit Card', 'EFT', 'Bank Transfer'];
// Roles that can see ALL payments and record new ones
const FULL_ACCESS_ROLES = ['admin', 'financial_officer', 'operations_team'];

export default function PaymentsPage() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState({ payee_id: '', amount: '', payment_method: '', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const hasFullAccess = role && FULL_ACCESS_ROLES.includes(role);
  const isFarmer = role === 'farmer';

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('payments').select(
      `id, transaction_code, amount, currency, payment_method, status, reference, created_at,
       payer:profiles!payments_payer_id_fkey(full_name),
       payee:profiles!payments_payee_id_fkey(full_name)`,
      { count: 'exact' }
    );
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    // Farmers only see their own transactions (as payer)
    if (isFarmer && user) q = q.eq('payer_id', user.id);
    const { data, count } = await q.order('created_at', { ascending: false }).limit(50);
    setRows(Array.isArray(data) ? data : []); setTotal(count ?? 0); setLoading(false);
  }, [statusFilter, isFarmer, user]);

  useEffect(() => {
    load();
    // Only privileged roles need the full profiles list for payee selection
    if (hasFullAccess) {
      supabase.from('profiles').select('id, full_name, role').limit(100).then(({ data }) => setProfiles(Array.isArray(data) ? data : []));
    }
  }, [load, hasFullAccess]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.transaction_code?.toLowerCase().includes(s) || r.reference?.toLowerCase().includes(s) || (r.payer as any)?.full_name?.toLowerCase().includes(s);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('payments').insert({ payer_id: user!.id, payee_id: form.payee_id || null, amount: parseFloat(form.amount), currency: 'BWP', payment_method: form.payment_method || null, reference: form.reference || null, notes: form.notes || null, status: 'pending' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Payment recorded'); setShowNew(false); setForm({ payee_id: '', amount: '', payment_method: '', reference: '', notes: '' }); load();
  };

  const totalSuccessful = rows.filter(r => r.status === 'successful').reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">{isFarmer ? 'My Transactions' : 'Payment Management'}</h2>
            <p className="text-xs text-muted-foreground">{total} transactions · BWP {totalSuccessful.toLocaleString()} successful</p>
          </div>
          {hasFullAccess && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Record Payment</Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by code, reference, payer…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="successful">Successful</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="refunded">Refunded</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Transaction Code','Payer','Payee','Amount (BWP)','Method','Reference','Status','Date'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No transactions found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.transaction_code}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.payer as any)?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.payee as any)?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 font-mono whitespace-nowrap">{r.amount?.toLocaleString()}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.payment_method || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.reference || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasFullAccess && (
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Payee</Label>
                  <Select value={form.payee_id} onValueChange={v => setForm(f => ({ ...f, payee_id: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select payee" /></SelectTrigger>
                    <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Amount (BWP) *</Label><Input type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label>Reference</Label><Input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} className="px-3" /></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.amount}>{saving ? 'Saving…' : 'Record'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
