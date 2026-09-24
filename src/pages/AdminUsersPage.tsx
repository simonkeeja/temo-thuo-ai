import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Settings, Activity, FileText, Lock,
  UserPlus, Search, RefreshCw, Eye, EyeOff,
  AlertTriangle, Pencil, UserX, UserCheck, ChevronDown,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import { RoleGuard } from '@/components/common/RoleGuard';
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
import { ROLE_LABELS, BOTSWANA_DISTRICTS } from '@/types/types';

const ROLES: UserRole[] = [
  'farmer', 'veterinary_officer', 'extension_officer', 'feedlot_operator',
  'abattoir_officer', 'insurance_officer', 'financial_officer',
  'ministry_official', 'admin', 'operations_team',
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: 'border-red-500/40 text-red-400',
  operations_team: 'border-orange-500/40 text-orange-400',
  ministry_official: 'border-purple-500/40 text-purple-400',
  veterinary_officer: 'border-blue-500/40 text-blue-400',
  extension_officer: 'border-cyan-500/40 text-cyan-400',
  insurance_officer: 'border-yellow-500/40 text-yellow-400',
  financial_officer: 'border-emerald-500/40 text-emerald-400',
  feedlot_operator: 'border-lime-500/40 text-lime-400',
  abattoir_officer: 'border-rose-500/40 text-rose-400',
  farmer: 'border-accent/40 text-accent',
};

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  phone: string | null;
  status: string;
  district: string | null;
  village: string | null;
  national_id: string | null;
  created_at: string;
}

const EMPTY_CREATE = { full_name: '', email: '', password: '', role: '' as UserRole | '', phone: '', district: '', village: '', national_id: '' };
const EMPTY_EDIT = { full_name: '', phone: '', district: '', village: '', national_id: '' };

