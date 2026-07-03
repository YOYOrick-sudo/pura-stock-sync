import { useEffect, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { TicketList } from '@/components/maintenance/TicketList';
import { NewTicketForm } from '@/components/maintenance/NewTicketForm';
import { TicketDetail } from '@/components/maintenance/TicketDetail';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceActor, Vestiging } from '@/types/maintenance';

type Screen =
  | { type: 'list' }
  | { type: 'new' }
  | { type: 'detail'; ticketId: string };

function toVestiging(loc: string): Vestiging | null {
  const v = loc.toLowerCase();
  if (v === 'west' || v === 'midsland') return v;
  return null;
}

export default function Onderhoud() {
  const { userLocation } = useUserLocation();
  const [screen, setScreen] = useState<Screen>({ type: 'list' });
  const [authUser, setAuthUser] = useState<{ id: string; naam: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const naam =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
        user.email?.split('@')[0] ||
        'Medewerker';
      setAuthUser({ id: user.id, naam });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vestiging = toVestiging(userLocation);
  const actor: MaintenanceActor | null =
    authUser && vestiging ? { id: authUser.id, naam: authUser.naam, vestiging } : null;

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        {actor ? (
          <>
            {screen.type === 'list' && (
              <TicketList
                actor={actor}
                onNewTicket={() => setScreen({ type: 'new' })}
                onTicketClick={(id) => setScreen({ type: 'detail', ticketId: id })}
              />
            )}
            {screen.type === 'new' && (
              <NewTicketForm
                actor={actor}
                onBack={() => setScreen({ type: 'list' })}
                onSuccess={() => setScreen({ type: 'list' })}
              />
            )}
            {screen.type === 'detail' && (
              <TicketDetail
                ticketId={screen.ticketId}
                actor={actor}
                onBack={() => setScreen({ type: 'list' })}
              />
            )}
          </>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Even geduld...
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
