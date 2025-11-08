import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Bell, Package, LucideIcon } from 'lucide-react';

const puraVidaQuotes = [
  "Pura Vida - samen maken we het verschil",
  "Genieten van wat we doen, dat is Pura Vida",
  "Pura Vida betekent focus op het essentiële",
  "Blijf positief, blijf groeien - Pura Vida",
  "Kwaliteit en plezier in het werk - Pura Vida",
  "Elke dag een nieuwe kans - Pura Vida",
  "Samen sterker - dat is de Pura Vida spirit",
];

// Helper functies voor Voorraad Telling
const isFriday = (): boolean => {
  return new Date().getDay() === 5;
};

const getNextFriday = (): Date => {
  const today = new Date();
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  return nextFriday;
};

const getDaysUntilFriday = (): number => {
  const today = new Date();
  const nextFriday = getNextFriday();
  const diffTime = nextFriday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getLastSubmission = (): { date: string | null, isToday: boolean } => {
  const lastSubmitted = localStorage.getItem('pura-vida-last-submitted');
  
  if (!lastSubmitted) {
    return { date: null, isToday: false };
  }
  
  const submittedDate = new Date(lastSubmitted.split(',')[0].split('-').reverse().join('-'));
  const today = new Date();
  const isToday = submittedDate.toDateString() === today.toDateString();
  
  return { date: lastSubmitted, isToday };
};

const getVoorraadStatus = () => {
  const { date: lastSubmitted, isToday } = getLastSubmission();
  const daysUntil = getDaysUntilFriday();
  const isFridayToday = isFriday();
  
  if (isFridayToday && !isToday) {
    return {
      status: 'urgent',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-600',
      message: 'Voorraad telling verwacht!',
      subtitle: 'Nog niet ingediend vandaag'
    };
  }
  
  if (daysUntil <= 1) {
    return {
      status: 'warning',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-l-orange-600',
      message: `Over ${daysUntil} dag${daysUntil === 1 ? '' : 'en'}`,
      subtitle: lastSubmitted ? `Laatst: ${lastSubmitted.split(',')[0]}` : 'Nog niet ingediend'
    };
  }
  
  return {
    status: 'ok',
    color: 'text-[#1B7867]',
    bgColor: 'bg-green-50',
    borderColor: 'border-l-[#1B7867]',
    message: `Over ${daysUntil} dagen`,
    subtitle: lastSubmitted ? `Laatst: ${lastSubmitted.split(',')[0]}` : 'Nog niet ingediend'
  };
};

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

const VoorraadCard = () => {
  const navigate = useNavigate();
  const status = getVoorraadStatus();
  const nextFriday = getNextFriday();
  
  return (
    <Card 
      className={`p-6 cursor-pointer hover:bg-muted/30 transition-colors border-l-2 ${status.borderColor} ${status.bgColor}`}
      onClick={() => navigate('/voorraad')}
    >
      <div className="flex items-center justify-between mb-2">
        <Package className={`h-5 w-5 ${status.color}`} />
        <div className="text-right">
          <div className={`text-2xl font-bold ${status.color}`}>
            {nextFriday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-foreground mb-1">
          Voorraad Telling
        </p>
        <p className={`text-xs ${status.color} font-medium`}>
          {status.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {status.subtitle}
        </p>
      </div>
    </Card>
  );
};

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState<string>('');
  const navigate = useNavigate();


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

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Aloha! <span className="text-[#1B7867]">{userLocation}</span>
          </h1>
          
          <p className="text-sm text-muted-foreground italic">
            <span className="text-[#1B7867]">•</span> {getDailyQuote()}
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 ${userLocation === 'West' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
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
          
          {userLocation === 'West' && <VoorraadCard />}
        </div>
      </div>
    </SidebarLayout>
  );
}
