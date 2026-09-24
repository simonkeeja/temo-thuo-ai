import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Camera, Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { UserRole } from '@/types/types';

const ROLE_LABELS: Record<string, string> = {
  farmer: 'Farmer', veterinary_officer: 'Veterinary Officer',
  extension_officer: 'Extension Officer', feedlot_operator: 'Feedlot Operator',
  abattoir_officer: 'Abattoir Officer', insurance_officer: 'Insurance Officer',
  financial_officer: 'Financial Officer', ministry_official: 'Ministry Official',
  admin: 'System Administrator', operations_team: 'Operations Team',
};

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '', email: profile.email || '' });
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name || null, phone: form.phone || null }).eq('id', user!.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success('Profile updated');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.next.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setSavingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password changed successfully');
    setPwForm({ current: '', next: '', confirm: '' });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-bold">User Profile & Settings</h2>
          <p className="text-xs text-muted-foreground">Manage your personal information and account security</p>
        </div>

        {/* Avatar + role */}
        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center shrink-0">
              <User size={28} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold truncate">{profile?.full_name || 'No name set'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs border-accent/40 text-accent">
                {ROLE_LABELS[profile?.role || ''] || profile?.role || 'User'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile form */}
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm flex items-center gap-2"><User size={14} />Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" className="px-3" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input value={form.email} disabled className="px-3 opacity-60 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact your administrator.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+267 XX XXX XXX" className="px-3" />
              </div>
              <Button type="submit" size="sm" className="gap-1.5" disabled={savingProfile}>
                <Save size={13} />{savingProfile ? 'Saving…' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm flex items-center gap-2"><Lock size={14} />Change Password</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleChangePassword} className="space-y-4">
              {(['next', 'confirm'] as const).map(field => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-xs">{field === 'next' ? 'New Password' : 'Confirm New Password'}</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={field === 'next' ? 'Min. 8 characters' : 'Confirm password'}
                      className="px-3 pr-10"
                      required
                    />
                    {field === 'next' && (
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <Button type="submit" size="sm" variant="outline" className="gap-1.5" disabled={savingPw}>
                <Lock size={13} />{savingPw ? 'Changing…' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Session info */}
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm">Session Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-2 text-xs">
            {[
              { label: 'User ID', value: user?.id?.slice(0, 16) + '…' },
              { label: 'Last Sign-in', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—' },
              { label: 'Account Created', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—' },
            ].map(r => (
              <div key={r.label} className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono">{r.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
