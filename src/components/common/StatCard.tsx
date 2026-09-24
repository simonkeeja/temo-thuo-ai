import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: boolean;
  trend?: { value: number; label: string };
  className?: string;
}

export default function StatCard({ label, value, icon, sub, accent, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-card border border-border p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <span className={cn('shrink-0 p-1.5 rounded', accent ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground')}>
          {icon}
        </span>
      </div>
      <div>
        <p className={cn('text-2xl font-bold', accent ? 'text-accent' : 'text-foreground')}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <p className={cn('text-xs font-medium', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}
