import { Navigate } from 'react-router-dom';
import { useUserLocation } from '@/contexts/UserLocationContext';

interface LocationGuardProps {
  allowedLocations: string[];
  children: React.ReactNode;
}

export const LocationGuard = ({ allowedLocations, children }: LocationGuardProps) => {
  const { userLocation, availableLocations, loading } = useUserLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Laden...</div>
    </div>;
  }

  // Toegang zodra één van de vestigingen van dit account is toegestaan;
  // de actieve keuze bepaalt daarna wat het scherm laat zien.
  const heeftToegang =
    allowedLocations.includes(userLocation || '') ||
    availableLocations.some(loc => allowedLocations.includes(loc));

  if (!heeftToegang) {
    return <Navigate to="/taken-bediening" replace />;
  }

  return <>{children}</>;
};

