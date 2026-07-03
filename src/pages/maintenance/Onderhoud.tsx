import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { PincodeLogin } from '@/components/maintenance/PincodeLogin';
import { TicketList } from '@/components/maintenance/TicketList';
import { NewTicketForm } from '@/components/maintenance/NewTicketForm';
import { TicketDetail } from '@/components/maintenance/TicketDetail';
import { MaintenanceSettings } from '@/components/maintenance/MaintenanceSettings';
import { useMaintenanceAuth } from '@/hooks/maintenance/useMaintenanceAuth';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState as useReactState } from 'react';
import type { MaintenanceUser, Vestiging } from '@/types/maintenance';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

type Screen =
  | { type: 'list' }
  | { type: 'new' }
  | { type: 'detail'; ticketId: string }
  | { type: 'settings' };

function toVestiging(loc: string): Vestiging | null {
  const v = loc.toLowerCase();
  if (v === 'west' || v === 'midsland') return v;
  return null;
}

export default function Onderhoud() {
  const { user: pinUser, isLoggedIn: pinLoggedIn, loading, error, login, logout } =
    useMaintenanceAuth();
  const { userLocation } = useUserLocation();
  const [screen, setScreen] = useState<Screen>({ type: 'list' });
  const [showBeheer, setShowBeheer] = useReactState(false);

  const [authUser, setAuthUser] = useReactState<{ id: string; naam: string } | null>(null);

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

  // Staff mode: ingelogd in de app + geldige vestiging + niet expliciet in beheer
  const staffUser: MaintenanceUser | null =
    authUser && vestiging && !showBeheer
      ? {
          id: authUser.id,
          naam: authUser.naam,
          rol: 'teamleider',
          vestiging,
          pincode_hash: '',
          actief: true,
          created_at: '',
          updated_at: '',
          isStaff: true,
        }
      : null;

  const activeUser: MaintenanceUser | null = staffUser ?? pinUser ?? null;
  const inBeheer = showBeheer || pinLoggedIn;

  const handleLogoutBeheer = () => {
    logout();
    setShowBeheer(false);
    setScreen({ type: 'list' });
  };

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        {inBeheer && !pinLoggedIn ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowBeheer(false)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Terug naar meldingen
            </button>
            <PincodeLogin onLogin={login} loading={loading} error={error} />
          </div>
        ) : activeUser ? (
          <>
            {screen.type === 'list' && (
              <>
                <TicketList
                  user={activeUser}
                  onNewTicket={() => setScreen({ type: 'new' })}
                  onTicketClick={(id) => setScreen({ type: 'detail', ticketId: id })}
                  onSettings={() => setScreen({ type: 'settings' })}
                  onLogout={handleLogoutBeheer}
                />
                {activeUser.isStaff && (
                  <div className="mt-8 pt-6 border-t border-border flex justify-center">
                    <button
                      onClick={() => setShowBeheer(true)}
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Beheer inloggen
                    </button>
                  </div>
                )}
              </>
            )}
            {screen.type === 'new' && (
              <NewTicketForm
                user={activeUser}
                onBack={() => setScreen({ type: 'list' })}
                onSuccess={() => setScreen({ type: 'list' })}
              />
            )}
            {screen.type === 'detail' && (
              <TicketDetail
                ticketId={screen.ticketId}
                user={activeUser}
                onBack={() => setScreen({ type: 'list' })}
              />
            )}
            {screen.type === 'settings' && (
              <MaintenanceSettings onBack={() => setScreen({ type: 'list' })} />
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
