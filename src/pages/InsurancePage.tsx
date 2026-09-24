import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const POLICY_TYPES = ['Livestock', 'Crops', 'Farm', 'Equipment', 'Mixed'];
const CLAIM_TYPES = ['Death/Slaughter', 'Disease Outbreak', 'Theft', 'Natural Disaster', 'Drought', 'Flood', 'Other'];

// Roles that can register NEW policies for any farmer
const CAN_CREATE_POLICY = ['admin', 'insurance_officer', 'operations_team'];

export default function InsurancePage() {
  const { user, role } = useAuth();
  const [tab, setTab] = useState('policies');
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPolicy, setShowNewPolicy] = useState(false);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [myFarmerId, setMyFarmerId] = useState<string | null>(null);

  const [pForm, setPForm] = useState({ farmer_id: '', policy_type: '', provider: '', coverage_amount: '', premium_amount: '', effective_date: '', expiry_date: '' });
  const [cForm, setCForm] = useState({ policy_id: '', claim_type: '', incident_date: '', description: '' });
  const [saving, setSaving] = useState(false);

  const isFarmer = role === 'farmer';
  const canCreatePolicy = role && CAN_CREATE_POLICY.includes(role);
  // Farmers can submit claims on their own policies; insurance_officer/admin can too
  const canSubmitClaim = isFarmer || canCreatePolicy;

  // Resolve own farmer record
  useEffect(() => {
    if (!isFarmer || !user) return;
    supabase.from('farmers').select('id').eq('profile_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setMyFarmerId(data.id);
    });
  }, [isFarmer, user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    let polQ = supabase.from('insurance_policies')
      .select('id, policy_number, policy_type, provider, coverage_amount, premium_amount, effective_date, expiry_date, status, created_at, farmers(farmer_code, profiles(full_name))')
      .order('created_at', { ascending: false }).limit(50);

    let clmQ = supabase.from('insurance_claims')
      .select('id, claim_number, claim_type, incident_date, status, compensation_amount, created_at, insurance_policies(policy_number, policy_type, farmer_id), profiles(full_name)')
      .order('created_at', { ascending: false }).limit(50);

    // Farmers: filter by their own farmer_id
    if (isFarmer && myFarmerId) {
      polQ = polQ.eq('farmer_id', myFarmerId);
      // Claims scoped via the joined policy's farmer_id — filter claimant_id for safety
      clmQ = clmQ.eq('claimant_id', user!.id);
    }

    const [pol, clm] = await Promise.all([polQ, clmQ]);
    setPolicies(Array.isArray(pol.data) ? pol.data : []);
    setClaims(Array.isArray(clm.data) ? clm.data : []);
    setLoading(false);
  }, [isFarmer, myFarmerId, user]);

  useEffect(() => {
    loadAll();
    if (!isFarmer) {
      supabase.from('farmers').select('id, farmer_code, profiles(full_name)').limit(200).then(({ data }) => setFarmers(Array.isArray(data) ? data : []));
    }
  }, [loadAll, isFarmer]);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('insurance_policies').insert({
      farmer_id: pForm.farmer_id, policy_type: pForm.policy_type, provider: pForm.provider,
      coverage_amount: pForm.coverage_amount ? parseFloat(pForm.coverage_amount) : null,
      premium_amount: pForm.premium_amount ? parseFloat(pForm.premium_amount) : null,
      effective_date: pForm.effective_date, expiry_date: pForm.expiry_date,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Policy registered'); setShowNewPolicy(false); loadAll();
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('insurance_claims').insert({
      policy_id: cForm.policy_id, claimant_id: user!.id,
      claim_type: cForm.claim_type, incident_date: cForm.incident_date,
      description: cForm.description || null, status: 'submitted',
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Claim submitted'); setShowNewClaim(false); loadAll();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold">{isFarmer ? 'My Insurance' : 'Insurance Management'}</h2>
          <div className="flex gap-2">
            {canSubmitClaim && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowNewClaim(true)}><Plus size={13} />Submit Claim</Button>
            )}
            {canCreatePolicy && (
              <Button size="sm" className="gap-1.5" onClick={() => setShowNewPolicy(true)}><Plus size={14} />New Policy</Button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="policies" className="text-xs">Policies ({policies.length})</TabsTrigger>
            <TabsTrigger value="claims" className="text-xs">Claims ({claims.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="policies">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/30">{['Policy #','Type','Provider','Farmer','Coverage (BWP)','Premium (BWP)','Effective','Expiry','Status'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  : policies.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">{isFarmer ? 'You have no insurance policies yet' : 'No policies found'}</td></tr>
                  : policies.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.policy_number}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.policy_type}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.provider}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(r.farmers as any)?.profiles?.full_name || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.coverage_amount?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.premium_amount?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.effective_date ? new Date(r.effective_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.expiry_date ? new Date(r.expiry_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="claims">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/30">{['Claim #','Policy #','Type','Claimant','Incident Date','Compensation (BWP)','Status','Filed'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  : claims.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{isFarmer ? 'You have no claims yet' : 'No claims'}</td></tr>
                  : claims.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.claim_number}</td>
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap">{(r.insurance_policies as any)?.policy_number || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.claim_type}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(r.profiles as any)?.full_name || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.incident_date ? new Date(r.incident_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.compensation_amount?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Policy Dialog — insurance_officer/admin only */}
      {canCreatePolicy && (
        <Dialog open={showNewPolicy} onOpenChange={setShowNewPolicy}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register Insurance Policy</DialogTitle></DialogHeader>
            <form onSubmit={handleCreatePolicy} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Farmer *</Label>
                  <Select value={pForm.farmer_id} onValueChange={v => setPForm(f => ({ ...f, farmer_id: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select farmer" /></SelectTrigger>
                    <SelectContent>{farmers.map(f => <SelectItem key={f.id} value={f.id}>{(f.profiles as any)?.full_name || f.farmer_code}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Policy Type *</Label>
                  <Select value={pForm.policy_type} onValueChange={v => setPForm(f => ({ ...f, policy_type: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{POLICY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Provider *</Label><Input required value={pForm.provider} onChange={e => setPForm(f => ({ ...f, provider: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Coverage (BWP)</Label><Input type="number" value={pForm.coverage_amount} onChange={e => setPForm(f => ({ ...f, coverage_amount: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Premium (BWP)</Label><Input type="number" value={pForm.premium_amount} onChange={e => setPForm(f => ({ ...f, premium_amount: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Effective Date *</Label><Input type="date" required value={pForm.effective_date} onChange={e => setPForm(f => ({ ...f, effective_date: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Expiry Date *</Label><Input type="date" required value={pForm.expiry_date} onChange={e => setPForm(f => ({ ...f, expiry_date: e.target.value }))} className="px-3" /></div>
              </div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNewPolicy(false)}>Cancel</Button><Button type="submit" disabled={saving || !pForm.farmer_id || !pForm.policy_type}>{saving ? 'Saving…' : 'Register Policy'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Submit Claim Dialog — farmers and insurance officers */}
      {canSubmitClaim && (
        <Dialog open={showNewClaim} onOpenChange={setShowNewClaim}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader><DialogTitle>Submit Insurance Claim</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateClaim} className="space-y-3">
              <div className="space-y-1"><Label>Policy *</Label>
                <Select value={cForm.policy_id} onValueChange={v => setCForm(f => ({ ...f, policy_id: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select policy" /></SelectTrigger>
                  <SelectContent>{policies.map(p => <SelectItem key={p.id} value={p.id}>{p.policy_number} — {p.policy_type}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Claim Type *</Label>
                  <Select value={cForm.claim_type} onValueChange={v => setCForm(f => ({ ...f, claim_type: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CLAIM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Incident Date *</Label><Input type="date" required value={cForm.incident_date} onChange={e => setCForm(f => ({ ...f, incident_date: e.target.value }))} className="px-3" /></div>
              </div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={cForm.description} onChange={e => setCForm(f => ({ ...f, description: e.target.value }))} rows={3} className="px-3 resize-none" /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNewClaim(false)}>Cancel</Button><Button type="submit" disabled={saving || !cForm.policy_id || !cForm.claim_type}>{saving ? 'Saving…' : 'Submit Claim'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
