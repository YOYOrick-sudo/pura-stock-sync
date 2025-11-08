import { SidebarLayout } from '@/components/SidebarLayout';
import OrderDashboard from '@/components/OrderDashboard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Voorraad() {
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
      <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Telling & Bestelling</h1>
          <p className="text-sm text-muted-foreground">Bestel bij Pura Midsland</p>
        </div>
        
        <OrderDashboard />
      </div>
    </SidebarLayout>
  );
}
