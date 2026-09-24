import React, { useEffect, useState, useCallback } from 'react';
import {
  Stethoscope, Plus, Search, RefreshCw, Pencil, Trash2,
  ChevronDown, ChevronUp, Syringe, Pill, ClipboardList,
  Calendar, AlertTriangle, CheckCircle2, Clock, Filter,
  FileText, Thermometer, Weight, Activity
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import { RoleGuard } from '@/components/common/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface HealthRecord {
  id: string;
  animal_id: string | null;
  farm_id: string | null;
  record_type: string;
  title: string;
  description: string | null;
  diagnosis: string | null;
  symptoms: string | null;
  prognosis: string | null;
  medication_name: string | null;
  medication_dose: string | null;
  medication_route: string | null;
  withdrawal_days: number | null;
  withdrawal_end_date: string | null;
  vaccine_name: string | null;
  vaccine_batch_no: string | null;
  next_due_date: string | null;
  visit_date: string;
  visit_type: string;
  temperature_celsius: number | null;
  weight_kg: number | null;
  body_condition_score: number | null;
  outcome: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  cost_pula: number | null;
  notes: string | null;
  created_at: string;
  animals?: { animal_code: string; species: string; ear_tag_number: string | null };
  farms?: { farm_name: string; district: string };
  profiles?: { full_name: string | null };
}

interface Animal {
  id: string;
  animal_code: string;
  species: string;
  ear_tag_number: string | null;
  farms?: { farm_name: string } | { farm_name: string }[];
}

interface Farm {
  id: string;
  farm_name: string;
  district: string;
}

const EMPTY_FORM = {
  animal_id: '',
  farm_id: '',
  record_type: 'examination',
  title: '',
  description: '',
  diagnosis: '',
  symptoms: '',
  prognosis: '',
  medication_name: '',
  medication_dose: '',
  medication_route: '',
  withdrawal_days: '',
  withdrawal_end_date: '',
  vaccine_name: '',
  vaccine_batch_no: '',
  next_due_date: '',
  visit_date: new Date().toISOString().slice(0, 10),
  visit_type: 'routine',
  temperature_celsius: '',
  weight_kg: '',
  body_condition_score: '',
  outcome: '',
  follow_up_required: false,
  follow_up_date: '',
  follow_up_notes: '',
  cost_pula: '',
  notes: '',
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  vaccination: 'Vaccination',
  treatment: 'Treatment',
  examination: 'Examination',
  surgery: 'Surgery',
  deworming: 'Deworming',
  vitamin_supplement: 'Vitamin / Supplement',
  pregnancy_check: 'Pregnancy Check',
  other: 'Other',
};

const RECORD_TYPE_ICONS: Record<string, React.ReactNode> = {
  vaccination: <Syringe size={14} />,
  treatment: <Pill size={14} />,
  examination: <Stethoscope size={14} />,
  surgery: <Activity size={14} />,
  deworming: <Pill size={14} />,
  vitamin_supplement: <Pill size={14} />,
  pregnancy_check: <ClipboardList size={14} />,
  other: <FileText size={14} />,
};

const RECORD_TYPE_COLORS: Record<string, string> = {
  vaccination: 'bg-blue-100 text-blue-700',
  treatment: 'bg-red-100 text-red-700',
  examination: 'bg-primary/10 text-primary',
  surgery: 'bg-orange-100 text-orange-700',
  deworming: 'bg-yellow-100 text-yellow-700',
  vitamin_supplement: 'bg-green-100 text-green-700',
  pregnancy_check: 'bg-pink-100 text-pink-700',
  other: 'bg-muted text-muted-foreground',
};

