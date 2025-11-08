import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Bell, Package, LucideIcon } from 'lucide-react';
import { useUserLocation } from '@/contexts/UserLocationContext';

const puraVidaQuotesWest = [
  "Geniet van de kleine dingen vandaag",
  "Samen maken we het verschil",
  "Gastvrijheid begint met een glimlach",
  "Aandacht maakt het bijzonder",
  "Pura Vida - pure levensvreugde",
  "Elk moment telt",
  "Wat je geeft, krijg je terug",
  "Ontspanning brengt het beste naar boven",
  "Eerlijk duurt het langst",
  "Warmte creëer je samen",
  "Kwaliteit voel je gewoon",
  "Rust en regelmaat, daar word je blij van",
  "Zorgvuldigheid loont altijd",
  "Samen zijn is fijn",
  "Goed eten, goed leven",
  "Respect voor product en mens",
  "Pure producten, puur genot",
  "Gastvrijheid zit in de details",
  "Iedereen is welkom hier",
  "Aandacht is ons recept",
  "Gevoel en vakmanschap gaan hand in hand",
  "Ontspannen werken, beter leven",
  "Samen bouwen we iets moois",
  "Eerlijk en met liefde gemaakt",
  "Genieten begint hier",
  "Elke dag is een nieuw avontuur",
  "Rust creëert ruimte voor plezier",
  "Wat we doen, doen we goed",
  "Betrokkenheid maakt het verschil",
  "Pure smaak, puur geluk",
  "Samen genieten is dubbel genieten",
  "Aandacht voor elkaar, altijd",
  "Gastvrijheid komt van binnen",
  "Eerlijk is ons handelsmerk",
  "Kwaliteit zonder compromissen",
  "Rust en energie in balans",
  "Goed bezig team!",
  "Samen maken we mooie momenten",
  "Zorgvuldig en met plezier",
  "Pura Vida is een gevoel",
  "Genieten doe je met elkaar",
  "Warmte en gezelligheid voorop",
  "Echt en oprecht, altijd",
  "Pure vreugde in alles",
  "Samen sterker, samen beter",
  "Aandacht voor de kleine dingen",
  "Gasten voelen zich thuis hier",
  "Eerlijk werk, eerlijk plezier",
  "Rust en regelmaat brengen rust",
  "Pura Vida - elke dag weer"
];

const puraVidaQuotesOost = [
  "Creativiteit houdt ons levendig",
  "Vernieuwing begint vandaag",
  "Samen ontdekken we meer",
  "Durf te verrassen",
  "Pura Vida - altijd in beweging",
  "Smaak evolueert, wij ook",
  "Vernieuwing houdt ons scherp",
  "Creativiteit en plezier gaan samen",
  "Ontdekken en ontwikkelen",
  "Samen maken we het bijzonder",
  "Durf te experimenteren",
  "Vernieuwing met respect",
  "Creativiteit komt van binnen",
  "Samen blijven we verrassend",
  "Innovatie met een glimlach",
  "Ontwikkelen en genieten",
  "Vernieuwing voedt de ziel",
  "Creativiteit is ons DNA",
  "Samen creëren we magie",
  "Durf anders te denken",
  "Vernieuwen zonder te vergeten",
  "Creativiteit vraagt om vrijheid",
  "Samen vernieuwen we",
  "Ontdekken is een avontuur",
  "Vernieuwing met zorgvuldigheid",
  "Creativiteit in elk detail",
  "Samen blijven we fris",
  "Durf te groeien",
  "Vernieuwing met plezier",
  "Creativiteit brengt leven",
  "Samen ontwikkelen we verder",
  "Vernieuwen is een reis",
  "Creativiteit zonder grenzen",
  "Samen maken we het mooier",
  "Durf te dromen",
  "Vernieuwing houdt ons levend",
  "Creativiteit en gastvrijheid",
  "Samen blijven we inspireren",
  "Vernieuwen met passie",
  "Creativiteit is onze kracht",
  "Samen vooruit, samen voorop",
  "Durf te veranderen",
  "Vernieuwing met aandacht",
  "Creativiteit geeft energie",
  "Samen blijven we ontdekken",
  "Vernieuwing maakt ons uniek",
  "Creativiteit in beweging",
  "Samen maken we het waar",
  "Pura Vida - altijd verrassend",
  "Creativiteit en groei gaan samen"
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

// Helper functies voor Midsland Delivery
const getNextWednesday = (): Date => {
  const today = new Date();
  const daysUntilWednesday = (3 - today.getDay() + 7) % 7 || 7;
  const nextWednesday = new Date(today);
  nextWednesday.setDate(today.getDate() + daysUntilWednesday);
  return nextWednesday;
};

const getStartOfWeek = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekNumber = (date: Date = new Date()): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
      className="p-6 cursor-pointer transition-shadow duration-200 hover:shadow-md active:scale-[0.98] bg-gradient-to-br from-white/50 to-gray-50/50 border border-gray-200/80"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-[#1B7867]/10 rounded-lg">
          <Icon className="h-6 w-6 text-[#1B7867]" />
        </div>
        <div className="text-right">
          <span className="text-4xl font-bold text-[#1B7867] tracking-tight">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              count
            )}
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-xs text-gray-500">Klik voor details</p>
      </div>
    </Card>
  );
};

