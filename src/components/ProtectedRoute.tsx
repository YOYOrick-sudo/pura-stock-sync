import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '@/contexts/AuthContext';
import { StartScherm } from '@/components/auth/StartScherm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { status, offline, opnieuw } = useAuthStatus();

  // Zolang niet vaststaat of er een sessie is: rustig startscherm, geen
  // doorverwijzing naar het inlogscherm.
  if (status === 'onbekend') {
    return <StartScherm offline={offline} opnieuw={opnieuw} />;
  }

  if (status === 'uitgelogd') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
