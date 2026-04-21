import { SidebarLayout } from '@/components/SidebarLayout';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { PolarKPICard } from '@/components/polar';
import { ListTodo } from 'lucide-react';
import { HandoverCard } from '@/components/HandoverCard';
import { IdeaBox } from '@/components/dashboard/IdeaBox';
import { TerschellingEventsCard } from '@/components/dashboard/TerschellingEventsCard';

interface DashboardCardProps {
  title: string;
  count: number;
  onClick: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const DashboardCard = ({ title, count, onClick, isLoading, icon }: DashboardCardProps) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderRadius: '20px' }}
    >
      <PolarKPICard
        compact
        title={title}
        value={isLoading ? '...' : String(count)}
        statusColor={{ bg: 'transparent', icon }}
      />
    </div>
  );
};

export default function Dashboard() {
  const { userLocation } = useUserLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Realtime subscription voor FOH Tasks
  useEffect(() => {
    if (!userLocation) return;

    const channel = supabase
      .channel('dashboard-foh-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'foh_tasks',
          filter: `location=eq.${userLocation}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-pending-tasks', userLocation] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userLocation, queryClient]);

  // Realtime subscription voor Notifications
  useEffect(() => {
    const setupNotificationsSub = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('dashboard-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupNotificationsSub();
  }, [queryClient]);

  // Query 1: Openstaande FOH Taken
  const { data: pendingTasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['dashboard-pending-tasks', userLocation],
    queryFn: async () => {
      const { data } = await supabase
        .from('foh_tasks')
        .select('*')
        .eq('location', userLocation)
        .eq('completed', false)
        .eq('archived', false);
      return data?.length || 0;
    },
    enabled: !!userLocation,
  });

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Openstaande Taken"
            count={pendingTasks || 0}
            onClick={() => navigate('/taken-bediening')}
            isLoading={loadingTasks}
            icon={<ListTodo size={16} className="text-primary" />}
          />

          <IdeaBox />

          <TerschellingEventsCard />
        </div>

        <HandoverCard />
      </div>
    </SidebarLayout>
  );
}
