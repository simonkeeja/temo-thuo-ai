import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Tractor, ActivitySquare, Cpu, Leaf, Radio, Stethoscope,
  ShoppingBag, Shield, CreditCard, Zap, BarChart3, Bell, TrendingUp,
  AlertTriangle, CheckCircle2, Map, Calendar, FileText, ClipboardList,
  CloudRain, Building2, Lock, Clock, User, Hash, MapPin, Phone,
  Thermometer, Wind, Droplets, Eye, Sun, CloudSnow, HeartPulse
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/* ────────────────────────────────────────────────────────────────
   Weather hook — fetches current conditions for a Botswana district
──────────────────────────────────────────────────────────────── */

// Maps common Botswana districts to coordinates for weather lookup
const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  'Central': { lat: -21.9, lon: 26.5 },
  'Kgatleng': { lat: -24.2, lon: 26.1 },
  'Kweneng': { lat: -23.8, lon: 25.0 },
  'South East': { lat: -24.65, lon: 25.9 },
  'Southern': { lat: -25.0, lon: 25.3 },
  'North East': { lat: -20.9, lon: 27.5 },
  'North West': { lat: -19.1, lon: 23.4 },
  'Ghanzi': { lat: -21.7, lon: 21.6 },
  'Kgalagadi': { lat: -24.5, lon: 21.8 },
  'Chobe': { lat: -17.8, lon: 25.15 },
};
const DEFAULT_COORDS = { lat: -24.6282, lon: 25.9231 }; // Gaborone fallback

