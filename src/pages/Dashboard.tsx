import { SidebarLayout } from '@/components/SidebarLayout';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { PolarKPICard } from '@/components/polar';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

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
  onClick: () => void;
  isLoading?: boolean;
}

const DashboardCard = ({ title, count, onClick, isLoading }: DashboardCardProps) => {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <PolarKPICard
        compact
        title={title}
        value={isLoading ? "..." : String(count)}
        statusColor={{ bg: '#F6F7DD' }}
      />
    </div>
  );
};

const VoorraadCard = () => {
  const navigate = useNavigate();
  const status = getVoorraadStatus();
  const nextFriday = getNextFriday();
  
  // Map status naar Pura Vida colors
  const getStatusColors = (status: any) => {
    switch(status.status) {
      case 'urgent':
        return { bg: '#F6F7DD', text: '#DC2626', icon: <AlertCircle size={16} /> };
      case 'warning':
        return { bg: '#F6F7DD', text: '#D97706', icon: <Clock size={16} /> };
      case 'ok':
        return { bg: '#F6F7DD', text: '#1B7867', icon: <CheckCircle size={16} /> };
      default:
        return undefined;
    }
  };
  
  return (
    <div onClick={() => navigate('/internal-orders')} style={{ cursor: 'pointer' }}>
      <PolarKPICard
        compact
        title="Telling & Bestelling"
        value={nextFriday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
        contentText={{
          primary: status.message,
          secondary: status.subtitle
        }}
        statusColor={getStatusColors(status)}
      />
    </div>
  );
};

interface DeliveryCardProps {
  hasOrderThisWeek: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const DeliveryCard = ({ hasOrderThisWeek, isLoading, onClick }: DeliveryCardProps) => {
  const nextWednesday = getNextWednesday();
  
  // Pura Vida Sea voor geplaatste orders
  const statusColor = hasOrderThisWeek 
    ? { bg: '#F6F7DD', text: '#1B7867', icon: <CheckCircle size={16} /> }
    : undefined;
  
  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <PolarKPICard
        compact
        title="Levering van West"
        value={isLoading 
          ? "..." 
          : nextWednesday.toLocaleDateString('nl-NL', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short' 
            })
        }
        contentText={{
          primary: hasOrderThisWeek ? "Bestelling geplaatst" : "Nog geen bestelling",
          secondary: hasOrderThisWeek 
            ? "Levering woensdag" 
            : "Plaats bestelling"
        }}
        statusColor={statusColor}
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
          .eq('status', 'approved')
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#73747B'
          }}>
            {userLocation}
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#73747B'
          }}>
            Week {getWeekNumber()}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          maxWidth: '1200px'
        }}>
          <DashboardCard
            title="Openstaande Taken"
            count={pendingTasks || 0}
            onClick={() => navigate('/taken-bediening')}
            isLoading={loadingTasks}
          />
          
          <DashboardCard
            title="Nieuwe Meldingen"
            count={unreadNotifications || 0}
            onClick={() => {/* Could trigger notifications dropdown */}}
            isLoading={loadingNotifications}
          />
          
          {userLocation === 'Oost' && (
            <DashboardCard
              title="Wachtende Bestellingen"
              count={(typeof pendingOrders === 'number' ? pendingOrders : 0)}
              onClick={() => navigate('/internal-orders')}
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
