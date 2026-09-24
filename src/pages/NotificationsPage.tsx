import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, ShoppingBag, CreditCard, Activity } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  livestock_alert: <Activity size={14} className="text-red-400" />,
  health_reminder: <AlertTriangle size={14} className="text-yellow-400" />,
  marketplace: <ShoppingBag size={14} className="text-blue-400" />,
  payment: <CreditCard size={14} className="text-green-400" />,
  system: <Info size={14} className="text-muted-foreground" />,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    let q = supabase.from('notifications').select('id, title, message, category, is_read, action_url, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
    if (filter === 'unread') q = q.eq('is_read', false);
    const { data } = await q;
    setNotifications(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false);
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Notifications</h2>
            {unreadCount > 0 && <Badge className="bg-accent text-accent-foreground">{unreadCount}</Badge>}
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${filter === f ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent/50'}`}>
                  {f === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
            {unreadCount > 0 && <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={markAllRead}><CheckCheck size={13} />Mark all read</Button>}
          </div>
        </div>

        <div className="border border-border bg-card divide-y divide-border">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading notifications…</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Bell size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors ${!n.is_read ? 'bg-accent/5' : ''}`}>
              <div className="mt-0.5 shrink-0">{CATEGORY_ICONS[n.category] || CATEGORY_ICONS.system}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs ${!n.is_read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>{n.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="shrink-0 p-1 hover:bg-muted rounded" title="Mark as read">
                  <Check size={12} className="text-accent" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
