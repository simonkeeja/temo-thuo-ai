import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Account
  active: { label: 'Active', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  pending_verification: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  suspended: { label: 'Suspended', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
  // Animal
  missing: { label: 'Missing', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  sick: { label: 'Sick', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  quarantined: { label: 'Quarantined', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  sold: { label: 'Sold', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  slaughtered: { label: 'Slaughtered', className: 'bg-muted text-muted-foreground border-border' },
  deceased: { label: 'Deceased', className: 'bg-muted text-muted-foreground border-border' },
  // Microchip
  manufactured: { label: 'Manufactured', className: 'bg-muted text-muted-foreground border-border' },
  received: { label: 'Received', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  in_inventory: { label: 'In Inventory', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  issued: { label: 'Issued', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  activated: { label: 'Activated', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  in_use: { label: 'In Use', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  recovered: { label: 'Recovered', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  retired: { label: 'Retired', className: 'bg-muted text-muted-foreground border-border' },
  // Device
  under_maintenance: { label: 'Maintenance', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  faulty: { label: 'Faulty', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  // Claims
  submitted: { label: 'Submitted', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  under_review: { label: 'Under Review', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  approved: { label: 'Approved', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  paid: { label: 'Paid', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
  // Payment
  pending: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  successful: { label: 'Successful', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  failed: { label: 'Failed', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-border' },
  refunded: { label: 'Refunded', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  // Orders
  placed: { label: 'Placed', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  accepted: { label: 'Accepted', className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  completed: { label: 'Completed', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  // Disease
  contained: { label: 'Contained', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  resolved: { label: 'Resolved', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  // Misc
  online: { label: 'Online', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  offline: { label: 'Offline', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border', cfg.className, className)}>
      {cfg.label}
    </span>
  );
}
