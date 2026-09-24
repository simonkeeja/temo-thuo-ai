import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Leaf, Eye, EyeOff, Loader2, Check, ChevronRight,
  User, Phone, MapPin, FileText, Shield, AlertCircle
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BOTSWANA_DISTRICTS } from '@/types/types';

// ── Step definitions ───────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Account',  icon: <Shield size={14} /> },
  { id: 2, label: 'Personal', icon: <User size={14} /> },
  { id: 3, label: 'Location', icon: <MapPin size={14} /> },
  { id: 4, label: 'Review',   icon: <FileText size={14} /> },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];

interface FormData {
  // Step 1 – Account
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  // Step 2 – Personal
  phone: string;
  omang_number: string;
  date_of_birth: string;
  gender: string;
  // Step 3 – Location
  district: string;
  village: string;
  // Step 4 – Agreement
  agreed: boolean;
}

const EMPTY: FormData = {
  full_name: '', email: '', password: '', confirm_password: '',
  phone: '', omang_number: '', date_of_birth: '', gender: '',
  district: '', village: '',
  agreed: false,
};

// ── Validation helpers ─────────────────────────────────────────
function validateStep(step: number, form: FormData): string | null {
  if (step === 1) {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'A valid email address is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
  }
  if (step === 2) {
    if (!form.omang_number.trim()) return 'Omang number is required.';
    if (!/^\d{7,9}$/.test(form.omang_number.trim())) return 'Omang number must be 7–9 digits.';
    if (!form.gender) return 'Please select your gender.';
  }
  if (step === 3) {
    if (!form.district) return 'Please select your district.';
  }
  if (step === 4) {
    if (!form.agreed) return 'You must accept the User Agreement and Privacy Policy to continue.';
  }
  return null;
}

