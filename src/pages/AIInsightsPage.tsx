import React, { useEffect, useState, useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Droplets, Thermometer, Activity, Leaf, RefreshCw } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/common/StatCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';

// Simulated AI insight cards since AI engine is backend-dependent
const AI_INSIGHTS = [
  { id: 1, type: 'health_risk', title: 'FMD Risk Alert', summary: 'Elevated risk of Foot-and-Mouth Disease in Southern District based on seasonal patterns and recent movement data.', confidence: 78, severity: 'high', affected: 'Cattle — Southern District', recommendation: 'Schedule emergency vaccinations for all cattle within 50km radius. Restrict movement permits.' },
  { id: 2, type: 'crop_health', title: 'Water Stress Detected', summary: 'Soil moisture sensors in Kweneng region indicate below-threshold readings for 3 consecutive days.', confidence: 91, severity: 'medium', affected: 'Maize fields — Kweneng District', recommendation: 'Increase irrigation frequency by 40%. Check irrigation system for faults.' },
  { id: 3, type: 'yield_forecast', title: 'Sorghum Yield Forecast', summary: 'AI models project 15% above-average sorghum yield for Central District based on current soil conditions.', confidence: 83, severity: 'positive', affected: 'Sorghum — Central District', recommendation: 'Pre-arrange storage and logistics. Consider early market placement.' },
  { id: 4, type: 'anomaly', title: 'Unusual Mortality Pattern', summary: 'Statistical anomaly detected: 3 farms in North East District reporting above-average goat mortality.', confidence: 72, severity: 'high', affected: 'Goats — North East District', recommendation: 'Deploy veterinary teams for immediate investigation. Isolate affected herds.' },
  { id: 5, type: 'vaccination', title: 'Vaccination Reminders', summary: '247 cattle are overdue for annual anthrax vaccination across 18 farms.', confidence: 99, severity: 'medium', affected: '247 cattle, 18 farms', recommendation: 'Generate vaccination campaign schedule. Notify farmers via SMS/WhatsApp.' },
  { id: 6, type: 'disease', title: 'LSD Containment Status', summary: 'Lumpy Skin Disease outbreak in Ghanzi District showing containment trend. Spread rate decreased by 60%.', confidence: 85, severity: 'improving', affected: 'Cattle — Ghanzi District', recommendation: 'Continue current quarantine protocols. Monitor perimeter farms daily.' },
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <AlertTriangle size={14} className="text-red-400" /> },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: <AlertTriangle size={14} className="text-yellow-400" /> },
  positive: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: <TrendingUp size={14} className="text-green-400" /> },
  improving: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: <CheckCircle2 size={14} className="text-blue-400" /> },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  health_risk: <Activity size={13} />, crop_health: <Leaf size={13} />, yield_forecast: <TrendingUp size={13} />,
  anomaly: <AlertTriangle size={13} />, vaccination: <CheckCircle2 size={13} />, disease: <Activity size={13} />,
};

export default function AIInsightsPage() {
  const [diseaseCases, setDiseaseCases] = useState<any[]>([]);
  const [recentVaccinations, setRecentVaccinations] = useState<any[]>([]);
  const [sensorAlerts, setSensorAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    const [dc, rv, sa] = await Promise.all([
      supabase.from('disease_cases').select('id, case_code, disease_name, status, affected_animals_count, outbreak_area, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('vaccinations').select('id, vaccine_type, next_due_date, animals(animal_code, species)').not('next_due_date', 'is', null).order('next_due_date', { ascending: true }).limit(5),
      supabase.from('sensor_readings').select('id, sensor_id, reading_type, value, unit, recorded_at').order('recorded_at', { ascending: false }).limit(10),
    ]);
    setDiseaseCases(Array.isArray(dc.data) ? dc.data : []);
    setRecentVaccinations(Array.isArray(rv.data) ? rv.data : []);
    setSensorAlerts(Array.isArray(sa.data) ? sa.data : []);
    setLoading(false);
    setRefreshTime(new Date());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2"><Brain size={18} className="text-accent" />AI Insights Dashboard</h2>
            <p className="text-xs text-muted-foreground">Intelligent analysis · Advisory only · Updated {refreshTime.toLocaleTimeString()}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={loadData}><RefreshCw size={13} />Refresh Analysis</Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="High Priority Alerts" value={AI_INSIGHTS.filter(i => i.severity === 'high').length} icon={<AlertTriangle size={14} />} accent />
          <StatCard label="Active Disease Cases" value={loading ? '…' : diseaseCases.filter(d => d.status === 'active').length} icon={<Activity size={14} />} />
          <StatCard label="Vaccinations Due" value={loading ? '…' : recentVaccinations.length} icon={<CheckCircle2 size={14} />} />
          <StatCard label="Sensor Readings" value={loading ? '…' : sensorAlerts.length} icon={<Thermometer size={14} />} />
        </div>

        {/* AI Advisory Cards */}
        <div>
          <h3 className="text-sm font-semibold mb-3">AI Recommendations & Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_INSIGHTS.map(insight => {
              const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.medium;
              return (
                <Card key={insight.id} className={`border ${cfg.bg}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-muted-foreground">{TYPE_ICONS[insight.type]}</span>
                        <CardTitle className="text-xs font-semibold truncate">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {cfg.icon}
                        <span className={`text-xs font-bold ${cfg.color}`}>{insight.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.affected}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    <p className="text-xs text-foreground/80">{insight.summary}</p>
                    <div className="p-2 bg-muted/40 rounded border border-border">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Recommendation:</p>
                      <p className="text-xs">{insight.recommendation}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence: {insight.confidence}%</span>
                      <span className={`font-semibold ${cfg.color} capitalize`}>{insight.severity}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Live data panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs">Active Disease Cases</CardTitle></CardHeader>
            <CardContent className="space-y-2 pb-3">
              {loading ? <p className="text-xs text-muted-foreground">Loading…</p>
              : diseaseCases.length === 0 ? <p className="text-xs text-muted-foreground">No active cases</p>
              : diseaseCases.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0"><p className="text-xs font-medium truncate">{c.disease_name}</p><p className="text-xs text-muted-foreground">{c.outbreak_area || '—'} · {c.affected_animals_count ?? 0} animals</p></div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs">Upcoming Vaccinations</CardTitle></CardHeader>
            <CardContent className="space-y-2 pb-3">
              {loading ? <p className="text-xs text-muted-foreground">Loading…</p>
              : recentVaccinations.length === 0 ? <p className="text-xs text-muted-foreground">All vaccinations up to date</p>
              : recentVaccinations.map(v => (
                <div key={v.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0"><p className="text-xs font-medium truncate">{v.vaccine_type}</p><p className="text-xs text-muted-foreground">{(v.animals as any)?.animal_code} · {(v.animals as any)?.species}</p></div>
                  <span className="text-xs text-yellow-400 shrink-0">{v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : '—'}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2"><CardTitle className="text-xs">Latest Sensor Readings</CardTitle></CardHeader>
            <CardContent className="space-y-2 pb-3">
              {loading ? <p className="text-xs text-muted-foreground">Loading…</p>
              : sensorAlerts.length === 0 ? <p className="text-xs text-muted-foreground">No sensor data</p>
              : sensorAlerts.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-2">
                  <p className="text-xs truncate">{r.reading_type}</p>
                  <span className="text-xs font-mono text-accent shrink-0">{r.value} {r.unit}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
