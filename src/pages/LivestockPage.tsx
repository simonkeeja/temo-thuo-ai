import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { LivestockWizard } from '@/components/livestock/LivestockWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPECIES_OPTIONS } from '@/types/types';

const PAGE_SIZE = 20;
// Roles that can register new animals
const CAN_REGISTER = ['farmer', 'admin', 'operations_team', 'extension_officer', 'veterinary_officer'];
// Roles that see ALL animals (others see own only)
const FULL_VIEW_ROLES = ['admin', 'operations_team', 'extension_officer', 'veterinary_officer', 'ministry_official', 'feedlot_operator', 'abattoir_officer'];
export default function LivestockPage() {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [myFarmerId, setMyFarmerId] = useState<string | null>(null);

  const isFarmer = role === 'farmer';
  const canRegister = role && CAN_REGISTER.includes(role);

  // Resolve farmer record for the logged-in farmer
  useEffect(() => {
    if (!isFarmer || !user) return;
    supabase.from('farmers').select('id').eq('profile_id', user.id).maybeSingle().then(({ data }) => {
      if (data) setMyFarmerId(data.id);
    });
  }, [isFarmer, user]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('animals').select(
      `id, animal_code, species, breed, sex, status, microchip_id, ear_tag_number, created_at,
       farms(farm_name, district), farmers(farmer_code, profiles(full_name))`,
      { count: 'exact' }
    );
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (speciesFilter !== 'all') q = q.eq('species', speciesFilter);
    if (isFarmer && myFarmerId) q = q.eq('farmer_id', myFarmerId);
    const { data, count } = await q.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setRows(Array.isArray(data) ? data : []); setTotal(count ?? 0); setLoading(false);
  }, [page, statusFilter, speciesFilter, isFarmer, myFarmerId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isFarmer && myFarmerId) {
      supabase.from('farms').select('id, farm_name, farm_code').eq('farmer_id', myFarmerId).limit(50)
        .then(({ data }) => setFarms(Array.isArray(data) ? data : []));
    } else if (!isFarmer) {
      Promise.all([
        supabase.from('farms').select('id, farm_name, farm_code').limit(200),
        supabase.from('farmers').select('id, farmer_code, profiles(full_name)').limit(200)
      ]).then(([fms, frs]) => {
        setFarms(Array.isArray(fms.data) ? fms.data : []);
        setFarmers(Array.isArray(frs.data) ? frs.data : []);
      });
    }
  }, [isFarmer, myFarmerId]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.animal_code?.toLowerCase().includes(s) || r.species?.toLowerCase().includes(s) || r.breed?.toLowerCase().includes(s) || r.microchip_id?.toLowerCase().includes(s) || r.ear_tag_number?.toLowerCase().includes(s) || (r.farmers as any)?.profiles?.full_name?.toLowerCase().includes(s);
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">{isFarmer ? 'My Livestock' : 'Livestock Management'}</h2>
            <p className="text-xs text-muted-foreground">{total.toLocaleString()} animals {isFarmer ? 'registered' : 'total'}</p>
          </div>
          {canRegister && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
              <Plus size={14} />Register Animal
            </Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by code, species, microchip, ear tag…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={speciesFilter} onValueChange={v => { setSpeciesFilter(v); setPage(0); }}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Species</SelectItem>{SPECIES_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="sick">Sick</SelectItem><SelectItem value="quarantined">Quarantined</SelectItem><SelectItem value="missing">Missing</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="slaughtered">Slaughtered</SelectItem><SelectItem value="deceased">Deceased</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs min-w-max">
            <thead><tr className="border-b border-border bg-muted/30">{['Animal ID','Species','Breed','Sex','Microchip ID','Ear Tag','Farm','Farmer','Status','Registered'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No animals found</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/livestock/${r.id}`)}>
                  <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.animal_code}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.species}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.breed || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.sex || '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{r.microchip_id || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{r.ear_tag_number || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farms as any)?.farm_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{(r.farmers as any)?.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={12} /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}><ChevronRight size={12} /></Button>
          </div>
        </div>
      </div>

      {canRegister && (
        <LivestockWizard
          open={showNew}
          onOpenChange={setShowNew}
          farms={farms}
          farmers={farmers}
          isFarmer={isFarmer}
          myFarmerId={myFarmerId}
          onSuccess={load}
        />
      )}
    </AppLayout>
  );
}
