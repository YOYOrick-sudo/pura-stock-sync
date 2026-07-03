import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface RequireOwnerProps {
  children: React.ReactNode;
}

export const RequireOwner = ({ children }: RequireOwnerProps) => {
  const { loading, isOwner } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
