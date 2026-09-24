import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const DEVICE_TYPES = ['RFID Reader', 'GPS Tracker', 'Laptop', 'Tablet', 'Smartphone', 'Server', 'Router', 'UPS', 'Camera', 'Printer', 'Other'];

export default function DevicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState({ device_type: '', serial_number: '', manufacturer: '', model: '', purchase_date: '', warranty_expiry: '', assigned_to: '', farm_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('devices').select(`id, device_code, device_type, serial_number, manufacturer, model, purchase_date, warranty_expiry, status, firmware_version, created_at, farms(farm_name), profiles(full_name)`, { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, count } = await q.order('created_at', { ascending: false }).limit(50);
    setRows(Array.isArray(data) ? data : []); setTotal(count ?? 0); setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
    supabase.from('farms').select('id, farm_name').limit(200).then(({ data }) => setFarms(Array.isArray(data) ? data : []));
    supabase.from('profiles').select('id, full_name').limit(100).then(({ data }) => setProfiles(Array.isArray(data) ? data : []));
  }, [load]);

  const filtered = rows.filter(r => !search || r.device_code?.toLowerCase().includes(search.toLowerCase()) || r.device_type?.toLowerCase().includes(search.toLowerCase()) || r.serial_number?.toLowerCase().includes(search.toLowerCase()) || (r.farms as any)?.farm_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('devices').insert({
      device_type: form.device_type, serial_number: form.serial_number || null, manufacturer: form.manufacturer || null,
      model: form.model || null, purchase_date: form.purchase_date || null, warranty_expiry: form.warranty_expiry || null,
      assigned_to: form.assigned_to || null, farm_id: form.farm_id || null, notes: form.notes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Device registered'); setShowNew(false); load();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">Device Asset Management System</h2><p className="text-xs text-muted-foreground">{total} devices in inventory</p></div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Register Device</Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search devices…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="under_maintenance">Maintenance</SelectItem><SelectItem value="faulty">Faulty</SelectItem><SelectItem value="retired">Retired</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Device Code','Type','Manufacturer','Model','Serial #','Assigned To','Farm','Warranty Expiry','Status'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No devices found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.device_code}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.device_type}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.manufacturer || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.model || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{r.serial_number || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.profiles as any)?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farms as any)?.farm_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.warranty_expiry ? new Date(r.warranty_expiry).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Register Device Asset</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Device Type *</Label>
                <Select value={form.device_type} onValueChange={v => setForm(f => ({ ...f, device_type: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{DEVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Model</Label><Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="px-3" /></div>
              <div className="col-span-2 space-y-1"><Label>Serial Number</Label><Input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} className="px-3 font-mono" /></div>
              <div className="space-y-1"><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Warranty Expiry</Label><Input type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Assigned To</Label>
                <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Farm</Label>
                <Select value={form.farm_id} onValueChange={v => setForm(f => ({ ...f, farm_id: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.device_type}>{saving ? 'Saving…' : 'Register'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
