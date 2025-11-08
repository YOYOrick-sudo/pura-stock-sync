import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Bell, Package, ChefHat, LucideIcon } from 'lucide-react';

const puraVidaQuotes = [
  "Pura Vida - samen maken we het verschil",
  "Genieten van wat we doen, dat is Pura Vida",
  "Pura Vida betekent focus op het essentiële",
  "Blijf positief, blijf groeien - Pura Vida",
  "Kwaliteit en plezier in het werk - Pura Vida",
  "Elke dag een nieuwe kans - Pura Vida",
  "Samen sterker - dat is de Pura Vida spirit",
];

interface DashboardCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  onClick: () => void;
  isLoading?: boolean;
}

const DashboardCard = ({ title, count, icon: Icon, onClick, isLoading }: DashboardCardProps) => {
  return (
    <Card 
      className="p-6 cursor-pointer hover:bg-muted/30 transition-colors border-l-2 border-l-[#1B7867]"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-[#1B7867]" />
        <span className="text-3xl font-bold text-foreground">
          {isLoading ? '...' : count}
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
    </Card>
  );
};

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState<string>('');
  const navigate = useNavigate();

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

  const getDailyQuote = () => {
    const dayOfMonth = new Date().getDate();
    return puraVidaQuotes[dayOfMonth % puraVidaQuotes.length];
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

  // Query 2: Ongelezen Meldingen
  const { data: unreadNotifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false);
      return data?.length || 0;
    },
  });

  // Query 3: Wachtende Bestellingen
  const { data: pendingOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard-pending-orders', userLocation],
    queryFn: async () => {
      const { data } = await supabase
        .from('internal_orders')
        .select('*')
        .or(`from_location.eq.${userLocation},to_location.eq.${userLocation}`)
        .eq('status', 'pending');
      return data?.length || 0;
    },
    enabled: !!userLocation,
  });

  // Query 4: Kitchen Taken Vandaag
  const { data: todayKitchenTasks, isLoading: loadingKitchenTasks } = useQuery({
    queryKey: ['dashboard-kitchen-tasks', userLocation],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('kitchen_tasks')
        .select('*')
        .eq('location', userLocation)
        .eq('due_date', today)
        .eq('completed', false);
      return data?.length || 0;
    },
    enabled: !!userLocation,
  });

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {getGreeting()}
          </h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
          <p className="text-sm text-muted-foreground italic mt-2">
            <span className="text-[#1B7867]">•</span> {getDailyQuote()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Openstaande Taken"
            count={pendingTasks || 0}
            icon={CheckSquare}
            onClick={() => navigate('/foh-module')}
            isLoading={loadingTasks}
          />
          
          <DashboardCard
            title="Nieuwe Meldingen"
            count={unreadNotifications || 0}
            icon={Bell}
            onClick={() => {/* Could trigger notifications dropdown */}}
            isLoading={loadingNotifications}
          />
          
          <DashboardCard
            title="Wachtende Bestellingen"
            count={pendingOrders || 0}
            icon={Package}
            onClick={() => navigate('/kitchen-internal-orders')}
            isLoading={loadingOrders}
          />
          
          <DashboardCard
            title="Kitchen Taken Vandaag"
            count={todayKitchenTasks || 0}
            icon={ChefHat}
            onClick={() => navigate('/kitchen-tasks')}
            isLoading={loadingKitchenTasks}
          />
        </div>
      </div>
    </SidebarLayout>
  );
}
