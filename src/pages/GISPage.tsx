import React, { useEffect, useState } from 'react';
import { Layers, MapPin, Activity } from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/common/StatusBadge';

const BOTSWANA_CENTER = { lat: -22.3285, lng: 24.6849 };
const GOOGLE_MAPS_KEY = 'AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0';

// Layer toggles
const LAYERS = [
  { id: 'farms', label: 'Farms', color: '#06B6D4' },
  { id: 'fields', label: 'Crop Fields', color: '#22C55E' },
  { id: 'sensors', label: 'Sensors', color: '#A855F7' },
  { id: 'disease', label: 'Disease Cases', color: '#EF4444' },
];

export default function GISPage() {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['farms', 'fields', 'sensors', 'disease']));
  const [farms, setFarms] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('farms').select('id, farm_code, farm_name, gps_lat, gps_lng, district, status').not('gps_lat', 'is', null).limit(50),
      supabase.from('crop_fields').select('id, field_code, field_name, gps_lat, gps_lng, status').not('gps_lat', 'is', null).limit(50),
      supabase.from('sensors').select('id, sensor_code, device_type, status').limit(20),
      supabase.from('disease_cases').select('id, case_code, disease_name, outbreak_area, status, affected_animals_count').eq('status', 'active').limit(20),
    ]).then(([fm, fl, sn, dc]) => {
      setFarms(Array.isArray(fm.data) ? fm.data : []);
      setFields(Array.isArray(fl.data) ? fl.data : []);
      setSensors(Array.isArray(sn.data) ? sn.data : []);
      setCases(Array.isArray(dc.data) ? dc.data : []);
      setLoading(false);
    });
  }, []);

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build map query param based on active data
  const hasGpsData = farms.filter(f => f.gps_lat && f.gps_lng).length > 0;

  return (
    <AppLayout>
      <div className="p-6 space-y-4 h-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">Geographic Information System</h2><p className="text-xs text-muted-foreground">National Agricultural Map — Botswana</p></div>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Layers size={13} />Layers:</span>
          {LAYERS.map(l => (
            <button key={l.id} onClick={() => toggleLayer(l.id)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded border transition-all ${activeLayers.has(l.id) ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:border-border/80'}`}
              style={activeLayers.has(l.id) ? { backgroundColor: l.color + '30', borderColor: l.color, color: l.color } : {}}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeLayers.has(l.id) ? l.color : '#6b7280' }} />{l.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ minHeight: '60vh' }}>
          {/* Main Map */}
          <div className="md:col-span-3 border border-border rounded overflow-hidden" style={{ minHeight: '500px' }}>
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, minHeight: '500px' }}
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=Botswana&language=en&region=BW&zoom=6`}
              allowFullScreen
              title="Botswana Agricultural Map"
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {activeLayers.has('farms') && (
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06B6D4]" />Farms ({farms.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1 pb-3">
                  {loading ? <p className="text-xs text-muted-foreground">Loading…</p>
                  : farms.length === 0 ? <p className="text-xs text-muted-foreground">No GPS data available</p>
                  : farms.slice(0, 6).map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="text-xs font-medium truncate">{f.farm_name}</p><p className="text-xs text-muted-foreground">{f.district}</p></div>
                      <StatusBadge status={f.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeLayers.has('disease') && (
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Active Disease Cases ({cases.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1 pb-3">
                  {cases.length === 0 ? <p className="text-xs text-muted-foreground">No active cases</p>
                  : cases.map(c => (
                    <div key={c.id} className="flex items-start gap-2">
                      <Activity size={10} className="text-red-400 mt-0.5 shrink-0" />
                      <div className="min-w-0"><p className="text-xs font-medium">{c.disease_name}</p><p className="text-xs text-muted-foreground">{c.outbreak_area || 'Area TBD'} · {c.affected_animals_count ?? 0} animals</p></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeLayers.has('sensors') && (
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />Sensors ({sensors.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1 pb-3">
                  {sensors.length === 0 ? <p className="text-xs text-muted-foreground">No sensors</p>
                  : sensors.slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs truncate">{s.device_type}</p>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeLayers.has('fields') && (
              <Card className="border-border">
                <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Crop Fields ({fields.length})</CardTitle></CardHeader>
                <CardContent className="space-y-1 pb-3">
                  {fields.length === 0 ? <p className="text-xs text-muted-foreground">No GPS data</p>
                  : fields.slice(0, 6).map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs truncate">{f.field_name}</p>
                      <StatusBadge status={f.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
