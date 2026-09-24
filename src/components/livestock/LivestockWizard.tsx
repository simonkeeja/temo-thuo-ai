import React, { useState, useRef, useCallback } from 'react';
import {
  Cpu, Tag, ClipboardList, ChevronRight, Check,
  Upload, Camera, Loader2, AlertCircle, RefreshCw,
  X, ZoomIn, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SPECIES_OPTIONS } from '@/types/types';

/* ── Types ─────────────────────────────────────────────────────── */
interface WizardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  farms: Array<{ id: string; farm_name: string }>;
  farmers: Array<{ id: string; farmer_code: string; profiles?: { full_name?: string } }>;
  isFarmer: boolean;
  myFarmerId: string | null;
  onSuccess: () => void;
}

interface WizardForm {
  // Step 1 — Bio-Sentinel Microchip
  microchip_id: string;
  farm_id: string;
  farmer_id: string;
  // Step 2 — Ear-Tag
  ear_tag_number: string;
  ear_tag_photo_url: string;
  // Step 3 — Animal Details
  species: string;
  breed: string;
  sex: string;
  date_of_birth: string;
  estimated_age_months: string;
  coat_colour: string;
  weight_kg: string;
  identification_marks: string;
  notes: string;
}

const EMPTY_FORM: WizardForm = {
  microchip_id: '', farm_id: '', farmer_id: '',
  ear_tag_number: '', ear_tag_photo_url: '',
  species: '', breed: '', sex: '', date_of_birth: '',
  estimated_age_months: '', coat_colour: '', weight_kg: '',
  identification_marks: '', notes: '',
};

const STEPS = [
  { id: 1, label: 'Bio-Sentinel Chip', icon: <Cpu size={14} /> },
  { id: 2, label: 'Ear-Tag Photo',     icon: <Tag size={14} /> },
  { id: 3, label: 'Animal Details',    icon: <ClipboardList size={14} /> },
];