const OUTCOME_COLORS: Record<string, string> = {
  recovered: 'bg-green-100 text-green-700',
  improving: 'bg-blue-100 text-blue-700',
  no_change: 'bg-muted text-muted-foreground',
  deteriorating: 'bg-orange-100 text-orange-700',
  deceased: 'bg-red-100 text-red-700',
  referred: 'bg-purple-100 text-purple-700',
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function VetHealthRecordsPage() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFarm, setFilterFarm] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const isFarmer = profile?.role === 'farmer';

  const set = (k: string, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [recRes, animalRes, farmRes] = await Promise.all([
      supabase
        .from('health_records')
        .select(`*, animals(animal_code, species, ear_tag_number), farms(farm_name, district), profiles(full_name)`)
        .order('visit_date', { ascending: false })
        .limit(200),
      supabase.from('animals').select('id, animal_code, species, ear_tag_number, farms(farm_name)').eq('status', 'active').limit(500),
      supabase.from('farms').select('id, farm_name, district').limit(200),
    ]);
    if (recRes.data)    setRecords(recRes.data as HealthRecord[]);
    if (animalRes.data) setAnimals(animalRes.data as Animal[]);
    if (farmRes.data)   setFarms(farmRes.data as Farm[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.animals?.animal_code?.toLowerCase().includes(search.toLowerCase()) ||
      r.animals?.ear_tag_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      r.medication_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.record_type === filterType;
    const matchFarm = filterFarm === 'all' || r.farm_id === filterFarm;
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'follow_up' ? r.follow_up_required && !r.outcome :
      activeTab === 'vaccinations' ? r.record_type === 'vaccination' :
      activeTab === 'treatments' ? r.record_type === 'treatment' : true;
    return matchSearch && matchType && matchFarm && matchTab;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const followUps = records.filter(r => r.follow_up_required && !r.outcome && r.follow_up_date && r.follow_up_date <= today).length;
  const vaccThisMonth = records.filter(r => r.record_type === 'vaccination' && r.visit_date.startsWith(thisMonth)).length;
  const treatThisMonth = records.filter(r => r.record_type === 'treatment' && r.visit_date.startsWith(thisMonth)).length;

  // ── Open form ────────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditRecord(null);
    setForm({ ...EMPTY_FORM, visit_date: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const openEdit = (r: HealthRecord) => {
    setEditRecord(r);
    setForm({
      animal_id: r.animal_id ?? '',
      farm_id: r.farm_id ?? '',
      record_type: r.record_type,
      title: r.title,
      description: r.description ?? '',
      diagnosis: r.diagnosis ?? '',
      symptoms: r.symptoms ?? '',
      prognosis: r.prognosis ?? '',
      medication_name: r.medication_name ?? '',
      medication_dose: r.medication_dose ?? '',
      medication_route: r.medication_route ?? '',
      withdrawal_days: r.withdrawal_days?.toString() ?? '',
      withdrawal_end_date: r.withdrawal_end_date ?? '',
      vaccine_name: r.vaccine_name ?? '',
      vaccine_batch_no: r.vaccine_batch_no ?? '',
      next_due_date: r.next_due_date ?? '',
      visit_date: r.visit_date,
      visit_type: r.visit_type,
      temperature_celsius: r.temperature_celsius?.toString() ?? '',
      weight_kg: r.weight_kg?.toString() ?? '',
      body_condition_score: r.body_condition_score?.toString() ?? '',
      outcome: r.outcome ?? '',
      follow_up_required: r.follow_up_required,
      follow_up_date: r.follow_up_date ?? '',
      follow_up_notes: r.follow_up_notes ?? '',
      cost_pula: r.cost_pula?.toString() ?? '',
      notes: r.notes ?? '',
    });
    setDialogOpen(true);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.visit_date)   { toast.error('Visit date is required'); return; }
    setSaving(true);

    const payload: Record<string, unknown> = {
      animal_id: form.animal_id || null,
      farm_id: form.farm_id || null,
      recorded_by: profile?.id ?? null,
      record_type: form.record_type,
      title: form.title.trim(),
      description: form.description || null,
      diagnosis: form.diagnosis || null,
      symptoms: form.symptoms || null,
      prognosis: form.prognosis || null,
      medication_name: form.medication_name || null,
      medication_dose: form.medication_dose || null,
      medication_route: form.medication_route || null,
      withdrawal_days: form.withdrawal_days ? parseInt(form.withdrawal_days) : null,
      withdrawal_end_date: form.withdrawal_end_date || null,
      vaccine_name: form.vaccine_name || null,
      vaccine_batch_no: form.vaccine_batch_no || null,
      next_due_date: form.next_due_date || null,
      visit_date: form.visit_date,
      visit_type: form.visit_type,
      temperature_celsius: form.temperature_celsius ? parseFloat(form.temperature_celsius) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      body_condition_score: form.body_condition_score ? parseInt(form.body_condition_score) : null,
      outcome: form.outcome || null,
      follow_up_required: form.follow_up_required,
      follow_up_date: form.follow_up_date || null,
      follow_up_notes: form.follow_up_notes || null,
      cost_pula: form.cost_pula ? parseFloat(form.cost_pula) : null,
      notes: form.notes || null,
    };

    const { error } = editRecord
      ? await supabase.from('health_records').update(payload).eq('id', editRecord.id)
      : await supabase.from('health_records').insert(payload);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editRecord ? 'Record updated' : 'Health record saved');
    setDialogOpen(false);
    loadData();
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('health_records').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Record deleted');
    setDeleteId(null);
    loadData();
  };

  // ── Record card ───────────────────────────────────────────────────────────────
  const RecordCard = ({ r }: { r: HealthRecord }) => {
    const expanded = expandedId === r.id;
    const overdue = r.follow_up_required && !r.outcome && r.follow_up_date && r.follow_up_date < today;
    return (
      <Card className={`transition-all ${overdue ? 'border-destructive/50' : ''}`}>
        <CardContent className="p-0">
          {/* Header row */}
          <button
            className="w-full text-left p-4 flex items-start gap-3"
            onClick={() => setExpandedId(expanded ? null : r.id)}
          >
            <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${RECORD_TYPE_COLORS[r.record_type] ?? 'bg-muted text-muted-foreground'}`}>
              {RECORD_TYPE_ICONS[r.record_type] ?? <FileText size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm truncate">{r.title}</span>
                {overdue && <Badge variant="destructive" className="text-xs shrink-0">Follow-up Overdue</Badge>}
                {r.follow_up_required && !overdue && !r.outcome && (
                  <Badge variant="outline" className="text-xs shrink-0 border-amber-400 text-amber-600">Follow-up Due</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                {r.animals && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-foreground">{r.animals.animal_code}</span>
                    {r.animals.ear_tag_number && <span>· {r.animals.ear_tag_number}</span>}
                    <span>· {r.animals.species}</span>
                  </span>
                )}
                {r.farms && <span>{r.farms.farm_name}</span>}
                <span className="flex items-center gap-1"><Calendar size={11} />{r.visit_date}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${RECORD_TYPE_COLORS[r.record_type]}`}>
                  {RECORD_TYPE_LABELS[r.record_type]}
                </span>
                {r.outcome && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${OUTCOME_COLORS[r.outcome] ?? 'bg-muted text-muted-foreground'}`}>
                    {r.outcome.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isFarmer && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(r); }}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(r.id); }}>
                    <Trash2 size={13} />
                  </Button>
                </>
              )}
              {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </div>
          </button>

          {/* Expanded details */}
          {expanded && (
            <div className="px-4 pb-4 border-t bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Clinical */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinical Details</p>
                  {r.symptoms && <Detail label="Symptoms" value={r.symptoms} />}
                  {r.diagnosis && <Detail label="Diagnosis" value={r.diagnosis} />}
                  {r.prognosis && <Detail label="Prognosis" value={r.prognosis} />}
                  {r.temperature_celsius && <Detail label="Temperature" value={`${r.temperature_celsius}°C`} />}
                  {r.weight_kg && <Detail label="Weight" value={`${r.weight_kg} kg`} />}
                  {r.body_condition_score && <Detail label="Body Condition" value={`${r.body_condition_score}/9`} />}
                </div>
                {/* Treatment / Vaccine */}
                <div className="space-y-2">
                  {(r.medication_name || r.vaccine_name) && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {r.record_type === 'vaccination' ? 'Vaccination Details' : 'Treatment Details'}
                      </p>
                      {r.medication_name && <Detail label="Medication" value={r.medication_name} />}
                      {r.medication_dose && <Detail label="Dose" value={r.medication_dose} />}
                      {r.medication_route && <Detail label="Route" value={r.medication_route.replace('_', ' ')} />}
                      {r.withdrawal_days && <Detail label="Withdrawal" value={`${r.withdrawal_days} days${r.withdrawal_end_date ? ` (until ${r.withdrawal_end_date})` : ''}`} />}
                      {r.vaccine_name && <Detail label="Vaccine" value={r.vaccine_name} />}
                      {r.vaccine_batch_no && <Detail label="Batch No." value={r.vaccine_batch_no} />}
                      {r.next_due_date && <Detail label="Next Due" value={r.next_due_date} />}
                    </>
                  )}
                  {r.follow_up_required && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3">Follow-up</p>
                      {r.follow_up_date && <Detail label="Due Date" value={r.follow_up_date} />}
                      {r.follow_up_notes && <Detail label="Notes" value={r.follow_up_notes} />}
                    </>
                  )}
                  {r.cost_pula && <Detail label="Cost" value={`P ${r.cost_pula}`} />}
                </div>
              </div>
              {r.description && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-foreground">{r.description}</p>
                </div>
              )}
              {r.notes && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{r.notes}</p>
                </div>
              )}
              {r.profiles?.full_name && (
                <p className="mt-3 text-xs text-muted-foreground">Recorded by: <span className="font-medium">{r.profiles.full_name}</span></p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <RoleGuard allowedRoles={['veterinary_officer','extension_officer','admin','operations_team','ministry_official','abattoir_officer','farmer']}>
      <AppLayout>
        <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Stethoscope size={22} className="text-primary" />
                Health Records
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Treatments, vaccinations & clinical examinations
              </p>
            </div>
            {!isFarmer && (
              <Button onClick={openNew} className="gap-2">
                <Plus size={16} /> New Record
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<FileText size={18} />} label="Total Records" value={records.length} color="text-primary" />
            <StatCard icon={<Syringe size={18} />} label="Vaccinations (MTD)" value={vaccThisMonth} color="text-blue-600" />
            <StatCard icon={<Pill size={18} />} label="Treatments (MTD)" value={treatThisMonth} color="text-red-600" />
            <StatCard icon={<AlertTriangle size={18} />} label="Follow-ups Due" value={followUps} color={followUps > 0 ? 'text-amber-600' : 'text-muted-foreground'} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search animal, diagnosis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px] h-9 text-sm"><Filter size={13} className="mr-1" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterFarm} onValueChange={setFilterFarm}>
              <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Farm" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farms</SelectItem>
                {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="vaccinations" className="text-xs">Vaccinations</TabsTrigger>
              <TabsTrigger value="treatments" className="text-xs">Treatments</TabsTrigger>
              <TabsTrigger value="follow_up" className="text-xs flex items-center gap-1">
                Follow-ups {followUps > 0 && <Badge variant="destructive" className="h-4 px-1 text-[10px]">{followUps}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-3">
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Stethoscope size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No records found</p>
                  <p className="text-sm mt-1">
                    {!isFarmer ? 'Click "New Record" to log the first health entry.' : 'No health records yet for your animals.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(r => <RecordCard key={r.id} r={r} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── New/Edit Dialog ───────────────────────────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope size={18} className="text-primary" />
                {editRecord ? 'Edit Health Record' : 'New Health Record'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Record type + visit type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Record Type *</Label>
                  <Select value={form.record_type} onValueChange={v => set('record_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECORD_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Visit Type *</Label>
                  <Select value={form.visit_type} onValueChange={v => set('visit_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title + date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. FMD Vaccination — Herd A" />
                </div>
                <div className="space-y-1">
                  <Label>Visit Date *</Label>
                  <Input type="date" value={form.visit_date} onChange={e => set('visit_date', e.target.value)} />
                </div>
              </div>

              {/* Animal + Farm */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Animal (optional)</Label>
                  <Select value={form.animal_id || 'none'} onValueChange={v => set('animal_id', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {animals.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.animal_code}{a.ear_tag_number ? ` · ${a.ear_tag_number}` : ''} ({a.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Farm (optional)</Label>
                  <Select value={form.farm_id || 'none'} onValueChange={v => set('farm_id', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clinical */}
              <div className="space-y-1">
                <Label>Symptoms</Label>
                <Textarea value={form.symptoms} onChange={e => set('symptoms', e.target.value)} placeholder="Observed symptoms..." rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Diagnosis</Label>
                <Input value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="Clinical diagnosis" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1"><Thermometer size={13} />Temp (°C)</Label>
                  <Input type="number" step="0.1" value={form.temperature_celsius} onChange={e => set('temperature_celsius', e.target.value)} placeholder="38.5" />
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1"><Weight size={13} />Weight (kg)</Label>
                  <Input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="450" />
                </div>
                <div className="space-y-1">
                  <Label>BCS (1–9)</Label>
                  <Input type="number" min="1" max="9" value={form.body_condition_score} onChange={e => set('body_condition_score', e.target.value)} placeholder="5" />
                </div>
              </div>

              {/* Vaccination fields */}
              {form.record_type === 'vaccination' && (
                <div className="space-y-3 rounded-lg border bg-blue-50/40 p-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1"><Syringe size={12} />Vaccination Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Vaccine Name</Label>
                      <Input value={form.vaccine_name} onChange={e => set('vaccine_name', e.target.value)} placeholder="e.g. Botuvax B" />
                    </div>
                    <div className="space-y-1">
                      <Label>Batch No.</Label>
                      <Input value={form.vaccine_batch_no} onChange={e => set('vaccine_batch_no', e.target.value)} placeholder="Batch #" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Next Due Date</Label>
                    <Input type="date" value={form.next_due_date} onChange={e => set('next_due_date', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Treatment / medication fields */}
              {['treatment','deworming','vitamin_supplement','surgery'].includes(form.record_type) && (
                <div className="space-y-3 rounded-lg border bg-red-50/30 p-3">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide flex items-center gap-1"><Pill size={12} />Treatment Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Medication Name</Label>
                      <Input value={form.medication_name} onChange={e => set('medication_name', e.target.value)} placeholder="Drug name" />
                    </div>
                    <div className="space-y-1">
                      <Label>Dose</Label>
                      <Input value={form.medication_dose} onChange={e => set('medication_dose', e.target.value)} placeholder="e.g. 10mg/kg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Route</Label>
                      <Select value={form.medication_route || 'none'} onValueChange={v => set('medication_route', v === 'none' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="Route" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— None —</SelectItem>
                          <SelectItem value="oral">Oral</SelectItem>
                          <SelectItem value="injection_im">IM Injection</SelectItem>
                          <SelectItem value="injection_iv">IV Injection</SelectItem>
                          <SelectItem value="injection_sc">SC Injection</SelectItem>
                          <SelectItem value="topical">Topical</SelectItem>
                          <SelectItem value="intranasal">Intranasal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Withdrawal (days)</Label>
                      <Input type="number" min="0" value={form.withdrawal_days} onChange={e => set('withdrawal_days', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>
              )}

              {/* Prognosis + Outcome */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Prognosis</Label>
                  <Select value={form.prognosis || 'none'} onValueChange={v => set('prognosis', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="guarded">Guarded</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Outcome</Label>
                  <Select value={form.outcome || 'none'} onValueChange={v => set('outcome', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      <SelectItem value="recovered">Recovered</SelectItem>
                      <SelectItem value="improving">Improving</SelectItem>
                      <SelectItem value="no_change">No Change</SelectItem>
                      <SelectItem value="deteriorating">Deteriorating</SelectItem>
                      <SelectItem value="deceased">Deceased</SelectItem>
                      <SelectItem value="referred">Referred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Follow-up */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="follow_up"
                  checked={form.follow_up_required}
                  onChange={e => set('follow_up_required', e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <Label htmlFor="follow_up" className="cursor-pointer">Follow-up required</Label>
              </div>
              {form.follow_up_required && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-1">
                    <Label>Follow-up Date</Label>
                    <Input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Follow-up Notes</Label>
                    <Textarea value={form.follow_up_notes} onChange={e => set('follow_up_notes', e.target.value)} rows={2} />
                  </div>
                </div>
              )}

              {/* Cost + notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Cost (Pula)</Label>
                  <Input type="number" step="0.01" value={form.cost_pula} onChange={e => set('cost_pula', e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description..." rows={2} />
              </div>
              <div className="space-y-1">
                <Label>Additional Notes</Label>
                <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." rows={2} />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw size={14} className="animate-spin mr-1" /> : <CheckCircle2 size={14} className="mr-1" />}
                {editRecord ? 'Save Changes' : 'Save Record'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ────────────────────────────────────────────────── */}
        <Dialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Health Record?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">This action cannot be undone. The record will be permanently removed.</p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </RoleGuard>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 w-24">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`${color} shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
