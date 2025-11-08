import { Navigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';

interface LocationGuardProps {
  allowedLocations: string[];
  children: React.ReactNode;
}

export const LocationGuard = ({ allowedLocations, children }: LocationGuardProps) => {
  const { userLocation, loading } = useUserLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Laden...</div>
    </div>;
  }
  
  if (!allowedLocations.includes(userLocation || '')) {
    return <Navigate to="/taken-bediening" replace />;
  }

  return <>{children}</>;
};
