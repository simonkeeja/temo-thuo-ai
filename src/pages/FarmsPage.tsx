import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { BOTSWANA_DISTRICTS } from '@/types/types';

const PAGE_SIZE = 20;
// Roles that can register a new farm on behalf of any farmer
const CAN_REGISTER_FARM = ['admin', 'operations_team', 'extension_officer'];

export default function FarmsPage() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [myFarmerId, setMyFarmerId] = useState<string | null>(null);
  const [form, setForm] = useState({ farmer_id: '', farm_name: '', farm_type: '', farm_size_ha: '', district: '', village: '', physical_address: '', land_ownership_type: '', gps_lat: '', gps_lng: '' });
  const [saving, setSaving] = useState(false);

  const isFarmer = role === 'farmer';
  const canRegister = role && (CAN_REGISTER_FARM.includes(role) || isFarmer);

  // Resolve own farmer record so farmers only see their farms
  useEffect(() => {
    if (!isFarmer || !user) return;
    supabase.from('farmers').select('id').eq('profile_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setMyFarmerId(data.id);
    });
  }, [isFarmer, user]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('farms').select(`id, farm_code, farm_name, farm_type, farm_size_ha, district, village, status, created_at, farmers(id, farmer_code, profiles(full_name))`, { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    // Farmers only see their own farms
    if (isFarmer && myFarmerId) q = q.eq('farmer_id', myFarmerId);
    const { data, count } = await q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setRows(Array.isArray(data) ? data : []); setTotal(count ?? 0); setLoading(false);
  }, [page, statusFilter, isFarmer, myFarmerId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isFarmer) return; // farmers don't need the full list
    supabase.from('farmers').select('id, farmer_code, profiles(full_name)').limit(200).then(({ data }) => setFarmers(Array.isArray(data) ? data : []));
  }, [isFarmer]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.farm_code?.toLowerCase().includes(s) || r.farm_name?.toLowerCase().includes(s) || r.district?.toLowerCase().includes(s) || (r.farmers as any)?.profiles?.full_name?.toLowerCase().includes(s);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('farms').insert({
      farmer_id: form.farmer_id, farm_name: form.farm_name, farm_type: form.farm_type || null,
      farm_size_ha: form.farm_size_ha ? parseFloat(form.farm_size_ha) : null,
      district: form.district, village: form.village || null, physical_address: form.physical_address || null,
      land_ownership_type: form.land_ownership_type || null,
      gps_lat: form.gps_lat ? parseFloat(form.gps_lat) : null,
      gps_lng: form.gps_lng ? parseFloat(form.gps_lng) : null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Farm registered'); setShowNew(false);
    setForm({ farmer_id: '', farm_name: '', farm_type: '', farm_size_ha: '', district: '', village: '', physical_address: '', land_ownership_type: '', gps_lat: '', gps_lng: '' });
    load();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">{isFarmer ? 'My Farms' : 'Farm Management'}</h2>
            <p className="text-xs text-muted-foreground">{total.toLocaleString()} {isFarmer ? 'farms' : 'farms registered'}</p>
          </div>
          {canRegister && (
            <Button size="sm" className="gap-1.5" onClick={() => {
              // Pre-fill farmer_id for farmers registering their own farm
              if (isFarmer && myFarmerId) setForm(f => ({ ...f, farmer_id: myFarmerId }));
              setShowNew(true);
            }}><Plus size={14} />Register Farm</Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by farm name, code, district…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="pending_verification">Pending</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Farm ID','Farm Name','Type','Size (ha)','District','Farmer','Status','Registered'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No farms found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/farms/${r.id}`)}>
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.farm_code}</td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.farm_name}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.farm_type || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.farm_size_ha ?? '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.district}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farmers as any)?.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
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
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Register New Farm</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Farmers register under themselves — no dropdown needed */}
              {!isFarmer && (
                <div className="col-span-2 space-y-1"><Label>Farmer *</Label>
                  <Select value={form.farmer_id} onValueChange={v => setForm(f => ({ ...f, farmer_id: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select farmer" /></SelectTrigger>
                    <SelectContent>{farmers.map(f => <SelectItem key={f.id} value={f.id}>{(f.profiles as any)?.full_name || f.farmer_code}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-2 space-y-1"><Label>Farm Name *</Label><Input required value={form.farm_name} onChange={e => setForm(f => ({ ...f, farm_name: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Farm Type</Label>
                <Select value={form.farm_type} onValueChange={v => setForm(f => ({ ...f, farm_type: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="Cattle Ranch">Cattle Ranch</SelectItem><SelectItem value="Mixed Farm">Mixed Farm</SelectItem><SelectItem value="Crop Farm">Crop Farm</SelectItem><SelectItem value="Feedlot">Feedlot</SelectItem><SelectItem value="Poultry">Poultry</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Size (hectares)</Label><Input type="number" step="0.01" value={form.farm_size_ha} onChange={e => setForm(f => ({ ...f, farm_size_ha: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>District *</Label>
                <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>{BOTSWANA_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Village</Label><Input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>GPS Latitude</Label><Input type="number" step="0.0000001" value={form.gps_lat} onChange={e => setForm(f => ({ ...f, gps_lat: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>GPS Longitude</Label><Input type="number" step="0.0000001" value={form.gps_lng} onChange={e => setForm(f => ({ ...f, gps_lng: e.target.value }))} className="px-3" /></div>
              <div className="col-span-2 space-y-1"><Label>Land Ownership Type</Label>
                <Select value={form.land_ownership_type} onValueChange={v => setForm(f => ({ ...f, land_ownership_type: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="Owned">Owned</SelectItem><SelectItem value="Leased">Leased</SelectItem><SelectItem value="Communal">Communal</SelectItem><SelectItem value="Government">Government</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.farmer_id || !form.district}>{saving ? 'Saving…' : 'Register Farm'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
