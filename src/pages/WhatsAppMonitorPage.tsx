import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare, Phone, User, Clock, RefreshCw,
  ChevronLeft, ChevronRight, Search, Wifi, WifiOff,
  ArrowDownLeft, ArrowUpRight, AlertCircle, Info
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import AppLayout from '@/components/layouts/AppLayout';
import { RoleGuard } from '@/components/common/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/common/StatCard';

const PAGE_SIZE = 15;

const INTENT_COLORS: Record<string, string> = {
  sick_animal:   'bg-red-500/20 text-red-400 border-red-500/30',
  weather:       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  market:        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  registration:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  crop_farming:  'bg-green-500/20 text-green-400 border-green-500/30',
  insurance:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  financial:     'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  greeting:      'bg-muted/50 text-muted-foreground border-border',
  general_query: 'bg-muted/50 text-muted-foreground border-border',
};

export default function WhatsAppMonitorPage() {
  return (
    <AppLayout>
      <RoleGuard allowedRoles={['admin', 'operations_team', 'ministry_official']}>
        <WhatsAppMonitorContent />
      </RoleGuard>
    </AppLayout>
  );
}

function WhatsAppMonitorContent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [stats, setStats] = useState({ total_sessions: 0, today_messages: 0, sick_reports: 0, active_24h: 0 });

  // ── Load sessions ──────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('whatsapp_sessions')
      .select('*, profiles(full_name, district)', { count: 'exact' });

    if (search.trim()) {
      q = q.or(`phone_number.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data, count } = await q
      .order('last_seen_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    setSessions(Array.isArray(data) ? data : []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, search]);

  // ── Load stats ─────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();

    const [sessRes, todayRes, sickRes, activeRes] = await Promise.all([
      supabase.from('whatsapp_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('whatsapp_messages').select('id', { count: 'exact', head: true }).eq('intent', 'sick_animal'),
      supabase.from('whatsapp_sessions').select('id', { count: 'exact', head: true }).gte('last_seen_at', yesterday),
    ]);

    setStats({
      total_sessions:  sessRes.count ?? 0,
      today_messages:  todayRes.count ?? 0,
      sick_reports:    sickRes.count ?? 0,
      active_24h:      activeRes.count ?? 0,
    });
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Load messages for selected session ────────────────────
  const openSession = async (session: any) => {
    setSelectedSession(session);
    setMsgLoading(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });
    setMessages(Array.isArray(data) ? data : []);
    setMsgLoading(false);
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-green-500/20 flex items-center justify-center">
            <MessageSquare size={18} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">WhatsApp Business Assistant</h2>
            <p className="text-xs text-muted-foreground">Live conversation monitor — Temo AI</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { loadSessions(); loadStats(); }}>
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Webhook setup notice */}
      <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="font-semibold">WhatsApp Cloud API — Webhook Configuration</p>
          <p className="text-blue-400/80">
            Use the URL below as your <strong>Callback URL</strong> in Meta Developer Console
            (WhatsApp → Configuration → Webhooks). The anon key is embedded so Meta's
            unauthenticated GET handshake passes through.
          </p>
          <div className="space-y-1">
            <p className="text-blue-400/60 uppercase tracking-wide text-[10px] font-semibold">Callback URL</p>
            <p className="font-mono break-all bg-blue-500/10 px-2 py-1.5 rounded border border-blue-500/20 text-blue-300 select-all">
              {`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/whatsapp_verify?apikey=${import.meta.env.VITE_SUPABASE_ANON_KEY}`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-blue-400/60 uppercase tracking-wide text-[10px] font-semibold">Verify Token</p>
            <p className="font-mono bg-blue-500/10 px-2 py-1.5 rounded border border-blue-500/20 text-blue-300 select-all">
              temothuo_webhook_2026
            </p>
          </div>
          <p className="text-blue-400/70 text-[11px]">
            ⚠️ Incoming messages are handled by the <code className="bg-blue-500/20 px-1 rounded">whatsapp-webhook</code> Edge Function — ensure{' '}
            <code className="bg-blue-500/20 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> and{' '}
            <code className="bg-blue-500/20 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> secrets are set in Supabase.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Sessions"   value={stats.total_sessions}  icon={<Phone size={14} />}        />
        <StatCard label="Messages Today"   value={stats.today_messages}  icon={<MessageSquare size={14} />} />
        <StatCard label="Sick Reports"     value={stats.sick_reports}    icon={<AlertCircle size={14} />}   />
        <StatCard label="Active (24h)"     value={stats.active_24h}      icon={<Wifi size={14} />}          />
      </div>

      {/* Main content */}
      {selectedSession ? (
        /* ── Conversation view ── */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSelectedSession(null)}>
              <ChevronLeft size={13} /> Back
            </Button>
            <div className="flex items-center gap-2 ml-1">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                <User size={13} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedSession.display_name || 'Unknown Farmer'}</p>
                <p className="text-xs text-muted-foreground font-mono">{selectedSession.phone_number}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col gap-2 p-4 max-h-[55vh] overflow-y-auto">
                {msgLoading ? (
                  <p className="text-xs text-center text-muted-foreground py-8">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-8">No messages yet</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex gap-2 ${m.direction === 'outbound' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5
                        ${m.direction === 'inbound' ? 'bg-muted' : 'bg-green-500/20'}`}>
                        {m.direction === 'inbound'
                          ? <ArrowDownLeft size={10} className="text-muted-foreground" />
                          : <ArrowUpRight size={10} className="text-green-400" />}
                      </div>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-xs leading-relaxed
                        ${m.direction === 'inbound'
                          ? 'bg-muted/40 text-foreground'
                          : 'bg-green-500/15 border border-green-500/30 text-foreground'}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{formatRelative(m.created_at)}</span>
                          {m.intent && m.intent !== 'general_query' && m.direction === 'inbound' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${INTENT_COLORS[m.intent] ?? INTENT_COLORS.general_query}`}>
                              {m.intent.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── Session list ── */
        <div className="space-y-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by phone number or name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-8 px-8 text-xs h-8"
            />
          </div>

          <div className="border border-border bg-card overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Farmer', 'Phone', 'District', 'State', 'Last Active', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <WifiOff size={20} />
                        <p>No WhatsApp conversations yet</p>
                        <p className="text-[11px]">Messages will appear here once the webhook is active</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map(s => {
                    const isActive24h = Date.now() - new Date(s.last_seen_at).getTime() < 86_400_000;
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                        onClick={() => openSession(s)}
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                              <User size={11} className="text-green-400" />
                            </div>
                            <span className="font-medium">{s.display_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono whitespace-nowrap">{s.phone_number}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{(s.profiles as any)?.district || '—'}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded border text-[10px] bg-muted/30 border-border capitalize">
                            {s.state}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          {formatRelative(s.last_seen_at)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className={`text-[10px] ${isActive24h ? 'border-green-500/50 text-green-400' : 'text-muted-foreground'}`}>
                            {isActive24h ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {Math.min(page * PAGE_SIZE + 1, total)}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft size={12} />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}>
                <ChevronRight size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
