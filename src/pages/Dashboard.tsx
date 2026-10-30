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
import { WasteCalendarCard } from '@/components/dashboard/WasteCalendarCard';
import { WasteAlertBanner } from '@/components/dashboard/WasteAlertBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { KaartKop, LijstKaart } from '@/components/pura';

interface DashboardCardProps {
  title: string;
  count: number;
  onClick: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
  mobile?: boolean;
}

const DashboardCard = ({ title, count, onClick, isLoading, icon, mobile }: DashboardCardProps) => {
  if (mobile) {
    return (
      <div onClick={onClick} className="min-w-0 cursor-pointer">
        <LijstKaart kop={<KaartKop titel={<span className="flex min-w-0 items-center gap-2">{icon}<span className="truncate">{title}</span></span>} rechts={<span className="text-xl font-semibold tabular-nums">{isLoading ? '...' : String(count)}</span>} />}>
          {null}
        </LijstKaart>
      </div>
    );
  }
  return (
    <div onClick={onClick} className="cursor-pointer group rounded-polar-xl">
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
  const isMobile = useIsMobile();
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
    <div className={isMobile ? 'min-w-0 space-y-4 [&_button]:min-h-11 [&_button]:min-w-11 [&_textarea]:text-base' : 'max-w-7xl mx-auto space-y-6'}>
        {isMobile ? (
          <div className="min-w-0 [&>div]:p-4 [&>div]:rounded-polar-lg [&>div>div:last-child]:flex-wrap [&>div>div:last-child]:gap-2">
            <HandoverCard />
          </div>
        ) : <HandoverCard />}

        {isMobile ? (
          <div className="min-w-0 [&>div]:p-4 [&>div]:rounded-polar-lg [&>div>div:first-child]:min-w-0 [&>div>div:first-child>div]:min-w-0 [&>div>div:first-child>div:last-child]:flex-wrap [&>div>div:first-child>div:last-child]:w-full [&>div>div:first-child>div:last-child]:justify-center [&_.grid-cols-7]:!flex [&_.grid-cols-7]:overflow-x-auto [&_.grid-cols-7]:snap-x [&_.grid-cols-7]:snap-proximity [&_.grid-cols-7]:p-1 [&_.grid-cols-7>div]:w-28 [&_.grid-cols-7>div]:shrink-0 [&_.grid-cols-7>div]:snap-start [&_.grid-cols-7>div]:rounded-polar-md [&_.grid-cols-7_[aria-label]]:min-h-11 [&_.grid-cols-7_[aria-label]]:rounded-polar-md [&_button.w-8]:!w-11">
            <WasteCalendarCard />
          </div>
        ) : <WasteCalendarCard />}

        <div className={isMobile ? 'grid min-w-0 grid-cols-1 gap-4 [&>div]:min-w-0' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
          <DashboardCard
            title="Openstaande Taken"
            count={pendingTasks || 0}
            onClick={() => navigate('/taken-bediening')}
            isLoading={loadingTasks}
            icon={<ListTodo size={16} className="text-primary" />}
            mobile={isMobile}
          />

          {isMobile ? (
            <div className="min-w-0 [&>div]:p-4 [&>div]:rounded-polar-lg [&>div>div:first-child]:flex-wrap [&>div>div:last-child]:gap-2">
              <IdeaBox />
            </div>
          ) : <IdeaBox />}

          {isMobile ? (
            <div className="min-w-0 [&>div>div]:p-4 [&>div>div]:rounded-polar-lg [&>div>div]:!min-h-12 [&>div>div]:break-words [&>div>div]:[overflow-wrap:anywhere]">
              <TerschellingEventsCard />
            </div>
          ) : <TerschellingEventsCard />}
        </div>
      </div>
    </SidebarLayout>
  );
}
