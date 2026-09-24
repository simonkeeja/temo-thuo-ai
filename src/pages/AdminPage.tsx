import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Shield, Settings, Activity, FileText, Lock,
  UserPlus, Search, RefreshCw, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/common/StatusBadge';
import StatCard from '@/components/common/StatCard';
import { toast } from 'sonner';
import type { UserRole } from '@/types/types';

const ROLES: UserRole[] = [
  'farmer', 'veterinary_officer', 'extension_officer', 'feedlot_operator',
  'abattoir_officer', 'insurance_officer', 'financial_officer',
  'ministry_official', 'admin', 'operations_team'
];

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer', veterinary_officer: 'Veterinary Officer',
  extension_officer: 'Extension Officer', feedlot_operator: 'Feedlot Operator',
  abattoir_officer: 'Abattoir Officer', insurance_officer: 'Insurance Officer',
  financial_officer: 'Financial Officer', ministry_official: 'Ministry Official',
  admin: 'System Administrator', operations_team: 'Operations Team',
};

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [stats, setStats] = useState({ total: 0, active: 0, farmers: 0, admins: 0 });

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: '' as UserRole | '', phone: ''
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('id, full_name, email, role, phone, status, created_at', { count: 'exact' });
    if (roleFilter !== 'all') q = q.eq('role', roleFilter);
    const { data, count } = await q.order('created_at', { ascending: false }).limit(100);
    const list = Array.isArray(data) ? data : [];
    setUsers(list);
    setStats({
      total: count ?? 0,
      active: list.filter(u => u.status === 'active').length,
      farmers: list.filter(u => u.role === 'farmer').length,
      admins: list.filter(u => u.role === 'admin').length,
    });
    setLoading(false);
  }, [roleFilter]);

  const loadAuditLogs = useCallback(async () => {
    const { data } = await supabase.from('audit_logs').select('id, action, table_name, record_id, performed_by, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(50);
    setAuditLogs(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (tab === 'audit') loadAuditLogs(); }, [tab, loadAuditLogs]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.role?.toLowerCase().includes(s);
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.role) { toast.error('Email, password, and role are required'); return; }
    setSaving(true);
    // Create Supabase auth user via admin API (sign-up method available on client)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: form.role } }
    });
    if (authErr) { toast.error(authErr.message); setSaving(false); return; }
    // Profile is created by trigger; update role/phone explicitly
    if (authData.user) {
      await supabase.from('profiles').update({ role: form.role, phone: form.phone || null, full_name: form.full_name || null }).eq('id', authData.user.id);
    }
    setSaving(false);
    toast.success(`User created: ${form.email}`);
    setShowNew(false);
    setForm({ full_name: '', email: '', password: '', role: '', phone: '' });
    loadUsers();
  };

  const updateUserStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`User ${status === 'active' ? 'activated' : 'suspended'}`);
    loadUsers();
  };

  const updateUserRole = async (id: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Role updated');
    loadUsers();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2"><Settings size={18} className="text-accent" />Administration Portal</h2>
            <p className="text-xs text-muted-foreground">System administration, user management, and audit trails</p>
          </div>
          {tab === 'users' && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><UserPlus size={14} />Create User</Button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={stats.total} icon={<Users size={14} />} />
          <StatCard label="Active Users" value={stats.active} icon={<Activity size={14} />} accent />
          <StatCard label="Farmers" value={stats.farmers} icon={<Users size={14} />} />
          <StatCard label="Admins" value={stats.admins} icon={<Lock size={14} />} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="users" className="text-xs gap-1.5"><Users size={12} />User Management</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs gap-1.5"><FileText size={12} />Audit Log</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1.5"><Settings size={12} />System Settings</TabsTrigger>
          </TabsList>

          {/* ── USERS ── */}
          <TabsContent value="users" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, email, role…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={v => setRoleFilter(v)}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={loadUsers}><RefreshCw size={12} />Refresh</Button>
            </div>

            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Name', 'Email', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
                  ) : filtered.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{u.full_name || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Select defaultValue={u.role} onValueChange={v => updateUserRole(u.id, v as UserRole)}>
                          <SelectTrigger className="h-6 text-xs border-transparent hover:border-border w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{u.phone || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={u.status || 'active'} /></td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {u.status !== 'suspended' ? (
                          <Button variant="outline" size="sm" className="h-6 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => updateUserStatus(u.id, 'suspended')}>Suspend</Button>
                        ) : (
                          <Button variant="outline" size="sm" className="h-6 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => updateUserStatus(u.id, 'active')}>Activate</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── AUDIT LOG ── */}
          <TabsContent value="audit" className="space-y-3">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Timestamp', 'Performed By', 'Action', 'Table', 'Record ID'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit logs found</td></tr>
                  ) : auditLogs.map(l => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(l.profiles as any)?.full_name || l.performed_by?.slice(0, 8) || 'System'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">{l.action}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">{l.table_name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">{l.record_id?.slice(0, 12) || '—'}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── SETTINGS ── */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Platform Information</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {[
                    { label: 'Platform Name', value: 'Temo-Thuo AI' },
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Organization', value: 'SY-TECH AI SYSTEMS' },
                    { label: 'Prepared By', value: 'Simon Vevongaune Keeja' },
                    { label: 'Country', value: 'Botswana' },
                    { label: 'Environment', value: 'Production' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between gap-4 border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium text-right">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Security Settings</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {[
                    { label: 'Authentication', value: 'Email + OTP' },
                    { label: 'Session Timeout', value: '30 minutes' },
                    { label: 'Password Policy', value: 'Min. 8 chars' },
                    { label: 'MFA', value: 'Required for Admin' },
                    { label: 'RBAC', value: 'Enabled — 10 roles' },
                    { label: 'Audit Logging', value: 'Enabled' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between gap-4 border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium text-right text-green-400">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Integrations</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {[
                    { label: 'Database', value: 'Supabase PostgreSQL', ok: true },
                    { label: 'Auth', value: 'Supabase Auth', ok: true },
                    { label: 'Storage', value: 'Supabase Storage', ok: true },
                    { label: 'Maps', value: 'Google Maps Embed API', ok: true },
                    { label: 'WhatsApp Business', value: 'Pending Configuration', ok: false },
                    { label: 'SMS Gateway', value: 'Pending Configuration', ok: false },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between gap-4 border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className={`font-medium text-right ${r.ok ? 'text-green-400' : 'text-yellow-400'}`}>{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Supported Languages</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {[
                    { label: 'English', value: 'Active — Default' },
                    { label: 'Setswana', value: 'Planned — v1.1' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between gap-4 border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus size={16} />Create User Account</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className="px-3" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Email *</Label>
                <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="px-3" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    className="px-3 pr-10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+267…" className="px-3" />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>This will create a new Supabase Auth account. The user will need to verify their email before logging in.</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.email || !form.password || !form.role}>
                {saving ? 'Creating…' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
