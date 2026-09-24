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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SENSOR_TYPES = ['Soil Moisture','Temperature','Humidity','Rainfall','Soil pH','CO2'];

export default function SensorsPage() {
  const [sensors, setSensors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [form, setForm] = useState({ device_type: '', serial_number: '', farm_id: '', field_id: '', installation_date: '' });
  const [saving, setSaving] = useState(false);
  // Latest readings per sensor
  const [readings, setReadings] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('sensors').select(`id, sensor_code, device_type, serial_number, status, last_reading_at, firmware_version, installation_date, created_at, farms(farm_name), crop_fields(field_name)`, { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, count } = await q.order('created_at', { ascending: false }).limit(50);
    const sensorList = Array.isArray(data) ? data : [];
    setSensors(sensorList); setTotal(count ?? 0); setLoading(false);

    // Load latest readings
    if (sensorList.length > 0) {
      const ids = sensorList.map(s => s.id);
      const { data: rdData } = await supabase.from('sensor_readings').select('sensor_id, reading_type, value, unit, recorded_at').in('sensor_id', ids).order('recorded_at', { ascending: false }).limit(ids.length * 5);
      const map: Record<string, any> = {};
      (rdData || []).forEach(r => { if (!map[r.sensor_id]) map[r.sensor_id] = r; });
      setReadings(map);
    }
  }, [statusFilter]);

  useEffect(() => { load(); supabase.from('farms').select('id, farm_name').limit(200).then(({ data }) => setFarms(Array.isArray(data) ? data : [])); }, [load]);
  useEffect(() => { if (form.farm_id) supabase.from('crop_fields').select('id, field_name').eq('farm_id', form.farm_id).then(({ data }) => setFields(Array.isArray(data) ? data : [])); }, [form.farm_id]);

  const filtered = sensors.filter(s => !search || s.sensor_code?.toLowerCase().includes(search.toLowerCase()) || s.device_type?.toLowerCase().includes(search.toLowerCase()) || (s.farms as any)?.farm_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('sensors').insert({ device_type: form.device_type, serial_number: form.serial_number || null, farm_id: form.farm_id || null, field_id: form.field_id || null, installation_date: form.installation_date || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Sensor registered'); setShowNew(false); load();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">Crop-Guardian AI Sensor Management</h2><p className="text-xs text-muted-foreground">{total} sensors registered</p></div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Register Sensor</Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search sensors…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); }}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Online</SelectItem><SelectItem value="inactive">Offline</SelectItem><SelectItem value="faulty">Fault</SelectItem></SelectContent>
          </Select>
        </div>

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Sensor Code','Type','Serial #','Farm','Field','Last Reading','Status','Installed'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No sensors found</td></tr>
              : filtered.map(r => {
                const rd = readings[r.id];
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.sensor_code}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.device_type}</td>
                    <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{r.serial_number || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{(r.farms as any)?.farm_name || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{(r.crop_fields as any)?.field_name || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{rd ? `${rd.value} ${rd.unit || ''} (${rd.reading_type})` : '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{r.installation_date ? new Date(r.installation_date).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Register Crop-Guardian Sensor</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Sensor Type *</Label>
                <Select value={form.device_type} onValueChange={v => setForm(f => ({ ...f, device_type: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select sensor type" /></SelectTrigger>
                  <SelectContent>{SENSOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Serial Number</Label><Input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} className="px-3 font-mono" /></div>
              <div className="space-y-1"><Label>Farm</Label>
                <Select value={form.farm_id} onValueChange={v => setForm(f => ({ ...f, farm_id: v, field_id: '' }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>{farms.map(fm => <SelectItem key={fm.id} value={fm.id}>{fm.farm_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Crop Field</Label>
                <Select value={form.field_id} onValueChange={v => setForm(f => ({ ...f, field_id: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                  <SelectContent>{fields.map(f => <SelectItem key={f.id} value={f.id}>{f.field_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Installation Date</Label><Input type="date" value={form.installation_date} onChange={e => setForm(f => ({ ...f, installation_date: e.target.value }))} className="px-3" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.device_type}>{saving ? 'Saving…' : 'Register Sensor'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
