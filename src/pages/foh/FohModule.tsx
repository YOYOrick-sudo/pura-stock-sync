import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { FohTasks } from '@/components/foh/FohTasks';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SidebarLayout } from '@/components/SidebarLayout';

export default function FohModule() {
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Bediening</h1>
          <p className="text-muted-foreground">Taken - {userLocation}</p>
        </div>
        <FohTasks />
      </div>
    </SidebarLayout>
  );
}
