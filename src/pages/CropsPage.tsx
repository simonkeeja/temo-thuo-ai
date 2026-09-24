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
import { toast } from 'sonner';
import { BOTSWANA_DISTRICTS } from '@/types/types';

export default function CropsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [totalFields, setTotalFields] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState({ farm_id: '', field_name: '', field_size_ha: '', crop_type: '', gps_lat: '', gps_lng: '' });
  const [saving, setSaving] = useState(false);

  // Planting records
  const [plantingRecords, setPlantingRecords] = useState<any[]>([]);
  const [harvestRecords, setHarvestRecords] = useState<any[]>([]);

  const loadFields = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase.from('crop_fields').select(`id, field_code, field_name, field_size_ha, crop_type, status, created_at, farms(farm_name, district)`, { count: 'exact' }).order('created_at', { ascending: false }).limit(50);
    setFields(Array.isArray(data) ? data : []); setTotalFields(count ?? 0); setLoading(false);
  }, []);

  useEffect(() => { loadFields(); supabase.from('farms').select('id, farm_name').limit(200).then(({ data }) => setFarms(Array.isArray(data) ? data : [])); }, [loadFields]);

  const filtered = fields.filter(r => !search || r.field_name?.toLowerCase().includes(search.toLowerCase()) || r.crop_type?.toLowerCase().includes(search.toLowerCase()) || (r.farms as any)?.farm_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('crop_fields').insert({ farm_id: form.farm_id, field_name: form.field_name, field_size_ha: form.field_size_ha ? parseFloat(form.field_size_ha) : null, crop_type: form.crop_type || null, gps_lat: form.gps_lat ? parseFloat(form.gps_lat) : null, gps_lng: form.gps_lng ? parseFloat(form.gps_lng) : null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Crop field registered'); setShowNew(false); loadFields();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">Crop Management</h2><p className="text-xs text-muted-foreground">{totalFields} crop fields registered</p></div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Register Field</Button>
        </div>
        <div className="relative max-w-sm"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search fields…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Field ID','Field Name','Crop Type','Size (ha)','Farm','Status','Registered'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No crop fields found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.field_code}</td>
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{r.field_name}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.crop_type || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.field_size_ha ?? '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farms as any)?.farm_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Register Crop Field</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Farm *</Label>
                <Select value={form.farm_id} onValueChange={v => setForm(f => ({ ...f, farm_id: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Field Name *</Label><Input required value={form.field_name} onChange={e => setForm(f => ({ ...f, field_name: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Crop Type</Label>
                <Select value={form.crop_type} onValueChange={v => setForm(f => ({ ...f, crop_type: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{['Maize','Sorghum','Sunflower','Cowpeas','Groundnuts','Millet','Watermelon','Vegetables','Other'].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Size (ha)</Label><Input type="number" step="0.01" value={form.field_size_ha} onChange={e => setForm(f => ({ ...f, field_size_ha: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>GPS Lat</Label><Input type="number" step="0.0000001" value={form.gps_lat} onChange={e => setForm(f => ({ ...f, gps_lat: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>GPS Lng</Label><Input type="number" step="0.0000001" value={form.gps_lng} onChange={e => setForm(f => ({ ...f, gps_lng: e.target.value }))} className="px-3" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.farm_id}>{saving ? 'Saving…' : 'Register Field'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
