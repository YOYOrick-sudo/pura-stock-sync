import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface LocationGuardProps {
  allowedLocations: string[];
  children: React.ReactNode;
}

export const LocationGuard = ({ allowedLocations, children }: LocationGuardProps) => {
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('location')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserLocation(data?.location || '');
      }
      setLoading(false);
    };
    fetchLocation();
  }, []);

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
