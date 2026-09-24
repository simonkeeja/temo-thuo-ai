import React from 'react';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  /** Optional custom message to show when access is denied */
  message?: string;
}

/**
 * Wraps content that should only be visible to specific roles.
 * Renders an "Access Restricted" notice for unauthorized roles instead of navigating away.
 */
export function RoleGuard({ allowedRoles, children, message }: RoleGuardProps) {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ShieldOff size={28} className="text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Access Restricted</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {message || 'You do not have permission to view this section. Contact your administrator if you believe this is an error.'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Required: {allowedRoles.map(r => r.replace(/_/g, ' ')).join(', ')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
