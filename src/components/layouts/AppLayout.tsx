import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tractor, ActivitySquare, Cpu, Leaf,
  Radio, Stethoscope, ShoppingBag, Shield, CreditCard, BarChart3,
  Map, Bell, Settings, LogOut, Menu, ChevronRight,
  Zap, Globe, Satellite, Package, UserCog, MessageSquare, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: UserRole[];
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} /> },
  {
    label: 'Farmers', path: '/farmers', icon: <Users size={16} />,
    roles: ['extension_officer', 'admin', 'operations_team', 'ministry_official']
  },
  {
    label: 'Farms', path: '/farms', icon: <Tractor size={16} />,
    roles: ['farmer', 'extension_officer', 'admin', 'operations_team', 'ministry_official', 'veterinary_officer']
  },
  {
    label: 'Livestock', path: '/livestock', icon: <ActivitySquare size={16} />,
    roles: ['farmer', 'veterinary_officer', 'extension_officer', 'feedlot_operator', 'abattoir_officer', 'admin', 'operations_team', 'ministry_official']
  },
  {
    label: 'Bio-Sentinel', path: '/microchips', icon: <Cpu size={16} />,
    roles: ['veterinary_officer', 'abattoir_officer', 'admin', 'operations_team']
  },
  {
    label: 'Crops', path: '/crops', icon: <Leaf size={16} />,
    roles: ['farmer', 'extension_officer', 'admin', 'operations_team', 'ministry_official']
  },
  {
    label: 'Crop-Guardian', path: '/sensors', icon: <Radio size={16} />,
    roles: ['farmer', 'extension_officer', 'admin', 'operations_team']
  },
  {
    label: 'Veterinary', path: '/veterinary', icon: <Stethoscope size={16} />,
    roles: ['veterinary_officer', 'farmer', 'admin', 'operations_team', 'ministry_official']
  },
  {
    label: 'Health Records', path: '/health-records', icon: <ClipboardList size={16} />,
    roles: ['veterinary_officer', 'extension_officer', 'admin', 'operations_team', 'ministry_official', 'abattoir_officer', 'farmer']
  },
  {
    label: 'Marketplace', path: '/marketplace', icon: <ShoppingBag size={16} />
  },
  {
    label: 'Insurance', path: '/insurance', icon: <Shield size={16} />,
    roles: ['farmer', 'insurance_officer', 'admin', 'operations_team', 'ministry_official']
  },
  {
    label: 'Payments', path: '/payments', icon: <CreditCard size={16} />,
    roles: ['farmer', 'financial_officer', 'admin', 'operations_team']
  },
  {
    label: 'IoT Devices', path: '/iot', icon: <Zap size={16} />,
    roles: ['admin', 'operations_team', 'extension_officer']
  },
  {
    label: 'Device Assets', path: '/devices', icon: <Package size={16} />,
    roles: ['admin', 'operations_team']
  },
  {
    label: 'GIS Map', path: '/gis', icon: <Map size={16} />
  },
  {
    label: 'AI Insights', path: '/ai-insights', icon: <Satellite size={16} />
  },
  {
    label: 'Reports', path: '/reports', icon: <BarChart3 size={16} />,
    roles: ['admin', 'operations_team', 'ministry_official', 'extension_officer', 'insurance_officer']
  },
  {
    label: 'Situation Room', path: '/situation-room', icon: <Globe size={16} />,
    roles: ['ministry_official', 'admin', 'operations_team']
  },
  {
    label: 'Notifications', path: '/notifications', icon: <Bell size={16} />
  },
  {
    label: 'Admin', path: '/admin', icon: <Settings size={16} />,
    roles: ['admin', 'operations_team']
  },
  {
    label: 'User Management', path: '/admin/users', icon: <UserCog size={16} />,
    roles: ['admin', 'operations_team']
  },
  {
    label: 'WhatsApp Assistant', path: '/admin/whatsapp', icon: <MessageSquare size={16} />,
    roles: ['admin', 'operations_team', 'ministry_official']
  },
];

function NavLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const location = useLocation();
  const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors duration-120',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        active
          ? 'bg-sidebar-accent text-accent border-l-2 border-accent'
          : 'text-sidebar-foreground/80 border-l-2 border-transparent',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? item.label : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function SidebarContent({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const visible = NAV_ITEMS.filter(item => !item.roles || !role || item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-sidebar-border', collapsed && 'px-2 justify-center')}>
        <div className="w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0">
          <Leaf size={16} className="text-accent-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Temo-Thuo AI</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">National Agri OS</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visible.map(item => (
          <NavLink key={item.path} item={item} collapsed={!!collapsed} onClick={onClose} />
        ))}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'px-2')}>
        {!collapsed && profile && (
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{profile.full_name || profile.email}</p>
            <Badge variant="outline" className="text-xs mt-0.5 border-accent/40 text-accent">
              {profile.role?.replace(/_/g, ' ')}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn('w-full border border-sidebar-border/60 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground', collapsed ? 'px-2' : 'justify-start gap-2')}
        >
          <LogOut size={14} />
          {!collapsed && 'Sign Out'}
        </Button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentPage = NAV_ITEMS.find(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className={cn('hidden md:flex flex-col shrink-0 border-r border-border transition-all duration-200', collapsed ? 'w-14' : 'w-56')}>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56 bg-sidebar border-r border-sidebar-border">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex shrink-0"
            onClick={() => setCollapsed(c => !c)}
          >
            {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
          </Button>

          <div className="flex-1 min-w-0">
            {currentPage && (
              <h1 className="text-sm font-semibold text-foreground truncate">{currentPage.label}</h1>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
