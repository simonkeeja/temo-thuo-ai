import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Zap } from 'lucide-react';
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
import StatCard from '@/components/common/StatCard';

const DEVICE_TYPES = ['Bio-Sentinel Microchip', 'Crop-Guardian Sensor', 'Weather Station', 'Camera', 'RFID Reader', 'GPS Tracker', 'Gateway', 'Other'];
const PROTOCOLS = ['LoRaWAN', 'WiFi', 'Bluetooth', 'MQTT', 'HTTP', 'Zigbee', 'NB-IoT', '4G/LTE'];

export default function IoTPage() {
  const [tab, setTab] = useState('devices');
  const [devices, setDevices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [form, setForm] = useState({ device_type: '', serial_number: '', protocol: '', farm_id: '', field_id: '', installation_date: '' });
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<any[]>([]);

  const [stats, setStats] = useState({ online: 0, offline: 0, fault: 0, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('sensors').select(`id, sensor_code, device_type, serial_number, status, last_reading_at, installation_date, created_at, farms(farm_name), crop_fields(field_name)`, { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    const { data, count } = await q.order('created_at', { ascending: false }).limit(50);
    const list = Array.isArray(data) ? data : [];
    setDevices(list); setTotal(count ?? 0);
    setStats({ online: list.filter(d => d.status === 'active').length, offline: list.filter(d => d.status === 'inactive').length, fault: list.filter(d => d.status === 'faulty').length, total: count ?? 0 });
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); supabase.from('farms').select('id, farm_name').limit(200).then(({ data }) => setFarms(Array.isArray(data) ? data : [])); }, [load]);
  useEffect(() => { if (form.farm_id) supabase.from('crop_fields').select('id, field_name').eq('farm_id', form.farm_id).then(({ data }) => setFields(Array.isArray(data) ? data : [])); }, [form.farm_id]);

  const filtered = devices.filter(d => !search || d.sensor_code?.toLowerCase().includes(search.toLowerCase()) || d.device_type?.toLowerCase().includes(search.toLowerCase()) || (d.farms as any)?.farm_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('sensors').insert({ device_type: form.device_type, serial_number: form.serial_number || null, farm_id: form.farm_id || null, field_id: form.field_id || null, installation_date: form.installation_date || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('IoT device registered'); setShowNew(false); load();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">IoT Device Management</h2><p className="text-xs text-muted-foreground">{total} devices in system</p></div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />Register Device</Button>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Devices" value={stats.total} icon={<Zap size={14} />} />
          <StatCard label="Online" value={stats.online} icon={<Zap size={14} />} accent />
          <StatCard label="Offline" value={stats.offline} icon={<Zap size={14} />} />
          <StatCard label="Fault" value={stats.fault} icon={<Zap size={14} />} />
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search devices…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Online</SelectItem><SelectItem value="inactive">Offline</SelectItem><SelectItem value="faulty">Fault</SelectItem><SelectItem value="under_maintenance">Maintenance</SelectItem></SelectContent>
          </Select>
        </div>

        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Device Code','Type','Serial #','Farm','Field','Last Communication','Status','Installed'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No devices found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.sensor_code}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.device_type}</td>
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{r.serial_number || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farms as any)?.farm_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.crop_fields as any)?.field_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{r.last_reading_at ? new Date(r.last_reading_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{r.installation_date ? new Date(r.installation_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Register IoT Device</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Device Type *</Label>
                <Select value={form.device_type} onValueChange={v => setForm(f => ({ ...f, device_type: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{DEVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Serial Number</Label><Input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} className="px-3 font-mono" /></div>
              <div className="space-y-1"><Label>Protocol</Label>
                <Select value={form.protocol} onValueChange={v => setForm(f => ({ ...f, protocol: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PROTOCOLS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Farm</Label>
                <Select value={form.farm_id} onValueChange={v => setForm(f => ({ ...f, farm_id: v, field_id: '' }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>{farms.map(f => <SelectItem key={f.id} value={f.id}>{f.farm_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Field</Label>
                <Select value={form.field_id} onValueChange={v => setForm(f => ({ ...f, field_id: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                  <SelectContent>{fields.map(f => <SelectItem key={f.id} value={f.id}>{f.field_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Installation Date</Label><Input type="date" value={form.installation_date} onChange={e => setForm(f => ({ ...f, installation_date: e.target.value }))} className="px-3" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.device_type}>{saving ? 'Saving…' : 'Register'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
