import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { AccountStatus } from '@/types/types';
import { BOTSWANA_DISTRICTS as DISTRICTS } from '@/types/types';

const PAGE_SIZE = 20;

// Roles that can see the full farmer list and register new farmers
const FULL_ACCESS_ROLES = ['admin', 'operations_team', 'extension_officer', 'veterinary_officer', 'ministry_official'];
const CAN_REGISTER = ['admin', 'operations_team', 'extension_officer'];

interface FarmerRow { id: string; farmer_code: string; omang_number?: string; created_at: string; profiles: { full_name?: string; email?: string; mobile?: string; district?: string; status: AccountStatus }; }

/* ── Farmer self-view: profile card only ── */
function FarmerSelfView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [farmerRec, setFarmerRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    supabase.from('farmers').select('id, farmer_code, omang_number, date_of_birth, gender, created_at, profiles(full_name, email, mobile, district, village, status)').eq('profile_id', user.id).maybeSingle().then(({ data }) => { setFarmerRec(data); setLoading(false); });
  }, [user]);
  if (loading) return <p className="text-xs text-muted-foreground p-6">Loading profile…</p>;
  if (!farmerRec) return <p className="text-xs text-muted-foreground p-6">No farmer record linked to your account. Please contact your administrator.</p>;
  const p = farmerRec.profiles as any;
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <User size={22} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{p?.full_name || '—'}</h2>
          <p className="text-xs text-muted-foreground font-mono">{farmerRec.farmer_code}</p>
        </div>
        <div className="ml-auto"><StatusBadge status={p?.status || 'active'} /></div>
      </div>
      <Card className="border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm">My Farmer Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs py-2">
          {[
            { label: 'Farmer ID', value: farmerRec.farmer_code },
            { label: 'Full Name', value: p?.full_name },
            { label: 'Email', value: p?.email },
            { label: 'Mobile', value: p?.mobile },
            { label: 'Omang / National ID', value: farmerRec.omang_number },
            { label: 'Gender', value: farmerRec.gender },
            { label: 'Date of Birth', value: farmerRec.date_of_birth ? new Date(farmerRec.date_of_birth).toLocaleDateString() : null },
            { label: 'District', value: p?.district },
            { label: 'Village', value: p?.village },
            { label: 'Registered', value: new Date(farmerRec.created_at).toLocaleDateString() },
          ].map(r => (
            <div key={r.label}>
              <p className="text-muted-foreground">{r.label}</p>
              <p className="font-medium">{r.value || '—'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => navigate('/farms')}>My Farms</Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/livestock')}>My Livestock</Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/crops')}>My Crops</Button>
        <Button size="sm" variant="outline" onClick={() => navigate('/profile')}>Edit Profile</Button>
      </div>
    </div>
  );
}

export default function FarmersPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  // Farmers see only their own profile card
  if (role === 'farmer') {
    return <AppLayout><FarmerSelfView /></AppLayout>;
  }

  return <FarmerAdminView role={role} navigate={navigate} />;
}

/* ── Full admin/officer list view ── */
function FarmerAdminView({ role, navigate }: { role: string | null | undefined; navigate: (path: string) => void }) {
  const [rows, setRows] = useState<FarmerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({ full_name: '', email: '', mobile: '', district: '', village: '', national_id: '', gender: '', dob: '', omang: '' });
  const [saving, setSaving] = useState(false);

  const canRegister = role && CAN_REGISTER.includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('farmers').select(`id, farmer_code, omang_number, created_at, profiles!inner(full_name, email, mobile, district, status)`, { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('profiles.status', statusFilter);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!error) { setRows(Array.isArray(data) ? (data as any) : []); setTotal(count ?? 0); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.farmer_code?.toLowerCase().includes(s) ||
      r.profiles?.full_name?.toLowerCase().includes(s) ||
      r.profiles?.email?.toLowerCase().includes(s) ||
      r.profiles?.mobile?.toLowerCase().includes(s) ||
      r.omang_number?.toLowerCase().includes(s);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const pwd = Math.random().toString(36).slice(-12) + 'Aa1!';
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: form.email, password: pwd, options: { data: { full_name: form.full_name } } });
      if (authErr) throw authErr;
      const uid = authData.user?.id;
      if (!uid) throw new Error('No user ID');
      await supabase.from('profiles').update({ full_name: form.full_name, mobile: form.mobile || null, national_id: form.national_id || null, district: form.district || null, village: form.village || null, role: 'farmer' }).eq('id', uid);
      await supabase.from('farmers').insert({ profile_id: uid, omang_number: form.omang || null, date_of_birth: form.dob || null, gender: form.gender || null });
      toast.success('Farmer registered successfully');
      setShowNew(false);
      setForm({ full_name: '', email: '', mobile: '', district: '', village: '', national_id: '', gender: '', dob: '', omang: '' });
      load();
    } catch (err: any) { toast.error(err.message || 'Failed to register farmer'); }
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">Farmer Management</h2>
            <p className="text-xs text-muted-foreground">{total.toLocaleString()} registered farmers</p>
          </div>
          {canRegister && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Register Farmer</Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, code, email, Omang…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending_verification">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Farmer ID', 'Full Name', 'Omang/National ID', 'Mobile', 'District', 'Status', 'Registered'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No farmers found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/farmers/${r.id}`)}>
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.farmer_code}</td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.omang_number || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.profiles?.mobile || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.profiles?.district || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.profiles?.status} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={12} /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}><ChevronRight size={12} /></Button>
          </div>
        </div>
      </div>

      {/* New Farmer Dialog — only for authorized roles */}
      {canRegister && (
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register New Farmer</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Full Name *</Label><Input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Mobile</Label><Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Omang / National ID</Label><Input value={form.omang} onChange={e => setForm(f => ({ ...f, omang: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>District</Label>
                  <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>{DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Village</Label><Input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} className="px-3" /></div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Register Farmer'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
