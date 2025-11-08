import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState<string>('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Goedemorgen';
    } else if (hour < 18) {
      return 'Goedemiddag';
    } else {
      return 'Goedenavond';
    }
  };

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
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {getGreeting()}
          </h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>
      </div>
    </SidebarLayout>
  );
}