// Call the admin-user-ops Edge Function
async function callAdminOps(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-user-ops', {
    body: { action, ...payload },
  });
  if (error) {
    const msg = await error?.context?.text?.().catch(() => error.message);
    throw new Error(msg || error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function AdminUsersPage() {
  const { role: myRole } = useAuth();
  const [tab, setTab] = useState('users');

  // Users state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, farmers: 0, admins: 0, officers: 0 });

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE });
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT });
  const [editRole, setEditRole] = useState<UserRole>('farmer');

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Load users ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, role, phone, status, district, village, national_id, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200);
    if (roleFilter !== 'all') q = q.eq('role', roleFilter);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, count } = await q;
    const list: UserRow[] = Array.isArray(data) ? data : [];
    setUsers(list);
    const total = count ?? list.length;
    setStats({
      total,
      active: list.filter(u => u.status === 'active').length,
      suspended: list.filter(u => u.status === 'suspended').length,
      farmers: list.filter(u => u.role === 'farmer').length,
      admins: list.filter(u => u.role === 'admin').length,
      officers: list.filter(u => ['veterinary_officer', 'extension_officer', 'insurance_officer', 'financial_officer', 'ministry_official', 'operations_team', 'feedlot_operator', 'abattoir_officer'].includes(u.role)).length,
    });
    setLoading(false);
  }, [roleFilter, statusFilter]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('id, action, table_name, record_id, created_at, profiles!audit_logs_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    setAuditLogs(Array.isArray(data) ? data : []);
    setAuditLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (tab === 'audit') loadAudit(); }, [tab, loadAudit]);

  // ── Client-side search filter ─────────────────────────────────────────────
  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.role?.toLowerCase().includes(s) ||
      u.district?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s)
    );
  });

  // ── Create user ───────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.role) {
      toast.error('Email, password, and role are required');
      return;
    }
    if (createForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await callAdminOps('create', {
        email: createForm.email,
        password: createForm.password,
        full_name: createForm.full_name || null,
        role: createForm.role,
        phone: createForm.phone || null,
        district: createForm.district || null,
        village: createForm.village || null,
        national_id: createForm.national_id || null,
      });
      toast.success(`User ${createForm.email} created successfully`);
      setShowCreate(false);
      setCreateForm({ ...EMPTY_CREATE });
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit dialog ──────────────────────────────────────────────────────
  const openEdit = (u: UserRow) => {
    setEditTarget(u);
    setEditRole(u.role);
    setEditForm({
      full_name: u.full_name || '',
      phone: u.phone || '',
      district: u.district || '',
      village: u.village || '',
      national_id: u.national_id || '',
    });
    setShowEdit(true);
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      // Update profile fields
      await callAdminOps('update_profile', {
        user_id: editTarget.id,
        full_name: editForm.full_name,
        phone: editForm.phone,
        district: editForm.district,
        village: editForm.village,
        national_id: editForm.national_id,
      });
      // Update role if changed
      if (editRole !== editTarget.role) {
        await callAdminOps('update_role', { user_id: editTarget.id, role: editRole });
      }
      toast.success('User updated');
      setShowEdit(false);
      setEditTarget(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ─────────────────────────────────────────────────────────
  const toggleStatus = async (u: UserRow) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    try {
      await callAdminOps('update_status', { user_id: u.id, status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── Deactivate permanently ────────────────────────────────────────────────
  const deactivateUser = async (u: UserRow) => {
    if (!confirm(`Permanently deactivate ${u.full_name || u.email}? They will no longer be able to log in.`)) return;
    try {
      await callAdminOps('update_status', { user_id: u.id, status: 'inactive' });
      toast.success('User deactivated');
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout>
      <RoleGuard
        allowedRoles={['admin', 'operations_team']}
        message="User management is restricted to System Administrators and Operations Team members only."
      >
        <div className="p-6 space-y-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users size={18} className="text-accent" />
                User Management
              </h2>
              <p className="text-xs text-muted-foreground">
                Create, edit, assign roles, and manage account status for all system users
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <UserPlus size={14} />Create User
            </Button>
          </div>

          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Users" value={stats.total} icon={<Users size={12} />} />
            <StatCard label="Active" value={stats.active} icon={<UserCheck size={12} />} accent />
            <StatCard label="Suspended" value={stats.suspended} icon={<UserX size={12} />} />
            <StatCard label="Farmers" value={stats.farmers} icon={<Users size={12} />} />
            <StatCard label="Officers" value={stats.officers} icon={<Activity size={12} />} />
            <StatCard label="Admins" value={stats.admins} icon={<Lock size={12} />} />
          </div>

          {/* ── Tabs ── */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-8">
              <TabsTrigger value="users" className="text-xs gap-1.5"><Users size={12} />Users ({stats.total})</TabsTrigger>
              <TabsTrigger value="audit" className="text-xs gap-1.5"><FileText size={12} />Audit Log</TabsTrigger>
              {myRole === 'admin' && (
                <TabsTrigger value="settings" className="text-xs gap-1.5"><Settings size={12} />System Info</TabsTrigger>
              )}
            </TabsList>

            {/* ── USERS TAB ── */}
            <TabsContent value="users" className="space-y-3">
              {/* Filters row */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, role, district…"
                    className="pl-8 px-8 text-xs h-8"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); }}>
                  <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_verification">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={loadUsers}>
                  <RefreshCw size={12} />Refresh
                </Button>
              </div>

              {/* Users table */}
              <div className="border border-border bg-card overflow-x-auto">
                <table className="w-full text-xs min-w-max">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Name', 'Email', 'Role', 'Phone', 'District', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
                    ) : filtered.map(u => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">{u.full_name || '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className={`text-xs ${ROLE_BADGE_COLORS[u.role] || ''}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{u.phone || '—'}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{u.district || '—'}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={u.status || 'active'} /></td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {/* Edit */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs gap-1"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil size={10} />Edit
                            </Button>
                            {/* Suspend / Activate */}
                            {u.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                                onClick={() => toggleStatus(u)}
                              >
                                Suspend
                              </Button>
                            ) : u.status === 'suspended' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
                                onClick={() => toggleStatus(u)}
                              >
                                Activate
                              </Button>
                            ) : null}
                            {/* Deactivate — admin only, only for non-inactive */}
                            {myRole === 'admin' && u.status !== 'inactive' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                                onClick={() => deactivateUser(u)}
                              >
                                <UserX size={10} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {users.length} users
              </p>
            </TabsContent>

            {/* ── AUDIT LOG TAB ── */}
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
                    {auditLoading ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                    ) : auditLogs.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit logs found</td></tr>
                    ) : auditLogs.map(l => (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {(l.profiles as any)?.full_name || '—'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">{l.action}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono whitespace-nowrap text-muted-foreground">{l.table_name}</td>
                        <td className="px-4 py-2.5 font-mono whitespace-nowrap text-muted-foreground">
                          {l.record_id ? `${l.record_id.slice(0, 12)}…` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ── SYSTEM INFO TAB (admin only) ── */}
            {myRole === 'admin' && (
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
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* ══ CREATE USER DIALOG ══════════════════════════════════════════════ */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus size={16} />Create User Account
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Full Name</Label>
                  <Input value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. Kabo Moagi" className="px-3" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Email Address *</Label>
                  <Input type="email" required value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="px-3" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
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
                  <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v as UserRole }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+267 7X XXX XXX" className="px-3" />
                </div>
                <div className="space-y-1">
                  <Label>District</Label>
                  <Select value={createForm.district} onValueChange={v => setCreateForm(f => ({ ...f, district: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {BOTSWANA_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Village</Label>
                  <Input value={createForm.village} onChange={e => setCreateForm(f => ({ ...f, village: e.target.value }))} placeholder="Village name" className="px-3" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>National ID (Omang)</Label>
                  <Input value={createForm.national_id} onChange={e => setCreateForm(f => ({ ...f, national_id: e.target.value }))} placeholder="Omang / Passport number" className="px-3" />
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-accent/10 border border-accent/30 rounded text-xs text-accent">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>Account is created immediately and email verification is skipped. The user can log in right away with the credentials you set.</span>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || !createForm.email || !createForm.password || !createForm.role}>
                  {saving ? 'Creating…' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ══ EDIT USER DIALOG ════════════════════════════════════════════════ */}
        <Dialog open={showEdit} onOpenChange={v => { setShowEdit(v); if (!v) setEditTarget(null); }}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil size={16} />Edit User — {editTarget?.full_name || editTarget?.email}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Full name" className="px-3" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Role</Label>
                  <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+267 7X XXX XXX" className="px-3" />
                </div>
                <div className="space-y-1">
                  <Label>National ID (Omang)</Label>
                  <Input value={editForm.national_id} onChange={e => setEditForm(f => ({ ...f, national_id: e.target.value }))} placeholder="Omang number" className="px-3" />
                </div>
                <div className="space-y-1">
                  <Label>District</Label>
                  <Select value={editForm.district || 'none'} onValueChange={v => setEditForm(f => ({ ...f, district: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No district —</SelectItem>
                      {BOTSWANA_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Village</Label>
                  <Input value={editForm.village} onChange={e => setEditForm(f => ({ ...f, village: e.target.value }))} placeholder="Village name" className="px-3" />
                </div>
              </div>
              {editTarget && editRole !== editTarget.role && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>You are changing this user's role from <strong>{ROLE_LABELS[editTarget.role]}</strong> to <strong>{ROLE_LABELS[editRole]}</strong>. This will immediately affect their access permissions.</span>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </RoleGuard>
    </AppLayout>
  );
}
