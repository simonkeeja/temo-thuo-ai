import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center">
        <AlertTriangle size={28} className="text-accent" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-base font-semibold text-foreground">Page Not Found</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          The page you are looking for may have been moved or does not exist.
          Please check the URL and try again.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link to="/dashboard"><Home size={14} />Back to Dashboard</Link>
      </Button>
      <p className="text-xs text-muted-foreground">Temo-Thuo AI &mdash; Botswana&apos;s National Agricultural OS</p>
    </div>
  );
}
