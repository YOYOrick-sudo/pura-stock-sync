import { SidebarLayout } from '@/components/SidebarLayout';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import ReservationWidget from '@/components/reservations/ReservationWidget';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Reservations() {
  useInactivityTimeout();
  const [userLocation, setUserLocation] = useState<string>('');

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
    };
    fetchLocation();
  }, []);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Reserveringen</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        <ReservationWidget />
      </div>
    </SidebarLayout>
  );
}
