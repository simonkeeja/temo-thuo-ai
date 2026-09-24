import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const CATEGORIES = ['Cattle','Sheep','Goat','Pig','Chicken','Maize','Sorghum','Vegetables','Animal Feed','Farm Equipment','Agricultural Inputs','Services'];

// Only farmers can create new marketplace listings
const CAN_LIST = ['farmer'];
// Roles that can see all orders (officers/admin); others see their own
const FULL_ORDER_VIEW = ['admin', 'operations_team', 'ministry_official', 'financial_officer'];

export default function MarketplacePage() {
  const { user, role } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ category: '', title: '', description: '', quantity: '', unit_price: '', location_district: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('listings');

  const isFarmer = role === 'farmer';
  const canList = role && CAN_LIST.includes(role);
  const hasFullOrderView = role && FULL_ORDER_VIEW.includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    // All active listings — visible to everyone
    let q = supabase.from('marketplace_listings').select(
      `id, listing_code, category, title, description, quantity, unit_price, currency, location_district, status, created_at, profiles(full_name)`,
      { count: 'exact' }
    ).eq('status', 'active');
    if (categoryFilter !== 'all') q = q.eq('category', categoryFilter);
    const { data, count } = await q.order('created_at', { ascending: false }).limit(50);
    setListings(Array.isArray(data) ? data : []); setTotal(count ?? 0);

    // My listings — farmers only
    if (isFarmer && user) {
      const { data: mine } = await supabase.from('marketplace_listings')
        .select(`id, listing_code, category, title, quantity, unit_price, status, created_at`)
        .eq('seller_id', user.id).order('created_at', { ascending: false }).limit(50);
      setMyListings(Array.isArray(mine) ? mine : []);
    }

    // Orders — scoped by role
    let ordQ = supabase.from('orders').select(
      'id, order_code, status, quantity, total_amount, created_at, marketplace_listings(title, category), profiles(full_name)'
    ).order('created_at', { ascending: false }).limit(30);
    if (!hasFullOrderView && user) ordQ = ordQ.eq('buyer_id', user.id);
    const { data: ord } = await ordQ;
    setOrders(Array.isArray(ord) ? ord : []);
    setLoading(false);
  }, [categoryFilter, isFarmer, hasFullOrderView, user]);

  useEffect(() => { load(); }, [load]);

  const filtered = listings.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.title?.toLowerCase().includes(s) || r.category?.toLowerCase().includes(s) || r.location_district?.toLowerCase().includes(s) || (r.profiles as any)?.full_name?.toLowerCase().includes(s);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('marketplace_listings').insert({ seller_id: user!.id, category: form.category, title: form.title, description: form.description || null, quantity: form.quantity ? parseInt(form.quantity) : null, unit_price: form.unit_price ? parseFloat(form.unit_price) : null, currency: 'BWP', location_district: form.location_district || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Listing created'); setShowNew(false); setForm({ category: '', title: '', description: '', quantity: '', unit_price: '', location_district: '' }); load();
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div><h2 className="text-lg font-bold">Digital Marketplace</h2><p className="text-xs text-muted-foreground">{total} active listings</p></div>
          {canList && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}><Plus size={14} />New Listing</Button>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="listings" className="text-xs">All Listings</TabsTrigger>
            {isFarmer && <TabsTrigger value="mylistings" className="text-xs">My Listings ({myListings.length})</TabsTrigger>}
            <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search listings…" className="pl-8 px-8 text-xs h-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); }}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading ? <p className="text-xs text-muted-foreground col-span-3 py-8 text-center">Loading...</p>
              : filtered.length === 0 ? <p className="text-xs text-muted-foreground col-span-3 py-8 text-center">No listings found</p>
              : filtered.map(r => (
                <Card key={r.id} className="border-border hover:border-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-accent">{r.unit_price ? `BWP ${r.unit_price.toLocaleString()}` : 'Price on request'}</span>
                      <span className="text-muted-foreground">{r.location_district || 'Botswana'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Qty: {r.quantity ?? '—'}</span>
                      <span>{(r.profiles as any)?.full_name || '—'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Listings tab — farmers only */}
          {isFarmer && (
            <TabsContent value="mylistings">
              <div className="border border-border bg-card overflow-x-auto">
                <table className="w-full text-xs min-w-max">
                  <thead><tr className="border-b border-border bg-muted/30">{['Listing Code','Category','Title','Qty','Price (BWP)','Status','Posted'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                    : myListings.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">You have no listings yet. Click "New Listing" to get started.</td></tr>
                    : myListings.map(r => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.listing_code}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{r.category}</td>
                        <td className="px-4 py-2.5 max-w-[160px] truncate whitespace-nowrap">{r.title}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{r.quantity ?? '—'}</td>
                        <td className="px-4 py-2.5 font-mono whitespace-nowrap">{r.unit_price?.toLocaleString() ?? '—'}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}

          <TabsContent value="orders">
            <div className="border border-border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-max">
                <thead><tr className="border-b border-border bg-muted/30">{['Order Code','Item','Buyer','Qty','Total (BWP)','Status','Date'].map(h=><th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  : orders.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{isFarmer ? 'No orders placed yet' : 'No orders'}</td></tr>
                  : orders.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-accent whitespace-nowrap">{r.order_code}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(r.marketplace_listings as any)?.title || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{(r.profiles as any)?.full_name || '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.quantity ?? '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{r.total_amount ? r.total_amount.toLocaleString() : '—'}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {canList && <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Create New Listing</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1"><Label>Title *</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="px-3" /></div>
              <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="px-3 resize-none" /></div>
              <div className="space-y-1"><Label>Unit Price (BWP)</Label><Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} className="px-3" /></div>
              <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="px-3" /></div>
              <div className="col-span-2 space-y-1"><Label>Location (District)</Label>
                <Select value={form.location_district} onValueChange={v => setForm(f => ({ ...f, location_district: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>{['Central','Chobe','Ghanzi','Kgalagadi','Kgatleng','Kweneng','North East','North West','South East','Southern'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.category || !form.title}>{saving ? 'Saving…' : 'Create Listing'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>}
    </AppLayout>
  );
}