function useWeather(district: string | null | undefined) {
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  useEffect(() => {
    const coords = (district && DISTRICT_COORDS[district]) || DEFAULT_COORDS;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature` +
      `&wind_speed_unit=kmh&timezone=Africa%2FGaborone`
    )
      .then(r => r.json())
      .then(d => { setWeather(d?.current ?? null); setWeatherLoading(false); })
      .catch(() => setWeatherLoading(false));
  }, [district]);
  return { weather, weatherLoading };
}

function weatherDesc(code: number): { label: string; icon: React.ReactNode } {
  if (code === 0) return { label: 'Clear sky', icon: <Sun size={18} className="text-yellow-400" /> };
  if (code <= 3) return { label: 'Partly cloudy', icon: <CloudRain size={18} className="text-muted-foreground" /> };
  if (code <= 49) return { label: 'Foggy', icon: <Eye size={18} className="text-muted-foreground" /> };
  if (code <= 67) return { label: 'Rainy', icon: <CloudRain size={18} className="text-blue-400" /> };
  if (code <= 77) return { label: 'Snowy', icon: <CloudSnow size={18} className="text-blue-200" /> };
  if (code <= 99) return { label: 'Thunderstorm', icon: <Zap size={18} className="text-yellow-400" /> };
  return { label: 'Unknown', icon: <CloudRain size={18} /> };
}

/* ────────────────────────────────────────────────────────────────
   Role-specific stat / data loading helpers
──────────────────────────────────────────────────────────────── */

function useFarmerDashboard(userId: string | undefined) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Get farmer record + profile details in parallel
      const [farmerRes, profileRes] = await Promise.all([
        supabase.from('farmers').select('id, farmer_code, omang_number, date_of_birth, gender').eq('profile_id', userId).maybeSingle(),
        supabase.from('profiles').select('full_name, phone, district, village, status, email').eq('id', userId).maybeSingle(),
      ]);
      const farmerRec = farmerRes.data;
      const profileRec = profileRes.data;

      if (!farmerRec) {
        setData({
          farms: 0, animals: 0, fields: 0, listings: 0, policies: 0, notifications: 0,
          recentAnimals: [], upcomingVisits: [],
          profile: profileRec,
          farmerCode: null, omangNumber: null, gender: null, dateOfBirth: null,
        });
        return;
      }
      const fid = farmerRec.id;

      // Fetch counts + vet visits scoped to farmer's own animals
      const [farms, animals, fields, listings, policies, notifs] = await Promise.all([
        supabase.from('farms').select('id', { count: 'exact', head: true }).eq('farmer_id', fid),
        supabase.from('animals').select('id', { count: 'exact', head: true }).eq('farmer_id', fid),
        supabase.from('crop_fields').select('id', { count: 'exact', head: true }).eq('farmer_id', fid),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true }).eq('seller_id', userId).eq('status', 'active'),
        supabase.from('insurance_policies').select('id', { count: 'exact', head: true }).eq('farmer_id', fid).eq('status', 'active'),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
      ]);

      // Vet visits properly scoped to farmer's own animals
      const animalIds = await supabase.from('animals').select('id').eq('farmer_id', fid);
      const aidList = (animalIds.data ?? []).map((a: any) => a.id);
      const visitsRes = aidList.length > 0
        ? await supabase.from('veterinary_visits')
            .select('id, visit_date, reason, animals(animal_code)')
            .in('animal_id', aidList)
            .order('visit_date', { ascending: false })
            .limit(5)
        : { data: [] };

      const recentAnimals = await supabase.from('animals')
        .select('id,animal_code,species,breed,status')
        .eq('farmer_id', fid)
        .order('created_at', { ascending: false })
        .limit(5);

      setData({
        farms: farms.count ?? 0,
        animals: animals.count ?? 0,
        fields: fields.count ?? 0,
        listings: listings.count ?? 0,
        policies: policies.count ?? 0,
        notifications: notifs.count ?? 0,
        recentAnimals: Array.isArray(recentAnimals.data) ? recentAnimals.data : [],
        upcomingVisits: Array.isArray(visitsRes.data) ? visitsRes.data : [],
        // Profile fields
        profile: profileRec,
        farmerCode: farmerRec.farmer_code,
        omangNumber: farmerRec.omang_number,
        gender: farmerRec.gender,
        dateOfBirth: farmerRec.date_of_birth,
      });
    })();
  }, [userId]);
  return data;
}

function useVetDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const [visits, cases, vaccinations, quarantined, treated, bioscan] = await Promise.all([
        supabase.from('veterinary_visits').select('id', { count: 'exact', head: true }),
        supabase.from('disease_cases').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('vaccinations').select('id', { count: 'exact', head: true }),
        supabase.from('animals').select('id', { count: 'exact', head: true }).eq('status', 'quarantined'),
        supabase.from('animals').select('id', { count: 'exact', head: true }).eq('status', 'sick'),
        supabase.from('microchips').select('id', { count: 'exact', head: true }).eq('status', 'in_use'),
      ]);
      const recentCases = await supabase.from('disease_cases').select('id,case_code,disease_name,status,affected_animals_count,district').order('created_at', { ascending: false }).limit(5);
      const upcomingVaccinations = await supabase.from('vaccinations').select('id,vaccine_name,scheduled_date,animals(animal_code)').order('scheduled_date', { ascending: true }).limit(5);
      setData({
        visits: visits.count ?? 0,
        activeCases: cases.count ?? 0,
        vaccinations: vaccinations.count ?? 0,
        quarantined: quarantined.count ?? 0,
        sickAnimals: treated.count ?? 0,
        bioSentinelActive: bioscan.count ?? 0,
        recentCases: Array.isArray(recentCases.data) ? recentCases.data : [],
        upcomingVaccinations: Array.isArray(upcomingVaccinations.data) ? upcomingVaccinations.data : [],
      });
    })();
  }, []);
  return data;
}

function useExtensionDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const [farmers, farms, fields, sensors, visits] = await Promise.all([
        supabase.from('farmers').select('id', { count: 'exact', head: true }),
        supabase.from('farms').select('id', { count: 'exact', head: true }),
        supabase.from('crop_fields').select('id', { count: 'exact', head: true }),
        supabase.from('sensors').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('veterinary_visits').select('id', { count: 'exact', head: true }),
      ]);
      const cropHealthList = await supabase.from('crop_fields').select('id,field_code,crop_type,status,district').order('created_at', { ascending: false }).limit(6);
      setData({
        farmers: farmers.count ?? 0,
        farms: farms.count ?? 0,
        fields: fields.count ?? 0,
        sensorsActive: sensors.count ?? 0,
        farmVisits: visits.count ?? 0,
        cropHealth: Array.isArray(cropHealthList.data) ? cropHealthList.data : [],
      });
    })();
  }, []);
  return data;
}

function useNationalDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const [farmers, farms, animals, fields, cases, devices, listings, payments] = await Promise.all([
        supabase.from('farmers').select('id', { count: 'exact', head: true }),
        supabase.from('farms').select('id', { count: 'exact', head: true }),
        supabase.from('animals').select('id', { count: 'exact', head: true }),
        supabase.from('crop_fields').select('id', { count: 'exact', head: true }),
        supabase.from('disease_cases').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('marketplace_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('payments').select('id', { count: 'exact', head: true }),
      ]);
      const recentCases = await supabase.from('disease_cases').select('id,case_code,disease_name,status,affected_animals_count,district').order('created_at', { ascending: false }).limit(5);
      const recentListings = await supabase.from('marketplace_listings').select('id,title,unit_price,status,location_district').eq('status', 'active').order('created_at', { ascending: false }).limit(5);
      setData({
        farmers: farmers.count ?? 0,
        farms: farms.count ?? 0,
        animals: animals.count ?? 0,
        fields: fields.count ?? 0,
        activeCases: cases.count ?? 0,
        devices: devices.count ?? 0,
        listings: listings.count ?? 0,
        payments: payments.count ?? 0,
        recentCases: Array.isArray(recentCases.data) ? recentCases.data : [],
        recentListings: Array.isArray(recentListings.data) ? recentListings.data : [],
      });
    })();
  }, []);
  return data;
}

function useAdminDashboard(userId: string | undefined) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [totalUsers, activeUsers, farmers, cases, devices, notifs] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('farmers').select('id', { count: 'exact', head: true }),
        supabase.from('disease_cases').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
      ]);
      const recentUsers = await supabase.from('profiles').select('id,full_name,email,role,status,created_at').order('created_at', { ascending: false }).limit(6);
      const logs = await supabase.from('audit_logs').select('id,action,table_name,performed_by,created_at').order('created_at', { ascending: false }).limit(5);
      setData({
        totalUsers: totalUsers.count ?? 0,
        activeUsers: activeUsers.count ?? 0,
        farmers: farmers.count ?? 0,
        activeCases: cases.count ?? 0,
        devices: devices.count ?? 0,
        notifications: notifs.count ?? 0,
        recentUsers: Array.isArray(recentUsers.data) ? recentUsers.data : [],
        auditLogs: Array.isArray(logs.data) ? logs.data : [],
      });
    })();
  }, [userId]);
  return data;
}

function useInsuranceDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const [active, renewal, open, approved, paid] = await Promise.all([
        supabase.from('insurance_policies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('insurance_policies').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
        supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('insurance_claims').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
      ]);
      const recentClaims = await supabase.from('insurance_claims').select('id,claim_number,claim_type,status,compensation_amount,created_at,insurance_policies(policy_number)').order('created_at', { ascending: false }).limit(6);
      setData({
        activePolicies: active.count ?? 0,
        renewalDue: renewal.count ?? 0,
        openClaims: open.count ?? 0,
        approvedClaims: approved.count ?? 0,
        paidClaims: paid.count ?? 0,
        recentClaims: Array.isArray(recentClaims.data) ? recentClaims.data : [],
      });
    })();
  }, []);
  return data;
}

function useFinancialDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const [total, completed, pending] = await Promise.all([
        supabase.from('payments').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      const recentPayments = await supabase.from('payments').select('id,payment_reference,payment_method,amount,currency,status,created_at,profiles(full_name)').order('created_at', { ascending: false }).limit(6);
      setData({
        total: total.count ?? 0,
        completed: completed.count ?? 0,
        pending: pending.count ?? 0,
        recentPayments: Array.isArray(recentPayments.data) ? recentPayments.data : [],
      });
    })();
  }, []);
  return data;
}

/* ────────────────────────────────────────────────────────────────
   Report Sick Animal Dialog
──────────────────────────────────────────────────────────────── */

const SYMPTOM_OPTIONS = [
  'Loss of appetite',
  'Lethargy / weakness',
  'Fever / high temperature',
  'Diarrhoea or loose stool',
  'Nasal discharge',
  'Laboured breathing',
  'Swollen limbs or joints',
  'Skin lesions or wounds',
  'Unusual behaviour',
  'Eye discharge',
  'Vomiting',
  'Other',
];

interface ReportSickAnimalDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  animals: Array<{ id: string; animal_code: string; species: string }>;
  userId: string;
  onSuccess: () => void;
}

function ReportSickAnimalDialog({ open, onOpenChange, animals, userId, onSuccess }: ReportSickAnimalDialogProps) {
  const [animalId, setAnimalId] = useState('');
  const [symptom, setSymptom] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('moderate');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) { setAnimalId(''); setSymptom(''); setDescription(''); setUrgency('moderate'); }
  }, [open]);

  const handleSubmit = async () => {
    if (!animalId || !symptom) {
      toast.error('Please select an animal and at least one symptom.');
      return;
    }
    setSubmitting(true);
    try {
      const selectedAnimal = animals.find(a => a.id === animalId);
      const reportNote = `[SICK REPORT ${new Date().toLocaleDateString()}] Urgency: ${urgency.toUpperCase()} | Symptom: ${symptom}${description ? ` | Details: ${description}` : ''}`;

      // 1. Mark animal status as sick + append note
      const { error: animalErr } = await supabase
        .from('animals')
        .update({ status: 'sick', notes: reportNote })
        .eq('id', animalId);
      if (animalErr) throw animalErr;

      // 2. Create a self-notification as record of the report
      await supabase.from('notifications').insert({
        user_id: userId,
        title: `Sick Animal Report — ${selectedAnimal?.animal_code ?? 'Animal'}`,
        message: `You reported ${selectedAnimal?.animal_code} (${selectedAnimal?.species}) as sick. Symptom: ${symptom}. A veterinary officer will be notified.`,
        type: 'alert',
        is_read: false,
      });

      toast.success(`Sick report submitted for ${selectedAnimal?.animal_code}. A vet will be notified.`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <HeartPulse size={16} className="text-red-400" />
            Report Sick Animal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Urgency banner */}
          <div className="flex gap-2">
            {(['low', 'moderate', 'high', 'emergency'] as const).map(u => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors capitalize
                  ${urgency === u
                    ? u === 'emergency' ? 'bg-red-500/20 border-red-500 text-red-400'
                      : u === 'high' ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : u === 'moderate' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      : 'bg-muted border-border text-muted-foreground'
                    : 'border-border/40 text-muted-foreground hover:border-border'}`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Animal selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Select Animal *</Label>
            <Select value={animalId} onValueChange={setAnimalId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Choose an animal..." />
              </SelectTrigger>
              <SelectContent>
                {animals.length === 0
                  ? <SelectItem value="none" disabled>No animals registered</SelectItem>
                  : animals.map(a => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.animal_code} — {a.species}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Symptom */}
          <div className="space-y-1.5">
            <Label className="text-xs">Primary Symptom *</Label>
            <Select value={symptom} onValueChange={setSymptom}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Select symptom..." />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_OPTIONS.map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Additional Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe when symptoms started, other observations..."
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          {/* Info note */}
          <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <p>This will mark the animal as <strong>sick</strong> and create an alert. A veterinary officer will follow up with you.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !animalId || !symptom}
            className="gap-1.5 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30">
            <HeartPulse size={13} />
            {submitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────────
   Dashboard panels
──────────────────────────────────────────────────────────────── */

function LoadingGrid({ cols = 4 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-3`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-24 rounded border border-border bg-muted/20 animate-pulse" />
      ))}
    </div>
  );
}

function FarmerDashboard({ userId }: { userId: string }) {
  const data = useFarmerDashboard(userId);
  const navigate = useNavigate();
  const district = data?.profile?.district ?? null;
  const { weather, weatherLoading } = useWeather(district);
  const [showSickDialog, setShowSickDialog] = useState(false);
  const [myAnimals, setMyAnimals] = useState<Array<{ id: string; animal_code: string; species: string }>>([]);

  // Load farmer's animals for the sick-report selector
  useEffect(() => {
    if (!data?.recentAnimals) return;
    // Use already-loaded recentAnimals; also fetch full list for selector
    supabase.from('farmers').select('id').eq('profile_id', userId).maybeSingle().then(({ data: fr }) => {
      if (!fr) return;
      supabase.from('animals').select('id, animal_code, species').eq('farmer_id', fr.id)
        .order('animal_code').limit(200)
        .then(({ data: animals }) => setMyAnimals(Array.isArray(animals) ? animals : []));
    });
  }, [userId, data]);

  if (!data) return <LoadingGrid cols={4} />;

  const wDesc = weather ? weatherDesc(weather.weather_code ?? 0) : null;

  return (
    <div className="space-y-5">
      {/* ── Row 1: Profile + Weather ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Farmer Profile Card */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User size={14} className="text-accent" /> Farmer Profile
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/profile')}>
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Full Name</span>
              <span className="text-xs font-medium truncate max-w-[60%] text-right">
                {data.profile?.full_name || '—'}
              </span>
            </div>
            {data.farmerCode && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Hash size={11} />Farmer ID</span>
                <span className="text-xs font-mono text-accent">{data.farmerCode}</span>
              </div>
            )}
            {data.omangNumber && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Omang / National ID</span>
                <span className="text-xs font-mono">{'•'.repeat(6) + data.omangNumber.slice(-3)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={11} />District</span>
              <span className="text-xs">{data.profile?.district || '—'}</span>
            </div>
            {data.profile?.village && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Village / Town</span>
                <span className="text-xs">{data.profile.village}</span>
              </div>
            )}
            {data.profile?.phone && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={11} />Mobile</span>
                <span className="text-xs">{data.profile.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Account Status</span>
              <StatusBadge status={data.profile?.status ?? 'active'} />
            </div>
            {data.gender && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Gender</span>
                <span className="text-xs capitalize">{data.gender}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Summary Card */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CloudRain size={14} className="text-accent" /> Weather Summary
            </CardTitle>
            <span className="text-xs text-muted-foreground">{data.profile?.district || 'Gaborone'}</span>
          </CardHeader>
          <CardContent className="pb-4">
            {weatherLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted/30 rounded animate-pulse" />)}
              </div>
            ) : weather ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {wDesc?.icon}
                  <div>
                    <p className="text-2xl font-bold">{Math.round(weather.temperature_2m ?? 0)}°C</p>
                    <p className="text-xs text-muted-foreground">{wDesc?.label} · Feels like {Math.round(weather.apparent_temperature ?? 0)}°C</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="flex flex-col items-center gap-1 p-2 bg-muted/20 rounded text-center">
                    <Droplets size={13} className="text-blue-400" />
                    <span className="text-xs font-medium">{weather.relative_humidity_2m ?? '—'}%</span>
                    <span className="text-[10px] text-muted-foreground">Humidity</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-muted/20 rounded text-center">
                    <Wind size={13} className="text-muted-foreground" />
                    <span className="text-xs font-medium">{Math.round(weather.wind_speed_10m ?? 0)} km/h</span>
                    <span className="text-[10px] text-muted-foreground">Wind</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-muted/20 rounded text-center">
                    <Thermometer size={13} className="text-orange-400" />
                    <span className="text-xs font-medium">{Math.round(weather.apparent_temperature ?? 0)}°C</span>
                    <span className="text-[10px] text-muted-foreground">Feels like</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-right">Source: Open-Meteo · Updated now</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">Weather data unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: KPI Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'My Farms', value: data.farms, icon: <Tractor size={15} />, path: '/farms' },
          { label: 'My Livestock', value: data.animals, icon: <ActivitySquare size={15} />, path: '/livestock', accent: true },
          { label: 'Crop Fields', value: data.fields, icon: <Leaf size={15} />, path: '/crops' },
          { label: 'Active Listings', value: data.listings, icon: <ShoppingBag size={15} />, path: '/marketplace' },
          { label: 'Active Policies', value: data.policies, icon: <Shield size={15} />, path: '/insurance' },
          { label: 'Unread Alerts', value: data.notifications, icon: <Bell size={15} />, path: '/notifications', accent: data.notifications > 0 },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>

      {/* ── Row 3: Livestock + Vet Visits ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">My Livestock</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/livestock')}>View all</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/20">
                  {['Code', 'Species', 'Breed', 'Status'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {(data.recentAnimals ?? []).length === 0
                    ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No livestock registered yet</td></tr>
                    : (data.recentAnimals ?? []).map((a: any) => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/livestock/${a.id}`)}>
                        <td className="px-4 py-2 font-mono text-accent whitespace-nowrap">{a.animal_code}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{a.species}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{a.breed || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Upcoming Veterinary Visits</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/veterinary')}>View all</Button>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {(data.upcomingVisits ?? []).length === 0
              ? <p className="text-xs text-muted-foreground py-4 text-center">No vet visits recorded</p>
              : (data.upcomingVisits ?? []).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded border border-border/60 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.reason || 'Visit'}</p>
                    <p className="text-muted-foreground">{(v.animals as any)?.animal_code || '—'}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0">{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : '—'}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Quick Actions ── */}
      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Report Sick Animal — prominent red button */}
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25"
              variant="outline"
              onClick={() => setShowSickDialog(true)}
            >
              <HeartPulse size={13} /> Report Sick Animal
            </Button>
            {[
              { label: 'Register Animal', path: '/livestock', icon: <ActivitySquare size={13} /> },
              { label: 'Add Crop Field', path: '/crops', icon: <Leaf size={13} /> },
              { label: 'Post Listing', path: '/marketplace', icon: <ShoppingBag size={13} /> },
              { label: 'Submit Claim', path: '/insurance', icon: <Shield size={13} /> },
              { label: 'View GIS Map', path: '/gis', icon: <Map size={13} /> },
              { label: 'AI Insights', path: '/ai-insights', icon: <TrendingUp size={13} /> },
            ].map(a => (
              <Button key={a.label} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(a.path)}>
                {a.icon}{a.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Sick Animal Dialog */}
      <ReportSickAnimalDialog
        open={showSickDialog}
        onOpenChange={setShowSickDialog}
        animals={myAnimals}
        userId={userId}
        onSuccess={() => {
          // Refresh recentAnimals to reflect new sick status
          setMyAnimals(prev => prev);
        }}
      />
    </div>
  );
}

function VetDashboard() {
  const data = useVetDashboard();
  const navigate = useNavigate();
  if (!data) return <LoadingGrid cols={4} />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Visits', value: data.visits, icon: <Stethoscope size={15} />, path: '/veterinary' },
          { label: 'Disease Cases', value: data.activeCases, icon: <AlertTriangle size={15} />, path: '/veterinary', accent: data.activeCases > 0 },
          { label: 'Vaccinations', value: data.vaccinations, icon: <CheckCircle2 size={15} />, path: '/veterinary' },
          { label: 'Quarantined', value: data.quarantined, icon: <Lock size={15} />, path: '/livestock', accent: data.quarantined > 0 },
          { label: 'Sick Animals', value: data.sickAnimals, icon: <ActivitySquare size={15} />, path: '/livestock' },
          { label: 'Bio-Sentinel Active', value: data.bioSentinelActive, icon: <Cpu size={15} />, path: '/microchips' },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Active Disease Cases</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/veterinary')}>View all</Button>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {data.recentCases.length === 0
              ? <div className="flex flex-col items-center gap-2 py-4"><CheckCircle2 size={22} className="text-green-400" /><p className="text-xs text-muted-foreground">No active disease cases</p></div>
              : data.recentCases.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded border border-border/60 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.disease_name}</p>
                    <p className="text-muted-foreground">{c.district || 'Unknown'} · {c.affected_animals_count ?? 0} animals</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Upcoming Vaccinations</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/veterinary')}>Schedule</Button>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {data.upcomingVaccinations.length === 0
              ? <p className="text-xs text-muted-foreground py-4 text-center">No upcoming vaccinations</p>
              : data.upcomingVaccinations.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded border border-border/60 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.vaccine_name}</p>
                    <p className="text-muted-foreground">{(v.animals as any)?.animal_code || '—'}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 flex items-center gap-1"><Calendar size={11} />{v.scheduled_date ? new Date(v.scheduled_date).toLocaleDateString() : '—'}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExtensionDashboard() {
  const data = useExtensionDashboard();
  const navigate = useNavigate();
  if (!data) return <LoadingGrid cols={4} />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Registered Farmers', value: data.farmers, icon: <Users size={15} />, path: '/farmers' },
          { label: 'Active Farms', value: data.farms, icon: <Tractor size={15} />, path: '/farms' },
          { label: 'Crop Fields', value: data.fields, icon: <Leaf size={15} />, path: '/crops', accent: true },
          { label: 'Active Sensors', value: data.sensorsActive, icon: <Radio size={15} />, path: '/sensors' },
          { label: 'Farm Visits', value: data.farmVisits, icon: <ClipboardList size={15} />, path: '/veterinary' },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Crop Health Status</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/crops')}>View all</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/20">
                  {['Field', 'Crop Type', 'District', 'Status'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {data.cropHealth.length === 0
                    ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No fields registered</td></tr>
                    : data.cropHealth.map((f: any) => (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate('/crops')}>
                        <td className="px-4 py-2 font-mono text-accent whitespace-nowrap">{f.field_code}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{f.crop_type || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{f.district || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={f.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'View Farmers', path: '/farmers', icon: <Users size={13} /> },
                { label: 'View Farms', path: '/farms', icon: <Tractor size={13} /> },
                { label: 'Crop Monitoring', path: '/crops', icon: <Leaf size={13} /> },
                { label: 'Sensor Data', path: '/sensors', icon: <Radio size={13} /> },
                { label: 'AI Insights', path: '/ai-insights', icon: <TrendingUp size={13} /> },
                { label: 'GIS Map', path: '/gis', icon: <Map size={13} /> },
              ].map(a => (
                <Button key={a.label} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(a.path)}>
                  {a.icon}{a.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NationalDashboard({ isMinistry }: { isMinistry: boolean }) {
  const data = useNationalDashboard();
  const navigate = useNavigate();
  if (!data) return <LoadingGrid cols={4} />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Farmers', value: data.farmers, icon: <Users size={15} />, path: '/farmers' },
          { label: 'Total Farms', value: data.farms, icon: <Tractor size={15} />, path: '/farms' },
          { label: 'Livestock Population', value: data.animals, icon: <ActivitySquare size={15} />, path: '/livestock', accent: true },
          { label: 'Crop Fields', value: data.fields, icon: <Leaf size={15} />, path: '/crops' },
          { label: 'Active Disease Cases', value: data.activeCases, icon: <AlertTriangle size={15} />, path: '/veterinary', accent: data.activeCases > 0 },
          { label: 'IoT Devices', value: data.devices, icon: <Zap size={15} />, path: '/iot' },
          { label: 'Marketplace Listings', value: data.listings, icon: <ShoppingBag size={15} />, path: '/marketplace' },
          { label: 'Transactions', value: data.payments, icon: <CreditCard size={15} />, path: '/payments' },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Disease Surveillance</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/veterinary')}>View all</Button>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {data.recentCases.length === 0
              ? <div className="flex flex-col items-center gap-2 py-4"><CheckCircle2 size={22} className="text-green-400" /><p className="text-xs text-muted-foreground">No active disease cases</p></div>
              : data.recentCases.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded border border-border/60 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.disease_name}</p>
                    <p className="text-muted-foreground">{c.district || 'National'} · {c.affected_animals_count ?? 0} animals</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Marketplace Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/marketplace')}>View all</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/20">
                  {['Listing', 'District', 'BWP', 'Status'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {data.recentListings.length === 0
                    ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No listings</td></tr>
                    : data.recentListings.map((l: any) => (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate('/marketplace')}>
                        <td className="px-4 py-2 max-w-[140px] truncate whitespace-nowrap">{l.title}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{l.location_district || '—'}</td>
                        <td className="px-4 py-2 font-mono whitespace-nowrap">{l.unit_price?.toLocaleString() ?? '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={l.status} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {isMinistry && (
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Situation Room', path: '/situation-room', icon: <Map size={13} /> },
            { label: 'National Reports', path: '/reports', icon: <BarChart3 size={13} /> },
            { label: 'AI Predictions', path: '/ai-insights', icon: <TrendingUp size={13} /> },
            { label: 'GIS Mapping', path: '/gis', icon: <CloudRain size={13} /> },
          ].map(a => (
            <Button key={a.label} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(a.path)}>
              {a.icon}{a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ userId }: { userId: string }) {
  const data = useAdminDashboard(userId);
  const navigate = useNavigate();
  if (!data) return <LoadingGrid cols={4} />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: data.totalUsers, icon: <Users size={15} />, path: '/admin' },
          { label: 'Active Users', value: data.activeUsers, icon: <CheckCircle2 size={15} />, path: '/admin', accent: true },
          { label: 'Farmers', value: data.farmers, icon: <Tractor size={15} />, path: '/farmers' },
          { label: 'Active Disease Cases', value: data.activeCases, icon: <AlertTriangle size={15} />, path: '/veterinary', accent: data.activeCases > 0 },
          { label: 'Devices', value: data.devices, icon: <Zap size={15} />, path: '/devices' },
          { label: 'Unread Alerts', value: data.notifications, icon: <Bell size={15} />, path: '/notifications', accent: data.notifications > 0 },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent User Accounts</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/admin')}>Manage users</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/20">
                  {['Name', 'Role', 'Status', 'Joined'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {data.recentUsers.length === 0
                    ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No users</td></tr>
                    : data.recentUsers.map((u: any) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate('/admin')}>
                        <td className="px-4 py-2 font-medium whitespace-nowrap">{u.full_name || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{u.role?.replace(/_/g, ' ') || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={u.status || 'active'} /></td>
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Audit Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/admin')}>Full log</Button>
          </CardHeader>
          <CardContent className="space-y-2 pb-4">
            {data.auditLogs.length === 0
              ? <p className="text-xs text-muted-foreground py-4 text-center">No audit logs</p>
              : data.auditLogs.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded border border-border/60 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.action} — {l.table_name}</p>
                    <p className="text-muted-foreground font-mono">{l.performed_by?.slice(0, 10) || 'System'}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Admin Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'User Management', path: '/admin', icon: <Users size={13} /> },
              { label: 'Device Assets', path: '/devices', icon: <Building2 size={13} /> },
              { label: 'IoT Infrastructure', path: '/iot', icon: <Zap size={13} /> },
              { label: 'Situation Room', path: '/situation-room', icon: <Map size={13} /> },
              { label: 'Reports', path: '/reports', icon: <BarChart3 size={13} /> },
              { label: 'AI Insights', path: '/ai-insights', icon: <TrendingUp size={13} /> },
            ].map(a => (
              <Button key={a.label} variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(a.path)}>
                {a.icon}{a.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InsuranceDashboard() {
  const data = useInsuranceDashboard();
  const navigate = useNavigate();
  if (!data) return <LoadingGrid cols={4} />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Active Policies', value: data.activePolicies, icon: <Shield size={15} />, path: '/insurance', accent: true },
          { label: 'Due for Renewal', value: data.renewalDue, icon: <Calendar size={15} />, path: '/insurance', accent: data.renewalDue > 0 },
          { label: 'Open Claims', value: data.openClaims, icon: <FileText size={15} />, path: '/insurance' },
          { label: 'Approved Claims', value: data.approvedClaims, icon: <CheckCircle2 size={15} />, path: '/insurance' },
          { label: 'Claims Paid', value: data.paidClaims, icon: <CreditCard size={15} />, path: '/payments' },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Claims</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/insurance')}>View all</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead><tr className="border-b border-border bg-muted/20">
                {['Claim No.', 'Type', 'Policy', 'Amount', 'Status'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {data.recentClaims.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No claims</td></tr>
                  : data.recentClaims.map((c: any) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate('/insurance')}>
                      <td className="px-4 py-2 font-mono text-accent whitespace-nowrap">{c.claim_number}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{c.claim_type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{(c.insurance_policies as any)?.policy_number || '—'}</td>
                      <td className="px-4 py-2 font-mono whitespace-nowrap">{c.compensation_amount ? `BWP ${c.compensation_amount.toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinancialDashboard() {
  const data = useFinancialDashboard();
  const navigate = useNavigate();
  if (!data) return <LoadingGrid cols={3} />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Total Transactions', value: data.total, icon: <CreditCard size={15} />, path: '/payments', accent: true },
          { label: 'Completed', value: data.completed, icon: <CheckCircle2 size={15} />, path: '/payments' },
          { label: 'Pending', value: data.pending, icon: <Clock size={15} />, path: '/payments', accent: data.pending > 0 },
        ].map(s => (
          <div key={s.label} className="cursor-pointer" onClick={() => navigate(s.path)}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </div>
        ))}
      </div>
      <Card className="border-border">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/payments')}>View all</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead><tr className="border-b border-border bg-muted/20">
                {['Reference', 'User', 'Method', 'Amount', 'Status', 'Date'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {data.recentPayments.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No payments</td></tr>
                  : data.recentPayments.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate('/payments')}>
                      <td className="px-4 py-2 font-mono text-accent whitespace-nowrap">{p.payment_reference}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{(p.profiles as any)?.full_name || '—'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{p.payment_method}</td>
                      <td className="px-4 py-2 font-mono whitespace-nowrap">{p.amount?.toLocaleString()} {p.currency}</td>
                      <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main Dashboard router
──────────────────────────────────────────────────────────────── */

// Feedlot/Abattoir have a limited livestock view
function FeedlotAbattoirDashboard() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.from('animals').select('id,animal_code,species,breed,status', { count: 'exact' }).order('created_at', { ascending: false }).limit(10).then(({ data, count: c }) => {
      setAnimals(Array.isArray(data) ? data : []);
      setCount(c ?? 0);
      setLoading(false);
    });
  }, []);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <div className="cursor-pointer" onClick={() => navigate('/livestock')}>
          <StatCard label="Registered Animals" value={loading ? '—' : count} icon={<ActivitySquare size={15} />} accent />
        </div>
        <div className="cursor-pointer" onClick={() => navigate('/microchips')}>
          <StatCard label="Bio-Sentinel Chips" value="—" icon={<Cpu size={15} />} />
        </div>
      </div>
      <Card className="border-border">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Livestock Registry</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-accent h-7" onClick={() => navigate('/livestock')}>View all</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead><tr className="border-b border-border bg-muted/20">
                {['Code', 'Species', 'Breed', 'Status'].map(h => <th key={h} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr>
                  : animals.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No animals</td></tr>
                    : animals.map(a => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/livestock/${a.id}`)}>
                        <td className="px-4 py-2 font-mono text-accent whitespace-nowrap">{a.animal_code}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{a.species}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{a.breed || '—'}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, role, user } = useAuth();
  const navigate = useNavigate();

  const name = profile?.full_name?.split(' ')[0] || 'User';
  const roleName = profile?.role?.replace(/_/g, ' ') || '';

  const roleAlerts = role === 'admin' || role === 'ministry_official' || role === 'operations_team';

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">Welcome, {name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{roleName} · Temo-Thuo AI National Agricultural OS</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {roleAlerts && (
              <Button size="sm" variant="outline" onClick={() => navigate('/situation-room')} className="gap-1.5">
                <Map size={14} /> Situation Room
              </Button>
            )}
            <Button size="sm" onClick={() => navigate('/notifications')} className="gap-1.5">
              <Bell size={14} /> Notifications
            </Button>
          </div>
        </div>

        {/* Role-specific dashboard panel */}
        {role === 'farmer' && user && <FarmerDashboard userId={user.id} />}
        {role === 'veterinary_officer' && <VetDashboard />}
        {role === 'extension_officer' && <ExtensionDashboard />}
        {(role === 'ministry_official' || role === 'operations_team') && <NationalDashboard isMinistry={role === 'ministry_official'} />}
        {role === 'admin' && user && <AdminDashboard userId={user.id} />}
        {role === 'insurance_officer' && <InsuranceDashboard />}
        {role === 'financial_officer' && <FinancialDashboard />}
        {(role === 'feedlot_operator' || role === 'abattoir_officer') && <FeedlotAbattoirDashboard />}
      </div>
    </AppLayout>
  );
}
