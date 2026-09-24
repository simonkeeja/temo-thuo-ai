import React, { useEffect, useState } from 'react';
import { Monitor, AlertTriangle, Activity, TrendingUp, Users, Leaf, Map, Radio, Zap, Globe2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import { RoleGuard } from '@/components/common/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';

const GOOGLE_MAPS_KEY = 'AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0';

const DISTRICTS = ['Central', 'Chobe', 'Ghanzi', 'Kgalagadi', 'Kgatleng', 'Kweneng', 'North East', 'North West', 'South East', 'Southern'];

export default function SituationRoomPage() {
  const [stats, setStats] = useState({ farmers: 0, farms: 0, animals: 0, fields: 0, sensors: 0, devices: 0, cases: 0, policies: 0 });
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const [f, fm, a, fl, sn, dv, dc, pol] = await Promise.all([
        supabase.from('farmers').select('id', { count: 'exact', head: true }),
        supabase.from('farms').select('id', { count: 'exact', head: true }),
        supabase.from('animals').select('id', { count: 'exact', head: true }),
        supabase.from('crop_fields').select('id', { count: 'exact', head: true }),
        supabase.from('sensors').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('disease_cases').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('insurance_policies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      setStats({ farmers: f.count ?? 0, farms: fm.count ?? 0, animals: a.count ?? 0, fields: fl.count ?? 0, sensors: sn.count ?? 0, devices: dv.count ?? 0, cases: dc.count ?? 0, policies: pol.count ?? 0 });
      const { data: caseData } = await supabase.from('disease_cases').select('id, case_code, disease_name, status, affected_animals_count, outbreak_area').order('created_at', { ascending: false }).limit(8);
      setCases(Array.isArray(caseData) ? caseData : []);
      setLastUpdated(new Date());
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  // Mock district data for the performance table
  const districtData = DISTRICTS.map(d => ({
    district: d,
    farmers: Math.floor(Math.random() * 500) + 50,
    livestock: Math.floor(Math.random() * 5000) + 200,
    cropFields: Math.floor(Math.random() * 100) + 10,
    activeCases: Math.floor(Math.random() * 3),
    status: Math.random() > 0.2 ? 'normal' : 'alert',
  }));

  return (
    <AppLayout>
      <RoleGuard
        allowedRoles={['admin', 'ministry_official', 'operations_team']}
        message="The National Situation Room is restricted to Ministry officials, Administrators, and Operations Team members only."
      >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded border border-accent/40">
              <Monitor size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold">National Situation Room</h2>
              <p className="text-xs text-muted-foreground">Ministry of Lands and Agriculture · National Agricultural Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.cases > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/15 border border-red-500/30 rounded">
                <AlertTriangle size={12} className="text-red-400" />
                <span className="text-xs text-red-400 font-medium">{stats.cases} ACTIVE OUTBREAK{stats.cases > 1 ? 'S' : ''}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* National KPIs */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">National Agricultural Performance Indicators</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <StatCard label="Farmers" value={loading ? '…' : stats.farmers} icon={<Users size={12} />} />
            <StatCard label="Farms" value={loading ? '…' : stats.farms} icon={<Globe2 size={12} />} />
            <StatCard label="Livestock" value={loading ? '…' : stats.animals} icon={<Activity size={12} />} accent />
            <StatCard label="Crop Fields" value={loading ? '…' : stats.fields} icon={<Leaf size={12} />} />
            <StatCard label="IoT Sensors" value={loading ? '…' : stats.sensors} icon={<Radio size={12} />} />
            <StatCard label="Devices" value={loading ? '…' : stats.devices} icon={<Zap size={12} />} />
            <StatCard label="Active Outbreaks" value={loading ? '…' : stats.cases} icon={<AlertTriangle size={12} />} accent={stats.cases > 0} />
            <StatCard label="Active Policies" value={loading ? '…' : stats.policies} icon={<TrendingUp size={12} />} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* National Map */}
          <div className="md:col-span-2 border border-border rounded overflow-hidden" style={{ minHeight: '380px' }}>
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
              <Map size={13} className="text-accent" />
              <span className="text-xs font-semibold">Botswana National Agricultural Map</span>
            </div>
            <iframe
              width="100%"
              height="350"
              frameBorder="0"
              style={{ border: 0, display: 'block' }}
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=Botswana&language=en&region=BW&zoom=6`}
              allowFullScreen
              title="Botswana National Map"
            />
          </div>

          {/* Disease Alerts */}
          <Card className="border-border">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-400" />Disease Surveillance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {loading ? (
                  <p className="text-xs text-muted-foreground p-4">Loading…</p>
                ) : cases.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-green-400 font-medium">No Active Outbreaks</p>
                    <p className="text-xs text-muted-foreground mt-1">Nationwide livestock health status: Normal</p>
                  </div>
                ) : cases.map(c => (
                  <div key={c.id} className="p-3 flex items-start gap-2">
                    <AlertTriangle size={11} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{c.disease_name}</p>
                      <p className="text-xs text-muted-foreground">{c.outbreak_area || 'Area TBD'} · {c.affected_animals_count ?? 0} animals</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* District Performance Table */}
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">District Agricultural Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/20">{['District','Farmers','Livestock','Crop Fields','Active Outbreaks','Status'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {districtData.map(d => (
                    <tr key={d.district} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{d.district}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{d.farmers.toLocaleString()}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{d.livestock.toLocaleString()}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{d.cropFields}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{d.activeCases > 0 ? <span className="text-red-400 font-semibold">{d.activeCases}</span> : <span className="text-green-400">0</span>}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge variant="outline" className={d.status === 'normal' ? 'border-green-500/40 text-green-400' : 'border-red-500/40 text-red-400'}>
                          {d.status === 'normal' ? 'Normal' : 'Alert'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      </RoleGuard>
    </AppLayout>
  );
}
