import { SidebarLayout } from '@/components/SidebarLayout';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-2">Welkom</h3>
            <p className="text-muted-foreground">
              Gebruik het menu aan de linkerkant om te navigeren naar de verschillende modules.
            </p>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
