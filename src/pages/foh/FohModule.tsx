import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { FohTasks } from '@/components/foh/FohTasks';
import { FohEmployees } from '@/components/foh/FohEmployees';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FohModule() {
  useInactivityTimeout();
  const navigate = useNavigate();
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
    <KitchenLayout 
      title="Bediening"
      subtitle={`Taken & Medewerkers - ${userLocation}`}
      backTo="/home"
      backLabel="Dashboard"
    >
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white">
          <TabsTrigger value="tasks">Taken</TabsTrigger>
          <TabsTrigger value="employees">Medewerkers</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <FohTasks />
        </TabsContent>

        <TabsContent value="employees">
          <FohEmployees />
        </TabsContent>
      </Tabs>
    </KitchenLayout>
  );
}
