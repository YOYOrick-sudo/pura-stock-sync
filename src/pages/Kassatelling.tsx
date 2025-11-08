import { SidebarLayout } from '@/components/SidebarLayout';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Kassa from './Kassa';
import KassatellingOverdag from './KassatellingOverdag';

export default function Kassatelling() {
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
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Kassatelling</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        <Tabs defaultValue="avond" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="overdag">Overdag</TabsTrigger>
            <TabsTrigger value="avond">Avond</TabsTrigger>
          </TabsList>

          <TabsContent value="overdag" className="space-y-4">
            <KassatellingOverdag />
          </TabsContent>

          <TabsContent value="avond" className="space-y-4">
            <Kassa />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