/* ── Image compression helper ──────────────────────────────────── */
async function compressImage(file: File, maxBytes = 1_000_000): Promise<File> {
  if (file.size <= maxBytes) return file;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1080;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          if (blob.size <= maxBytes || quality <= 0.3) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
          } else { quality -= 0.1; tryCompress(); }
        }, 'image/webp', quality);
      };
      tryCompress();
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ── Main Wizard Component ─────────────────────────────────────── */
export function LivestockWizard({ open, onOpenChange, farms, farmers, isFarmer, myFarmerId, onSuccess }: WizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>({ ...EMPTY_FORM, farmer_id: myFarmerId ?? '' });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof WizardForm, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleClose = () => {
    setStep(1);
    setForm({ ...EMPTY_FORM, farmer_id: myFarmerId ?? '' });
    onOpenChange(false);
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.farm_id) return 'Please select a farm.';
      if (!isFarmer && !form.farmer_id) return 'Please select a farmer.';
      if (!form.microchip_id.trim()) return 'Bio-Sentinel Microchip ID is required.';
    }
    if (step === 2) {
      if (!form.ear_tag_number.trim()) return 'Ear-tag number is required. Scan or enter it manually.';
    }
    if (step === 3) {
      if (!form.species) return 'Please select the animal species.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setSaving(true);
    const { error } = await supabase.from('animals').insert({
      farm_id: form.farm_id,
      farmer_id: isFarmer ? myFarmerId : (form.farmer_id || null),
      species: form.species,
      breed: form.breed || null,
      sex: form.sex || null,
      date_of_birth: form.date_of_birth || null,
      estimated_age_months: form.estimated_age_months ? parseInt(form.estimated_age_months) : null,
      coat_colour: form.coat_colour || null,
      identification_marks: form.identification_marks || null,
      microchip_id: form.microchip_id.trim() || null,
      ear_tag_number: form.ear_tag_number.trim() || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      notes: [
        form.notes,
        form.ear_tag_photo_url ? `Ear-tag photo: ${form.ear_tag_photo_url}` : '',
      ].filter(Boolean).join(' | ') || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Animal registered successfully!');
    onSuccess();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Register New Animal
          </DialogTitle>
        </DialogHeader>

        {/* Step progress bar */}
        <div className="flex gap-1 mb-1">
          {STEPS.map(s => (
            <div key={s.id} className={`flex-1 h-1 rounded-full transition-colors ${
              step > s.id ? 'bg-accent' : step === s.id ? 'bg-primary' : 'bg-muted'
            }`} />
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-between mb-4">
          {STEPS.map(s => (
            <div key={s.id} className={`flex items-center gap-1 text-[11px] transition-colors ${
              step === s.id ? 'text-foreground font-semibold' : step > s.id ? 'text-accent' : 'text-muted-foreground'
            }`}>
              {step > s.id ? <Check size={10} /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </div>
          ))}
        </div>

        {/* Step panels */}
        {step === 1 && <Step1Chip form={form} set={set} farms={farms} farmers={farmers} isFarmer={isFarmer} />}
        {step === 2 && <Step2EarTag form={form} set={set} />}
        {step === 3 && <Step3Details form={form} set={set} />}

        {/* Navigation */}
        <div className="flex gap-2 pt-4 border-t border-border mt-2">
          {step > 1 && (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setStep(s => s - 1)} disabled={saving}>
              Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose} disabled={saving}>Cancel</Button>
          {step < 3 ? (
            <Button size="sm" className="flex-1 gap-1.5" onClick={handleNext}>
              Continue <ChevronRight size={13} />
            </Button>
          ) : (
            <Button size="sm" className="flex-1 gap-1.5" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 size={13} className="animate-spin" />Registering…</> : <><Check size={13} />Register Animal</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Step 1: Bio-Sentinel Microchip ────────────────────────────── */
function Step1Chip({ form, set, farms, farmers, isFarmer }: {
  form: WizardForm;
  set: (k: keyof WizardForm, v: string) => void;
  farms: Array<{ id: string; farm_name: string }>;
  farmers: Array<{ id: string; farmer_code: string; profiles?: { full_name?: string } }>;
  isFarmer: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/30 rounded text-xs text-accent">
        <Cpu size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">Step 1 — Bio-Sentinel AI Microchip</p>
          <p className="text-accent/80">Insert the Bio-Sentinel microchip using an approved livestock implantation device, then enter or scan the unique chip identifier below.</p>
        </div>
      </div>

      {!isFarmer && (
        <div className="space-y-1.5">
          <Label className="text-xs">Farmer *</Label>
          <Select value={form.farmer_id} onValueChange={v => set('farmer_id', v)}>
            <SelectTrigger className="text-xs"><SelectValue placeholder="Select farmer" /></SelectTrigger>
            <SelectContent>
              {farmers.map(f => (
                <SelectItem key={f.id} value={f.id} className="text-xs">
                  {(f.profiles as any)?.full_name || f.farmer_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs">Farm *</Label>
        <Select value={form.farm_id} onValueChange={v => set('farm_id', v)}>
          <SelectTrigger className="text-xs"><SelectValue placeholder="Select farm" /></SelectTrigger>
          <SelectContent>
            {farms.map(f => (
              <SelectItem key={f.id} value={f.id} className="text-xs">{f.farm_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Bio-Sentinel Microchip ID *</Label>
        <div className="relative">
          <Cpu size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="e.g. BSM-2024-000001"
            value={form.microchip_id}
            onChange={e => set('microchip_id', e.target.value.toUpperCase())}
            className="pl-8 px-3 font-mono text-sm"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">The unique identifier printed on or transmitted by the implanted chip</p>
      </div>
    </div>
  );
}

/* ── Step 2: Ear-Tag Photo + OCR ───────────────────────────────── */
function Step2EarTag({ form, set }: {
  form: WizardForm;
  set: (k: keyof WizardForm, v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(form.ear_tag_photo_url || '');
  const [ocrRaw, setOcrRaw] = useState('');
  const [ocrDone, setOcrDone] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowed.includes(file.type)) { toast.error('Please upload a JPEG, PNG, WEBP, or AVIF image.'); return; }

    setUploading(true);
    try {
      // Compress if needed
      let toUpload = file;
      if (file.size > 1_000_000) {
        toast.info('Compressing image…');
        toUpload = await compressImage(file);
        toast.success(`Compressed to ${(toUpload.size / 1024).toFixed(0)} KB`);
      }

      // Upload to Supabase Storage
      const ext = toUpload.name.split('.').pop() ?? 'webp';
      const path = `ear-tags/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('ear-tag-photos')
        .upload(path, toUpload, { contentType: toUpload.type, upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('ear-tag-photos').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setPhotoUrl(publicUrl);
      set('ear_tag_photo_url', publicUrl);
      toast.success('Photo uploaded. Running OCR…');

      // Run OCR via Edge Function
      await runOcr(publicUrl);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [set]);

  const runOcr = async (url: string) => {
    setScanning(true);
    setOcrDone(false);
    try {
      const { data, error } = await supabase.functions.invoke('ocr-ear-tag', {
        body: { imageUrl: url },
      });
      if (error) throw error;
      const body = data as any;
      setOcrRaw(body.rawText ?? '');
      if (body.extractedTag) {
        set('ear_tag_number', body.extractedTag);
        toast.success(`Ear-tag detected: ${body.extractedTag}`);
      } else {
        toast.warning('OCR could not detect a tag number. Please enter it manually.');
      }
      setOcrDone(true);
    } catch (err: any) {
      toast.error('OCR failed: ' + (err.message || 'Unknown error'));
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
        <Tag size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">Step 2 — Ear-Tag Scanning</p>
          <p className="text-blue-400/80">Photograph the official livestock ear tag. AI will automatically extract the ear-tag number using OCR.</p>
        </div>
      </div>

      {/* Upload zone */}
      {!photoUrl ? (
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-accent animate-spin" />
              <p className="text-xs text-muted-foreground">Uploading & scanning…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                <Camera size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload Ear-Tag Photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click to select · JPEG, PNG, WEBP · Auto-compressed</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 mt-1" type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload size={12} /> Choose Photo
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Photo preview + OCR result */
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted/10 group">
            <img
              src={photoUrl}
              alt="Ear tag"
              className="w-full h-40 object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewZoom(true)}
                className="w-7 h-7 bg-black/60 rounded flex items-center justify-center text-white hover:bg-black/80"
                title="Zoom"
              >
                <ZoomIn size={12} />
              </button>
              <button
                type="button"
                onClick={() => { setPhotoUrl(''); set('ear_tag_photo_url', ''); setOcrRaw(''); setOcrDone(false); }}
                className="w-7 h-7 bg-black/60 rounded flex items-center justify-center text-white hover:bg-black/80"
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
            {(scanning || uploading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 size={22} className="animate-spin" />
                  <p className="text-xs">{uploading ? 'Uploading…' : 'Reading ear tag…'}</p>
                </div>
              </div>
            )}
          </div>

          {/* OCR status */}
          {ocrDone && (
            <div className={`flex items-start gap-2 p-2.5 rounded text-xs border ${
              form.ear_tag_number
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              {form.ear_tag_number
                ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
                : <AlertCircle size={13} className="mt-0.5 shrink-0" />}
              <div>
                {form.ear_tag_number
                  ? <><span className="font-medium">OCR detected: </span><span className="font-mono">{form.ear_tag_number}</span></>
                  : <span>Could not detect tag number automatically. Please enter manually.</span>}
                {ocrRaw && <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">Raw: {ocrRaw}</p>}
              </div>
            </div>
          )}

          {/* Re-scan button */}
          {ocrDone && !scanning && (
            <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs" type="button" onClick={() => runOcr(photoUrl)}>
              <RefreshCw size={12} /> Re-scan Photo
            </Button>
          )}
        </div>
      )}

      {/* Manual ear-tag input */}
      <div className="space-y-1.5">
        <Label className="text-xs">Ear-Tag Number * <span className="text-muted-foreground font-normal">(auto-filled by OCR, or enter manually)</span></Label>
        <div className="relative">
          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="e.g. BTW-001234"
            value={form.ear_tag_number}
            onChange={e => set('ear_tag_number', e.target.value.toUpperCase())}
            className="pl-8 px-3 font-mono text-sm"
          />
        </div>
      </div>

      {/* Zoom overlay */}
      {previewZoom && photoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewZoom(false)}
        >
          <img src={photoUrl} alt="Ear tag zoom" className="max-w-full max-h-full object-contain rounded" />
        </div>
      )}
    </div>
  );
}

/* ── Step 3: Animal Details ─────────────────────────────────────── */
function Step3Details({ form, set }: {
  form: WizardForm;
  set: (k: keyof WizardForm, v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
        <ClipboardList size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">Step 3 — Animal Profile</p>
          <p className="text-green-400/80">Complete the animal's profile. This creates the permanent digital identity linking chip, tag, and owner.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Species *</Label>
          <Select value={form.species} onValueChange={v => set('species', v)}>
            <SelectTrigger className="text-xs"><SelectValue placeholder="Select species" /></SelectTrigger>
            <SelectContent>{SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Breed</Label>
          <Input placeholder="e.g. Nguni" value={form.breed} onChange={e => set('breed', e.target.value)} className="px-3 text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sex</Label>
          <Select value={form.sex} onValueChange={v => set('sex', v)}>
            <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male" className="text-xs">Male</SelectItem>
              <SelectItem value="Female" className="text-xs">Female</SelectItem>
              <SelectItem value="Unknown" className="text-xs">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Date of Birth</Label>
          <Input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className="px-3 text-xs" max={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Est. Age (months)</Label>
          <Input type="number" placeholder="e.g. 24" min="0" value={form.estimated_age_months} onChange={e => set('estimated_age_months', e.target.value)} className="px-3 text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Coat Colour</Label>
          <Input placeholder="e.g. Brown/White" value={form.coat_colour} onChange={e => set('coat_colour', e.target.value)} className="px-3 text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Weight (kg)</Label>
          <Input type="number" step="0.1" placeholder="e.g. 350.5" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} className="px-3 text-xs" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Identification Marks</Label>
          <Input placeholder="e.g. White patch on left ear" value={form.identification_marks} onChange={e => set('identification_marks', e.target.value)} className="px-3 text-xs" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Input placeholder="Any additional observations…" value={form.notes} onChange={e => set('notes', e.target.value)} className="px-3 text-xs" />
        </div>
      </div>

      {/* Registration summary */}
      <div className="p-3 bg-muted/20 border border-border rounded space-y-1.5 text-xs">
        <p className="font-medium text-foreground mb-2">Registration Summary</p>
        {[
          ['Microchip ID', form.microchip_id || '—'],
          ['Ear-Tag Number', form.ear_tag_number || '—'],
          ['Species', form.species || '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
