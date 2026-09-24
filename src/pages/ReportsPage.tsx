import React, { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const REPORT_CATALOG = [
  { id: 'farmers', name: 'Farmer Registry Report', desc: 'Complete list of registered farmers by district, status, and date range.', module: 'FRM', table: 'farmers' },
  { id: 'farms', name: 'Farm Registry Report', desc: 'All farms with GPS, size, type, and verification status.', module: 'FAM', table: 'farms' },
  { id: 'livestock', name: 'Livestock Census Report', desc: 'Animal registrations by species, breed, farm, and health status.', module: 'LIV', table: 'animals' },
  { id: 'microchips', name: 'Bio-Sentinel Microchip Report', desc: 'Microchip lifecycle status, activations, and recoveries.', module: 'BIO', table: 'microchips' },
  { id: 'disease', name: 'Disease Surveillance Report', desc: 'Active, contained, and resolved disease cases by area.', module: 'VET', table: 'disease_cases' },
  { id: 'vaccinations', name: 'Vaccination Coverage Report', desc: 'Vaccination records by vaccine type, batch, and animal.', module: 'VET', table: 'vaccinations' },
  { id: 'marketplace', name: 'Marketplace Activity Report', desc: 'Listings, orders, and transaction volumes by category.', module: 'MKT', table: 'marketplace_listings' },
  { id: 'payments', name: 'Financial Transactions Report', desc: 'All payment transactions by status, method, and date.', module: 'PAY', table: 'payments' },
  { id: 'insurance', name: 'Insurance Portfolio Report', desc: 'Policies, claims, and compensation by type and status.', module: 'INS', table: 'insurance_policies' },
  { id: 'sensors', name: 'Crop-Guardian Sensor Report', desc: 'Sensor health, reading history, and alert statistics.', module: 'CGS', table: 'sensors' },
  { id: 'devices', name: 'Device Asset Report', desc: 'Full device inventory, assignments, and warranty status.', module: 'DAMS', table: 'devices' },
  { id: 'iot', name: 'IoT Connectivity Report', desc: 'Device uptime, communication failures, and event logs.', module: 'IOT', table: 'sensors' },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [reportData, setReportData] = useState<{ report: typeof REPORT_CATALOG[0]; rows: any[]; generatedAt: Date } | null>(null);

  const handleGenerate = async (report: typeof REPORT_CATALOG[0]) => {
    setGenerating(report.id);
    let q = (supabase.from(report.table as any) as any).select('*');
    if (dateFrom) q = q.gte('created_at', dateFrom);
    if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59');
    q = q.order('created_at', { ascending: false }).limit(500);
    const { data, error } = await q;
    setGenerating(null);
    if (error) { toast.error(error.message); return; }
    setReportData({ report, rows: Array.isArray(data) ? data : [], generatedAt: new Date() });
    toast.success(`Report generated: ${report.name}`);
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.rows.length === 0) return;
    const keys = Object.keys(reportData.rows[0]);
    const csv = [keys.join(','), ...reportData.rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${reportData.report.id}_${Date.now()}.csv`; a.click();
    toast.success('CSV exported');
  };

  const filtered = moduleFilter === 'all' ? REPORT_CATALOG : REPORT_CATALOG.filter(r => r.module.startsWith(moduleFilter));
  const modules = Array.from(new Set(REPORT_CATALOG.map(r => r.module)));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">Reporting & Analytics</h2><p className="text-xs text-muted-foreground">{REPORT_CATALOG.length} standard reports available</p></div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-end">
          <div className="space-y-1"><Label className="text-xs">Date From</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs px-3 w-36" /></div>
          <div className="space-y-1"><Label className="text-xs">Date To</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs px-3 w-36" /></div>
          <div className="space-y-1"><Label className="text-xs">Module</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Modules</SelectItem>{modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Report grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => (
            <Card key={r.id} className="border-border hover:border-accent/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded shrink-0"><FileText size={14} className="text-accent" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                    <span className="text-xs font-mono text-accent/70 mt-1 inline-block">{r.module}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full text-xs h-7 gap-1.5" onClick={() => handleGenerate(r)} disabled={generating === r.id}>
                  {generating === r.id ? 'Generating…' : <><FileText size={12} />Generate Report</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Output */}
        {reportData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold">{reportData.report.name}</h3>
                <p className="text-xs text-muted-foreground">Generated {reportData.generatedAt.toLocaleString()} · {reportData.rows.length} records</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCSV} disabled={reportData.rows.length === 0}><Download size={12} />Export CSV</Button>
            </div>
            {reportData.rows.length === 0 ? (
              <div className="border border-border p-8 text-center text-xs text-muted-foreground">No data found for selected filters.</div>
            ) : (
              <div className="border border-border bg-card overflow-x-auto max-h-80">
                <table className="w-full text-xs min-w-max">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr className="border-b border-border">
                      {Object.keys(reportData.rows[0]).slice(0, 10).map(k => (
                        <th key={k} className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                        {Object.keys(row).slice(0, 10).map(k => (
                          <td key={k} className="px-4 py-2 whitespace-nowrap max-w-[150px] truncate" title={String(row[k] ?? '')}>{String(row[k] ?? '—')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
