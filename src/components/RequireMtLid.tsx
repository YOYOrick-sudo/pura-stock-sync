import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIsMtLid } from '@/hooks/useIsMtLid';

interface RequireMtLidProps {
  children: React.ReactNode;
}

export const RequireMtLid = ({ children }: RequireMtLidProps) => {
  const { isMtLid, loading } = useIsMtLid();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMtLid) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
