import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { FohTasks } from '@/components/foh/FohTasks';
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
      subtitle={`Taken - ${userLocation}`}
      backTo="/home"
      backLabel="Dashboard"
    >
      <FohTasks />
    </KitchenLayout>
  );
}