const VoorraadCard = () => {
  const navigate = useNavigate();
  const status = getVoorraadStatus();
  const nextFriday = getNextFriday();
  
  return (
    <Card 
      className={`p-6 cursor-pointer transition-shadow duration-200 hover:shadow-md active:scale-[0.98] border-2 ${status.borderColor} ${status.bgColor}`}
      onClick={() => navigate('/voorraad')}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${status.bgColor === 'bg-red-50' ? 'bg-red-100' : status.bgColor === 'bg-orange-50' ? 'bg-orange-100' : 'bg-green-100'}`}>
          <Package className={`h-6 w-6 ${status.color}`} />
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${status.color} tracking-tight`}>
            {nextFriday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">
          Telling & Bestelling
        </p>
        <p className="text-xs text-gray-500 mb-1">
          Bestel bij Pura Midsland
        </p>
        <p className={`text-xs ${status.color} font-semibold mb-0.5`}>
          {status.message}
        </p>
        <p className="text-xs text-gray-500">
          {status.subtitle}
        </p>
      </div>
    </Card>
  );
};

interface DeliveryCardProps {
  hasOrderThisWeek: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const DeliveryCard = ({ hasOrderThisWeek, isLoading, onClick }: DeliveryCardProps) => {
  const nextWednesday = getNextWednesday();
  
  return (
    <Card 
      className="p-6 cursor-pointer transition-shadow duration-200 hover:shadow-md active:scale-[0.98] border-l-4 border-l-[#1B7867] bg-white"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-[#1B7867]/10 rounded-lg">
          <Package className="h-6 w-6 text-[#1B7867]" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#1B7867] tracking-tight">
            {nextWednesday.toLocaleDateString('nl-NL', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'numeric' 
            })}
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Breng Dienst West
        </p>
        <p className="text-xs text-gray-600 mb-2">
          Volgende bezorgdag
        </p>
        {isLoading ? (
          <p className="text-xs text-gray-400 animate-pulse">Laden...</p>
        ) : (
          <p className={`text-xs font-semibold ${hasOrderThisWeek ? 'text-[#1B7867]' : 'text-gray-500'}`}>
            {hasOrderThisWeek ? '✓ Bestelling ontvangen van West' : '○ Wacht op bestelling van West'}
          </p>
        )}
      </div>
    </Card>
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
          filter: `location=eq.${userLocation}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-pending-tasks', userLocation] });
        }
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
            filter: `user_id=eq.${user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    setupNotificationsSub();
  }, [queryClient]);

  // Realtime subscription voor Internal Orders (alleen Oost)
  useEffect(() => {
    if (!userLocation || userLocation === 'West') return;
    
    const channel = supabase
      .channel('dashboard-internal-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internal_orders'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-pending-orders', userLocation] });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userLocation, queryClient]);

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

  // Query 3: Wachtende Bestellingen / Midsland Status
  const { data: pendingOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard-pending-orders', userLocation],
    queryFn: async () => {
      if (userLocation === 'Midsland') {
        // Voor Midsland: check of er deze week een bestelling is
        const startOfWeek = getStartOfWeek();
        const { data } = await supabase
          .from('internal_orders')
          .select('*')
          .eq('from_location', 'West')
          .eq('to_location', 'Midsland')
          .in('status', ['pending', 'approved'])
          .gte('created_at', startOfWeek.toISOString());
        return data && data.length > 0; // Returns boolean
      }
      
      // Voor Oost: bestaande logica (count)
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
      <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
        <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Aloha Pura - <span className="text-[#1B7867]">{userLocation}</span>!
        </h1>
          
          <p className="text-sm text-muted-foreground">
            <span className="text-[#1B7867]/40 font-medium">Week {getWeekNumber()}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Openstaande Taken"
            count={pendingTasks || 0}
            icon={CheckSquare}
            onClick={() => navigate('/taken-bediening')}
            isLoading={loadingTasks}
          />
          
          <DashboardCard
            title="Nieuwe Meldingen"
            count={unreadNotifications || 0}
            icon={Bell}
            onClick={() => {/* Could trigger notifications dropdown */}}
            isLoading={loadingNotifications}
          />
          
          {userLocation === 'Oost' && (
            <DashboardCard
              title="Wachtende Bestellingen"
              count={(typeof pendingOrders === 'number' ? pendingOrders : 0)}
              icon={Package}
              onClick={() => navigate('/kitchen-internal-orders')}
              isLoading={loadingOrders}
            />
          )}

          {userLocation === 'Midsland' && (
            <DeliveryCard
              hasOrderThisWeek={(typeof pendingOrders === 'boolean' ? pendingOrders : false)}
              isLoading={loadingOrders}
              onClick={() => navigate('/midsland-bestellingen')}
            />
          )}
          
          {userLocation === 'West' && <VoorraadCard />}
        </div>
      </div>
    </SidebarLayout>
  );
}
