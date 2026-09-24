import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function VeterinaryPage() {
  const [tab, setTab] = useState('visits');
  const [visits, setVisits] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [diseaseCases, setDiseaseCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [form, setForm] = useState({ farm_id: '', visit_date: '', findings: '', treatment_prescribed: '', follow_up_date: '' });
  const [vaccForm, setVaccForm] = useState({ animal_id: '', vaccine_type: '', batch_number: '', administered_date: '', next_due_date: '', notes: '' });
  const [diseaseForm, setDiseaseForm] = useState({ disease_name: '', outbreak_area: '', affected_animals_count: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [v, vacc, d] = await Promise.all([
      supabase.from('veterinary_visits').select('id, visit_code, visit_date, findings, treatment_prescribed, follow_up_date, created_at, farms(farm_name), profiles(full_name)').order('visit_date', { ascending: false }).limit(30),
      supabase.from('vaccinations').select('id, vaccine_type, batch_number, administered_date, next_due_date, created_at, animals(animal_code, species)').order('administered_date', { ascending: false }).limit(30),
      supabase.from('disease_cases').select('id, case_code, disease_name, outbreak_area, status, affected_animals_count, created_at').order('created_at', { ascending: false }).limit(30),
    ]);
    setVisits(Array.isArray(v.data) ? v.data : []);
    setVaccinations(Array.isArray(vacc.data) ? vacc.data : []);
    setDiseaseCases(Array.isArray(d.data) ? d.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    supabase.from('farms').select('id, farm_name').limit(200).then(({ data }) => setFarms(Array.isArray(data) ? data : []));
    supabase.from('animals').select('id, animal_code, species').limit(200).then(({ data }) => setAnimals(Array.isArray(data) ? data : []));
  }, [loadAll]);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('veterinary_visits').insert({ farm_id: form.farm_id, visit_date: form.visit_date, findings: form.findings || null, treatment_prescribed: form.treatment_prescribed || null, follow_up_date: form.follow_up_date || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Visit recorded'); setShowNew(false); setForm({ farm_id: '', visit_date: '', findings: '', treatment_prescribed: '', follow_up_date: '' }); loadAll();
  };

  const handleCreateVacc = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('vaccinations').insert({ animal_id: vaccForm.animal_id, vaccine_type: vaccForm.vaccine_type, batch_number: vaccForm.batch_number || null, administered_date: vaccForm.administered_date, next_due_date: vaccForm.next_due_date || null, notes: vaccForm.notes || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Vaccination recorded'); setShowNew(false); loadAll();
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('disease_cases').insert({ disease_name: diseaseForm.disease_name, outbreak_area: diseaseForm.outbreak_area || null, affected_animals_count: diseaseForm.affected_animals_count ? parseInt(diseaseForm.affected_animals_count) : null, notes: diseaseForm.notes || null, status: 'active' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Disease case reported'); setShowNew(false); loadAll();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold">Veterinary Services</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />New Record</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="visits" className="text-xs">Vet Visits</TabsTrigger>
            <TabsTrigger value="vaccinations" className="text-xs">Vaccinations</TabsTrigger>
            <TabsTrigger value="disease" className="text-xs">Disease Cases</TabsTrigger>
          </TabsList>

          <TabsContent value="visits">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/30">{['Visit Code','Farm','Visit Date','Findings','Follow-up','Recorded'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  : visits.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No visits recorded</td></tr>
                  : visits.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.visit_code}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(r.farms as any)?.farm_name || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{new Date(r.visit_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate">{r.findings || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.follow_up_date ? new Date(r.follow_up_date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="vaccinations">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/30">{['Animal','Species','Vaccine','Batch','Date','Next Due'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  : vaccinations.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No vaccinations recorded</td></tr>
                  : vaccinations.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{(r.animals as any)?.animal_code || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(r.animals as any)?.species || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.vaccine_type}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.batch_number || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{new Date(r.administered_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.next_due_date ? new Date(r.next_due_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="disease">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/30">{['Case Code','Disease','Area','Affected Animals','Status','Reported'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  : diseaseCases.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No disease cases</td></tr>
                  : diseaseCases.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.case_code}</td>
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.disease_name}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.outbreak_area || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.affected_animals_count ?? '—'}</td>
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

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Veterinary Record</DialogTitle></DialogHeader>
          <Tabs defaultValue="visit">
            <TabsList className="h-8 w-full">
              <TabsTrigger value="visit" className="flex-1 text-xs">Vet Visit</TabsTrigger>
              <TabsTrigger value="vacc" className="flex-1 text-xs">Vaccination</TabsTrigger>
              <TabsTrigger value="disease" className="flex-1 text-xs">Disease Case</TabsTrigger>
            </TabsList>
            <TabsContent value="visit">
              <form onSubmit={handleCreateVisit} className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Farm *</Label>
                  <Select value={form.farm_id} onValueChange={v => setForm(f => ({ ...f, farm_id: v }))}><SelectTrigger className="text-xs"><SelectValue placeholder="Select farm" /></SelectTrigger><SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1"><Label>Visit Date *</Label><Input type="date" required value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} className="px-3" /></div>
                <div className="space-y-1"><Label>Findings</Label><Textarea value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} rows={2} className="px-3 resize-none" /></div>
                <div className="space-y-1"><Label>Treatment Prescribed</Label><Textarea value={form.treatment_prescribed} onChange={e => setForm(f => ({ ...f, treatment_prescribed: e.target.value }))} rows={2} className="px-3 resize-none" /></div>
                <div className="space-y-1"><Label>Follow-up Date</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} className="px-3" /></div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.farm_id || !form.visit_date}>{saving ? 'Saving…' : 'Record Visit'}</Button></DialogFooter>
              </form>
            </TabsContent>
            <TabsContent value="vacc">
              <form onSubmit={handleCreateVacc} className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Animal *</Label>
                  <Select value={vaccForm.animal_id} onValueChange={v => setVaccForm(f => ({ ...f, animal_id: v }))}><SelectTrigger className="text-xs"><SelectValue placeholder="Select animal" /></SelectTrigger><SelectContent>{animals.map(a => <SelectItem key={a.id} value={a.id}>{a.animal_code} ({a.species})</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Vaccine Type *</Label><Input required value={vaccForm.vaccine_type} onChange={e => setVaccForm(f => ({ ...f, vaccine_type: e.target.value }))} className="px-3" /></div>
                  <div className="space-y-1"><Label>Batch Number</Label><Input value={vaccForm.batch_number} onChange={e => setVaccForm(f => ({ ...f, batch_number: e.target.value }))} className="px-3" /></div>
                  <div className="space-y-1"><Label>Administered Date *</Label><Input type="date" required value={vaccForm.administered_date} onChange={e => setVaccForm(f => ({ ...f, administered_date: e.target.value }))} className="px-3" /></div>
                  <div className="space-y-1"><Label>Next Due Date</Label><Input type="date" value={vaccForm.next_due_date} onChange={e => setVaccForm(f => ({ ...f, next_due_date: e.target.value }))} className="px-3" /></div>
                </div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !vaccForm.animal_id || !vaccForm.vaccine_type}>{saving ? 'Saving…' : 'Record Vaccination'}</Button></DialogFooter>
              </form>
            </TabsContent>
            <TabsContent value="disease">
              <form onSubmit={handleCreateCase} className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Disease Name *</Label><Input required value={diseaseForm.disease_name} onChange={e => setDiseaseForm(f => ({ ...f, disease_name: e.target.value }))} className="px-3" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Outbreak Area</Label><Input value={diseaseForm.outbreak_area} onChange={e => setDiseaseForm(f => ({ ...f, outbreak_area: e.target.value }))} className="px-3" /></div>
                  <div className="space-y-1"><Label>Affected Animals</Label><Input type="number" value={diseaseForm.affected_animals_count} onChange={e => setDiseaseForm(f => ({ ...f, affected_animals_count: e.target.value }))} className="px-3" /></div>
                </div>
                <div className="space-y-1"><Label>Notes</Label><Textarea value={diseaseForm.notes} onChange={e => setDiseaseForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="px-3 resize-none" /></div>
                <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !diseaseForm.disease_name}>{saving ? 'Saving…' : 'Report Case'}</Button></DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
