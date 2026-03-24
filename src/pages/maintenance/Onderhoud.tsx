import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { PincodeLogin } from '@/components/maintenance/PincodeLogin';
import { TicketList } from '@/components/maintenance/TicketList';
import { NewTicketForm } from '@/components/maintenance/NewTicketForm';
import { TicketDetail } from '@/components/maintenance/TicketDetail';
import { MaintenanceSettings } from '@/components/maintenance/MaintenanceSettings';
import { useMaintenanceAuth } from '@/hooks/maintenance/useMaintenanceAuth';

type Screen =
  | { type: 'list' }
  | { type: 'new' }
  | { type: 'detail'; ticketId: string }
  | { type: 'settings' };

export default function Onderhoud() {
  const { user, isLoggedIn, loading, error, login, logout } = useMaintenanceAuth();
  const [screen, setScreen] = useState<Screen>({ type: 'list' });

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto">
        {!isLoggedIn ? (
          <PincodeLogin onLogin={login} loading={loading} error={error} />
        ) : user && (
          <>
            {screen.type === 'list' && (
              <TicketList
                user={user}
                onNewTicket={() => setScreen({ type: 'new' })}
                onTicketClick={(id) => setScreen({ type: 'detail', ticketId: id })}
                onSettings={() => setScreen({ type: 'settings' })}
                onLogout={() => { logout(); setScreen({ type: 'list' }); }}
              />
            )}
            {screen.type === 'new' && (
              <NewTicketForm
                user={user}
                onBack={() => setScreen({ type: 'list' })}
                onSuccess={() => setScreen({ type: 'list' })}
              />
            )}
            {screen.type === 'detail' && (
              <TicketDetail
                ticketId={screen.ticketId}
                user={user}
                onBack={() => setScreen({ type: 'list' })}
              />
            )}
            {screen.type === 'settings' && (
              <MaintenanceSettings
                onBack={() => setScreen({ type: 'list' })}
              />
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
