import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Bell, Package, LucideIcon } from 'lucide-react';

const puraVidaQuotesWest = [
  "Kwaliteit begint met aandacht voor detail",
  "Samen bouwen we aan iets moois",
  "Focus op wat echt belangrijk is",
  "Groei zit in de kleine stappen",
  "Plezier en passie gaan hand in hand",
  "Elke uitdaging is een kans om te leren",
  "Vertrouwen begint bij jezelf",
  "Rust creëert ruimte voor creativiteit",
  "Kleine verbeteringen maken het verschil",
  "Blijf nieuwsgierig, blijf groeien",
  "Samen bereiken we meer",
  "Consistentie leidt tot excellentie",
  "Een open geest opent deuren",
  "Geduld is de sleutel tot perfectie",
  "Eenvoud is de ultieme verfijning",
  "Focus maakt dromen werkelijkheid",
  "Elke dag is een nieuwe start",
  "Doorzettingsvermogen betaalt zich terug",
  "Balans brengt betere resultaten",
  "Authentiek zijn is de beste strategie",
  "Leren van fouten maakt je sterker",
  "Commitment creëert resultaten",
  "Blijf kalm en werk planmatig",
  "Positiviteit straalt naar anderen",
  "Precision komt voort uit zorgvuldigheid",
  "Samenwerking versterkt het team",
  "Flexibiliteit is kracht",
  "Klein beginnen, groot eindigen",
  "Vernieuwing houdt ons scherp",
  "Elke stap telt",
  "Waarde creëer je met aandacht",
  "Respect voor het proces",
  "Doelen behalen begint met een plan",
  "Blijf gefocust op de missie",
  "Duidelijkheid voorkomt verwarring",
  "Kwaliteit boven kwantiteit",
  "Discipline leidt tot vrijheid",
  "Een positieve mindset werkt aanstekelijk",
  "Stabiliteit biedt groei",
  "Details maken de ervaring",
  "Blijf consistent in je aanpak",
  "Rust geeft energie",
  "Vertrouwen is de basis",
  "Transparantie schept verbinding",
  "Geduld loont altijd",
  "Eenvoud in complexiteit",
  "Focus op vooruitgang",
  "Blijf trouw aan je waarden",
  "Samen zijn we sterker",
  "Kwaliteit is een keuze"
];

const puraVidaQuotesOost = [
  "Creativiteit ontstaat in vrijheid",
  "Elke dag is een kans om te excelleren",
  "Teamwork maakt dromen werkelijkheid",
  "Innovatie begint met een open mindset",
  "Positiviteit is aanstekelijk",
  "Blijf experimenteren en leren",
  "Durf risico's te nemen",
  "Passie drijft prestatie",
  "Flexibiliteit is de sleutel",
  "Luister naar je intuïtie",
  "Verandering brengt groei",
  "Creativiteit vereist ruimte",
  "Samen creëren we magie",
  "Energie volgt aandacht",
  "Vernieuwing vraagt om moed",
  "Inspiratie komt van binnen",
  "Blijf authentiek en eerlijk",
  "Experimenten leiden tot doorbraken",
  "Een frisse blik vernieuwt",
  "Diversiteit verrijkt het proces",
  "Vrijheid bevordert creativiteit",
  "Vertrouw op het proces",
  "Innovatie vraagt om geduld",
  "Elke stem telt in het team",
  "Blijf spelen met ideeën",
  "Momentum ontstaat door actie",
  "Samenwerken versterkt visie",
  "Durf anders te denken",
  "Grenzen zijn er om te verleggen",
  "Nieuwsgierigheid voedt groei",
  "Blijf open voor nieuwe inzichten",
  "Creativiteit kent geen grenzen",
  "Vernieuwing begint vandaag",
  "Elke bijdrage heeft waarde",
  "Optimisme opent mogelijkheden",
  "Blijf flexibel in je aanpak",
  "Innovatie vereist experimenten",
  "Een frisse start elke dag",
  "Diversiteit is onze kracht",
  "Creativiteit bloeit in vertrouwen",
  "Blijf zoeken naar nieuwe wegen",
  "Teamgeest stimuleert succes",
  "Vernieuwing houdt ons scherp",
  "Vrijheid in denken leidt tot groei",
  "Blijf jezelf uitdagen",
  "Innoveren is een mindset",
  "Energie creëer je samen",
  "Blijf nieuwsgierig naar mogelijkheden",
  "Creativiteit is een reis",
  "Samen innoveren we verder"
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
      className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 border border-gray-200"
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
      className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 ${status.borderColor} ${status.bgColor}`}
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
          Voorraad Telling
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

export default function Dashboard() {
  const [userLocation, setUserLocation] = useState<string>('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getDailyQuote = (location: string) => {
    const quotes = location === 'West' ? puraVidaQuotesWest : puraVidaQuotesOost;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return quotes[dayOfYear % quotes.length];
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
            <span className="text-[#1B7867]">•</span> {getDailyQuote(userLocation)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          
          {userLocation === 'Oost' && (
            <DashboardCard
              title="Wachtende Bestellingen"
              count={pendingOrders || 0}
              icon={Package}
              onClick={() => navigate('/kitchen-internal-orders')}
              isLoading={loadingOrders}
            />
          )}
          
          {userLocation === 'West' && <VoorraadCard />}
        </div>
      </div>
    </SidebarLayout>
  );
}