// ── Main component ─────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormData, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleNext = () => {
    const err = validateStep(step, form);
    if (err) { toast.error(err); return; }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const err = validateStep(4, form);
    if (err) { toast.error(err); return; }
    setSubmitting(true);

    try {
      const res = await supabase.functions.invoke('farmer-register', {
        body: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          omang_number: form.omang_number.trim(),
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          district: form.district,
          village: form.village.trim() || null,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const body = res.data as any;
      if (body?.error) throw new Error(body.error);

      // If Edge Function returned a session, set it directly
      if (body?.session) {
        await supabase.auth.setSession(body.session);
        await refreshProfile?.();
        toast.success('Welcome to Temo-Thuo AI! Your account has been created.');
        navigate('/dashboard');
      } else {
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step panels ──────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1: return <StepAccount form={form} set={set} showPass={showPass} setShowPass={setShowPass} showConfirm={showConfirm} setShowConfirm={setShowConfirm} />;
      case 2: return <StepPersonal form={form} set={set} />;
      case 3: return <StepLocation form={form} set={set} />;
      case 4: return <StepReview form={form} set={set} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left landscape panel ── */}
      <div className="hidden md:flex flex-col justify-between w-[45%] shrink-0 relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80')" }}
        />
        <div className="relative z-10 p-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-accent flex items-center justify-center">
              <Leaf size={20} className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Temo-Thuo AI</p>
              <p className="text-xs text-white/60">National Agricultural OS</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-3">
                Register as a<br />Farmer
              </h2>
              <p className="text-white/70 text-sm max-w-xs leading-relaxed">
                Create your farmer profile and gain access to livestock management,
                crop monitoring, insurance, marketplace, and AI advisory tools.
              </p>
            </div>

            {/* What you'll get */}
            <div className="space-y-3">
              {[
                'Livestock registration & tracking',
                'Bio-Sentinel microchip management',
                'Crop field monitoring & sensors',
                'Insurance & financial services',
                'AI-powered advisory insights',
                'Marketplace listings',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
                    <Check size={10} className="text-accent" />
                  </div>
                  <span className="text-xs text-white/70">{item}</span>
                </div>
              ))}
            </div>

            {/* Vertical step progress */}
            <div className="space-y-2 pt-2">
              {STEPS.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors
                    ${step > s.id ? 'bg-accent text-accent-foreground' : step === s.id ? 'bg-white text-primary' : 'bg-white/20 text-white/50'}`}>
                    {step > s.id ? <Check size={12} /> : s.id}
                  </div>
                  <span className={`text-xs transition-colors ${step === s.id ? 'text-white font-medium' : step > s.id ? 'text-accent' : 'text-white/40'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/30">© 2026 SY-TECH AI SYSTEMS. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-card min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Leaf size={16} className="text-accent-foreground" />
            </div>
            <p className="font-bold text-foreground">Temo-Thuo AI</p>
          </div>

          {/* Mobile step pills */}
          <div className="flex gap-1 mb-5 md:hidden">
            {STEPS.map(s => (
              <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-colors
                ${step > s.id ? 'bg-accent' : step === s.id ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>

          {/* Step label */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
              Step {step} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold text-foreground">{STEPS[step - 1].label}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === 1 && 'Set up your login credentials'}
              {step === 2 && 'Your personal information'}
              {step === 3 && 'Where are you farming?'}
              {step === 4 && 'Review and submit your registration'}
            </p>
          </div>

          {/* Step content */}
          <div className="space-y-4">
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <Button variant="outline" className="flex-1" onClick={handleBack} disabled={submitting}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button className="flex-1 gap-1.5" onClick={handleNext}>
                Continue <ChevronRight size={14} />
              </Button>
            ) : (
              <Button className="flex-1 gap-1.5" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Creating account…</> : <><Check size={14} /> Create My Account</>}
              </Button>
            )}
          </div>

          {/* Sign in link */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Account ────────────────────────────────────────────
function StepAccount({ form, set, showPass, setShowPass, showConfirm, setShowConfirm }: {
  form: FormData; set: (k: keyof FormData, v: string | boolean) => void;
  showPass: boolean; setShowPass: (v: boolean) => void;
  showConfirm: boolean; setShowConfirm: (v: boolean) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input id="full_name" placeholder="Kabo Sithole"
          value={form.full_name} onChange={e => set('full_name', e.target.value)}
          className="px-3" autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" type="email" placeholder="kabo@example.com"
          value={form.email} onChange={e => set('email', e.target.value)}
          className="px-3" autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input id="password" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
            value={form.password} onChange={e => set('password', e.target.value)}
            className="px-3 pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm Password *</Label>
        <div className="relative">
          <Input id="confirm_password" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
            value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)}
            className="px-3 pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {form.password && form.confirm_password && form.password !== form.confirm_password && (
          <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />Passwords do not match</p>
        )}
      </div>
    </>
  );
}

// ── Step 2: Personal ───────────────────────────────────────────
function StepPersonal({ form, set }: { form: FormData; set: (k: keyof FormData, v: string | boolean) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="omang_number">Omang / National ID Number *</Label>
        <Input id="omang_number" placeholder="e.g. 123456789"
          value={form.omang_number} onChange={e => set('omang_number', e.target.value.replace(/\D/g, ''))}
          className="px-3 font-mono" maxLength={9} inputMode="numeric" />
        <p className="text-xs text-muted-foreground">Your Botswana national identity number (7–9 digits)</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Mobile Phone</Label>
        <div className="relative">
          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input id="phone" type="tel" placeholder="+267 71 234 567"
            value={form.phone} onChange={e => set('phone', e.target.value)}
            className="px-3 pl-8" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input id="dob" type="date"
          value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
          className="px-3" max={new Date().toISOString().split('T')[0]} />
      </div>
      <div className="space-y-1.5">
        <Label>Gender *</Label>
        <div className="flex gap-2 flex-wrap">
          {GENDER_OPTIONS.map(g => (
            <button
              key={g} type="button"
              onClick={() => set('gender', g)}
              className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors
                ${form.gender === g
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-accent hover:text-foreground'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Step 3: Location ───────────────────────────────────────────
function StepLocation({ form, set }: { form: FormData; set: (k: keyof FormData, v: string | boolean) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>District *</Label>
        <Select value={form.district} onValueChange={v => set('district', v)}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select your district…" />
          </SelectTrigger>
          <SelectContent>
            {BOTSWANA_DISTRICTS.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">The district where your farm is located</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="village">Village / Town</Label>
        <Input id="village" placeholder="e.g. Mochudi"
          value={form.village} onChange={e => set('village', e.target.value)}
          className="px-3" />
      </div>

      {/* District map hint */}
      {form.district && (
        <div className="p-3 bg-accent/10 border border-accent/30 rounded text-xs text-accent flex items-start gap-2">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>You selected <strong>{form.district}</strong> district. Extension officers and veterinary services in this area will be assigned to your account.</span>
        </div>
      )}
    </>
  );
}

// ── Step 4: Review & Agreement ─────────────────────────────────
function StepReview({ form, set }: { form: FormData; set: (k: keyof FormData, v: string | boolean) => void }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Full Name', value: form.full_name },
    { label: 'Email', value: form.email },
    { label: 'Omang Number', value: '•'.repeat(form.omang_number.length > 3 ? form.omang_number.length - 3 : 0) + form.omang_number.slice(-3) },
    { label: 'Phone', value: form.phone || '—' },
    { label: 'Date of Birth', value: form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString() : '—' },
    { label: 'Gender', value: form.gender || '—' },
    { label: 'District', value: form.district },
    { label: 'Village', value: form.village || '—' },
  ];

  return (
    <>
      {/* Summary table */}
      <div className="rounded border border-border overflow-hidden">
        {rows.map((r, i) => (
          <div key={r.label} className={`flex items-center justify-between gap-4 px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
            <span className="text-muted-foreground shrink-0">{r.label}</span>
            <span className="text-foreground font-medium text-right truncate max-w-[60%]">{r.value}</span>
          </div>
        ))}
      </div>

      {/* Account status note */}
      <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
        <AlertCircle size={13} className="mt-0.5 shrink-0" />
        <p>Your account will have <strong>pending verification</strong> status. A ministry official will verify your Omang number and activate full access.</p>
      </div>

      {/* Agreement checkbox */}
      <div className="flex items-start gap-2.5 pt-1">
        <Checkbox
          id="agree"
          checked={form.agreed}
          onCheckedChange={v => set('agreed', !!v)}
          className="mt-0.5"
        />
        <label htmlFor="agree" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          I agree to the{' '}
          <span className="text-accent underline cursor-pointer">Temo-Thuo AI User Agreement</span>{' '}
          and{' '}
          <span className="text-accent underline cursor-pointer">Privacy Policy</span>.
          I confirm the information provided is accurate.
        </label>
      </div>
    </>
  );
}
