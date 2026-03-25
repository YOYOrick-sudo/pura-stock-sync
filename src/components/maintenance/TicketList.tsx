import { useState } from 'react';
import { Plus, LogOut, Settings, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaintenanceTickets, useTicketCounts } from '@/hooks/maintenance/useMaintenanceTickets';
import type { MaintenanceUser, MaintenanceTicket, Vestiging } from '@/types/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TicketListProps {
  user: MaintenanceUser;
  onNewTicket: () => void;
  onTicketClick: (ticketId: string) => void;
  onSettings: () => void;
  onLogout: () => void;
}

const prioriteitConfig = {
  hoog: { color: '#EF4444', bg: '#FEF2F2', label: 'Hoog' },
  midden: { color: '#F59E0B', bg: '#FFFBEB', label: 'Midden' },
  laag: { color: '#22C55E', bg: '#F0FDF4', label: 'Laag' },
};

const statusConfig = {
  nieuw: { color: '#EF4444', bg: '#FEF2F2', label: 'Nieuw', icon: AlertTriangle },
  in_behandeling: { color: '#F59E0B', bg: '#FFFBEB', label: 'In behandeling', icon: Clock },
  afgehandeld: { color: '#22C55E', bg: '#F0FDF4', label: 'Afgehandeld', icon: CheckCircle2 },
};

export function TicketList({ user, onNewTicket, onTicketClick, onSettings, onLogout }: TicketListProps) {
  const isEigenaar = user.rol === 'eigenaar';
  const [activeTab, setActiveTab] = useState<Vestiging | 'alles'>(
    isEigenaar ? 'alles' : user.vestiging
  );

  const vestigingFilter = isEigenaar ? activeTab : user.vestiging;
  const { data: tickets, isLoading } = useMaintenanceTickets(vestigingFilter);
  const counts = useTicketCounts(vestigingFilter);

  // Sort: prioriteit hoog first, then by date
  const sortedTickets = [...(tickets ?? [])].sort((a, b) => {
    const prioOrder = { hoog: 0, midden: 1, laag: 2 };
    const statusOrder = { nieuw: 0, in_behandeling: 1, afgehandeld: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (prioOrder[a.prioriteit] !== prioOrder[b.prioriteit]) {
      return prioOrder[a.prioriteit] - prioOrder[b.prioriteit];
    }
    return new Date(b.aangemaakt_op).getTime() - new Date(a.aangemaakt_op).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            color: '#282E3A',
          }}>
            Onderhoudsmeldingen
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#73747B',
          }}>
            Welkom, {user.naam}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEigenaar && (
            <Button
              variant="outline"
              size="icon"
              onClick={onSettings}
              style={{
                borderRadius: '12px',
                border: '1px solid rgba(197, 197, 202, 0.5)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Settings className="h-5 w-5" style={{ color: '#73747B' }} />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onLogout}
            style={{
              borderRadius: '12px',
              border: '1px solid rgba(197, 197, 202, 0.5)',
              backgroundColor: '#FFFFFF',
            }}
          >
            <LogOut className="h-5 w-5" style={{ color: '#73747B' }} />
          </Button>
        </div>
      </div>

      {/* KPI Tellers */}
      <div className="grid grid-cols-3 gap-4">
        <Card style={{
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(197, 197, 202, 0.3)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle className="h-5 w-5" style={{ color: '#EF4444' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#73747B' }}>Hoog</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#EF4444' }}>
              {isLoading ? <Skeleton className="h-7 w-8" /> : counts.hoog}
            </p>
          </div>
        </Card>

        <Card style={{
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(197, 197, 202, 0.3)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Clock className="h-5 w-5" style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#73747B' }}>Openstaand</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#F59E0B' }}>
              {isLoading ? <Skeleton className="h-7 w-8" /> : counts.openstaand}
            </p>
          </div>
        </Card>

        <Card style={{
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(197, 197, 202, 0.3)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle2 className="h-5 w-5" style={{ color: '#22C55E' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#73747B' }}>Afgehandeld</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#22C55E' }}>
              {isLoading ? <Skeleton className="h-7 w-8" /> : counts.afgehandeld}
            </p>
          </div>
        </Card>
      </div>

      {/* Vestiging tabs (only for eigenaar) */}
      {isEigenaar && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Vestiging | 'alles')}>
          <TabsList style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid rgba(197, 197, 202, 0.3)',
            padding: '4px',
          }}>
            <TabsTrigger value="alles" style={{ borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              Alles
            </TabsTrigger>
            <TabsTrigger value="west" style={{ borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              West
            </TabsTrigger>
            <TabsTrigger value="midsland" style={{ borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              Midsland
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Ticket list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : sortedTickets.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#73747B' }}>
              Geen meldingen gevonden
            </p>
          </div>
        ) : (
          sortedTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
          ))
        )}
      </div>

      {/* FAB - New ticket button */}
      <button
        onClick={onNewTicket}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: '#1B7867',
          color: '#FFFFFF',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(27, 120, 103, 0.3)',
          transition: 'all 200ms ease',
          zIndex: 50,
        }}
        className="hover:scale-105 active:scale-95"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: MaintenanceTicket; onClick: () => void }) {
  const prio = prioriteitConfig[ticket.prioriteit];
  const status = statusConfig[ticket.status];
  const StatusIcon = status.icon;

  return (
    <Card
      onClick={onClick}
      style={{
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1px solid rgba(197, 197, 202, 0.3)',
        backgroundColor: '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 200ms ease',
      }}
      className="hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: prio.bg,
              color: prio.color,
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {prio.label}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: status.bg,
              color: status.color,
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
            }}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#94A3B8',
              textTransform: 'capitalize',
            }}>
              {ticket.vestiging}
            </span>
          </div>
          <h3 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 500,
            color: '#282E3A',
            marginBottom: '4px',
          }}>
            {ticket.titel}
          </h3>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#94A3B8',
          }}>
            {ticket.melder?.naam ?? 'Onbekend'} &middot;{' '}
            {formatDistanceToNow(new Date(ticket.aangemaakt_op), { addSuffix: true, locale: nl })}
          </p>
        </div>
      </div>
    </Card>
  );
}
