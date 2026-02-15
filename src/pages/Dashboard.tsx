import { SidebarLayout } from '@/components/SidebarLayout';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { CheckCircle, AlertCircle, Clock, ListTodo, Package } from 'lucide-react';
import { HandoverCard } from '@/components/HandoverCard';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';
import { toast } from 'sonner';

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
      message: 'Voorraad telling verwacht!',
      subtitle: 'Nog niet ingediend vandaag'
    };
  }
  
  if (daysUntil <= 1) {
    return {
      status: 'warning',
      message: `Over ${daysUntil} dag${daysUntil === 1 ? '' : 'en'}`,
      subtitle: lastSubmitted ? `Laatst: ${lastSubmitted.split(',')[0]}` : 'Nog niet ingediend'
    };
  }
  
  return {
    status: 'ok',
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
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/* ─── Stat Card Component ─── */

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentColor: string;
  onClick?: () => void;
  children?: React.ReactNode;
  isLoading?: boolean;
}

const StatCard = ({ label, value, icon, accentColor, onClick, children, isLoading }: StatCardProps) => (
  <div
    onClick={onClick}
    style={{
      background: '#FFFFFF',
      border: '1px solid #D5D8E0',
      borderRadius: '20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}
    onMouseEnter={e => {
      if (!onClick) return;
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={e => {
      if (!onClick) return;
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    {/* 3px accent bar */}
    <div style={{ height: '3px', background: accentColor, width: '100%' }} />

    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
      {/* Icon + Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: `${accentColor}1F`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            color: '#636878',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <span
        style={{
          fontFamily: '"Instrument Sans", sans-serif',
          fontSize: '28px',
          fontWeight: 700,
          color: '#1A1F28',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        {isLoading ? '...' : value}
      </span>

      {/* Optional children (subtitle text) */}
      {children && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {children}
        </div>
      )}
    </div>
  </div>
);

/* ─── Voorraad Card ─── */

const VoorraadCard = () => {
  const navigate = useNavigate();
  const status = getVoorraadStatus();
  const nextFriday = getNextFriday();

  const accentMap: Record<string, string> = {
    urgent: '#EF4444',
    warning: '#F59E0B',
    ok: '#F59E0B',
  };

  const iconMap: Record<string, React.ReactNode> = {
    urgent: <AlertCircle size={18} color={accentMap.urgent} />,
    warning: <Clock size={18} color={accentMap.warning} />,
    ok: <CheckCircle size={18} color={accentMap.ok} />,
  };

  return (
    <StatCard
      label="Telling & Bestelling"
      value={nextFriday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
      icon={iconMap[status.status]}
      accentColor={accentMap[status.status]}
      onClick={() => navigate('/internal-orders')}
    >
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#303542' }}>{status.message}</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#636878' }}>{status.subtitle}</span>
    </StatCard>
  );
};

/* ─── Delivery Card ─── */

interface DeliveryCardProps {
  hasOrderThisWeek: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const DeliveryCard = ({ hasOrderThisWeek, isLoading, onClick }: DeliveryCardProps) => {
  const nextWednesday = getNextWednesday();

  return (
    <StatCard
      label="Levering van West"
      value={isLoading ? '...' : nextWednesday.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
      icon={hasOrderThisWeek
        ? <CheckCircle size={18} color="#F59E0B" />
        : <Package size={18} color="#F59E0B" />
      }
      accentColor="#F59E0B"
      onClick={onClick}
      isLoading={isLoading}
    >
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#303542' }}>
        {hasOrderThisWeek ? 'Bestelling geplaatst' : 'Nog geen bestelling'}
      </span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#636878' }}>
        {hasOrderThisWeek ? 'Levering woensdag' : 'Plaats bestelling'}
      </span>
    </StatCard>
  );
};

/* ─── Main Dashboard ─── */

export default function Dashboard() {
  const { userLocation } = useUserLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [weatherData, setWeatherData] = useState<{
    condition: string;
    temperature: number;
    windSpeed: number;
    precipitation: number;
  } | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    type: string;
    text: string;
    reasoning: string;
  }>>([]);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Realtime subscription voor FOH Tasks
  useEffect(() => {
    if (!userLocation) return;
    const channel = supabase
      .channel('dashboard-foh-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'foh_tasks', filter: `location=eq.${userLocation}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-pending-tasks', userLocation] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userLocation, queryClient]);

  // Realtime subscription voor Notifications
  useEffect(() => {
    const setupNotificationsSub = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel('dashboard-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    setupNotificationsSub();
  }, [queryClient]);

  // Realtime subscription voor Internal Orders (alleen Oost)
  useEffect(() => {
    if (!userLocation || userLocation === 'West') return;
    const channel = supabase
      .channel('dashboard-internal-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-pending-orders', userLocation] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userLocation, queryClient]);

  // Fetch weather and AI suggestions
  const fetchWeatherAndSuggestions = async () => {
    if (!userLocation?.trim()) return;
    setLoadingWeather(true);
    try {
      const { data, error } = await supabase.functions.invoke('weather-ai-advisor', {
        body: { location: userLocation.trim() }
      });
      if (error) throw error;
      if (data.weather) setWeatherData(data.weather);
      if (data.suggestions) setAiSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast.error('Kon weer niet ophalen');
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (userLocation?.trim()) fetchWeatherAndSuggestions();
  }, [userLocation]);

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
        const startOfWeek = getStartOfWeek();
        const { data } = await supabase
          .from('internal_orders')
          .select('*')
          .eq('from_location', 'West')
          .eq('to_location', 'Midsland')
          .eq('status', 'approved')
          .gte('created_at', startOfWeek.toISOString());
        return data && data.length > 0;
      }
      const { data } = await supabase
        .from('internal_orders')
        .select('*')
        .or(`from_location.eq.${userLocation},to_location.eq.${userLocation}`)
        .eq('status', 'pending');
      return data?.length || 0;
    },
    enabled: !!userLocation,
  });

  const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Page Header */}
        <div style={{ borderBottom: '1px solid #D5D8E0', paddingBottom: '20px' }}>
          <h1 style={{
            fontFamily: '"Instrument Sans", sans-serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#1A1F28',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Dashboard
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#636878',
            marginTop: '4px',
          }}>
            {userLocation || 'Locatie'} · {today}
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <StatCard
            label="Openstaande Taken"
            value={String(pendingTasks || 0)}
            icon={<ListTodo size={18} color="#E27726" />}
            accentColor="#E27726"
            onClick={() => navigate('/taken-bediening')}
            isLoading={loadingTasks}
          />

          <WeatherWidget
            condition={weatherData?.condition}
            temperature={weatherData?.temperature}
            windSpeed={weatherData?.windSpeed}
            precipitation={weatherData?.precipitation}
            isLoading={loadingWeather || !weatherData}
          />

          {userLocation === 'Oost' && (
            <StatCard
              label="Wachtende Bestellingen"
              value={String(typeof pendingOrders === 'number' ? pendingOrders : 0)}
              icon={<Package size={18} color="#F59E0B" />}
              accentColor="#F59E0B"
              onClick={() => navigate('/internal-orders')}
              isLoading={loadingOrders}
            />
          )}

          {userLocation === 'Midsland' && (
            <DeliveryCard
              hasOrderThisWeek={typeof pendingOrders === 'boolean' ? pendingOrders : false}
              isLoading={loadingOrders}
              onClick={() => navigate('/midsland-bestellingen')}
            />
          )}

          {userLocation === 'West' && <VoorraadCard />}
        </div>

        {/* Handover Card */}
        <HandoverCard />
      </div>
    </SidebarLayout>
  );
}
