import { useState } from 'react';
import { Plus, LogOut, Settings, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
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
  hoog: { color: '#EF4444', bg: 'hsl(var(--destructive) / 0.1)', label: 'Hoog' },
  midden: { color: '#F59E0B', bg: 'hsl(45 100% 95%)', label: 'Midden' },
  laag: { color: '#2D8E6F', bg: 'hsl(160 40% 95%)', label: 'Laag' },
};

const statusConfig = {
  nieuw: { color: '#EF4444', bg: 'hsl(var(--destructive) / 0.1)', label: 'Nieuw', icon: AlertTriangle },
  in_behandeling: { color: '#F59E0B', bg: 'hsl(45 100% 95%)', label: 'In behandeling', icon: Clock },
  afgehandeld: { color: '#2D8E6F', bg: 'hsl(160 40% 95%)', label: 'Afgehandeld', icon: CheckCircle2 },
};

const cardStyle: React.CSSProperties = {
  borderRadius: '20px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
  transition: 'all 200ms ease',
};

export function TicketList({ user, onNewTicket, onTicketClick, onSettings, onLogout }: TicketListProps) {
  const isEigenaar = user.rol === 'eigenaar';
  const [activeTab, setActiveTab] = useState<Vestiging | 'alles'>(
    isEigenaar ? 'alles' : user.vestiging
  );

  const vestigingFilter = isEigenaar ? activeTab : user.vestiging;
  const { data: tickets, isLoading } = useMaintenanceTickets(vestigingFilter);
  const counts = useTicketCounts(vestigingFilter);

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
          <h1 className="text-2xl font-semibold text-foreground">
            Onderhoudsmeldingen
          </h1>
          <p className="text-sm text-muted-foreground">
            Welkom, {user.naam}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEigenaar && (
            <Button
              variant="outline"
              size="icon"
              onClick={onSettings}
              className="rounded-[14px] border-1.5"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onLogout}
            className="rounded-[14px] border-1.5"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* KPI Tellers */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hoog', value: counts.hoog, icon: AlertTriangle, color: '#EF4444', bg: 'hsl(var(--destructive) / 0.1)' },
          { label: 'Openstaand', value: counts.openstaand, icon: Clock, color: '#F59E0B', bg: 'hsl(45 100% 95%)' },
          { label: 'Afgehandeld', value: counts.afgehandeld, icon: CheckCircle2, color: '#2D8E6F', bg: 'hsl(160 40% 95%)' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                backgroundColor: kpi.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon className="h-5 w-5" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-semibold" style={{ color: kpi.color }}>
                  {isLoading ? <Skeleton className="h-7 w-8" /> : kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vestiging tabs (only for eigenaar) */}
      {isEigenaar && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Vestiging | 'alles')}>
          <TabsList className="bg-card border border-border rounded-[14px] p-1">
            <TabsTrigger value="alles" className="rounded-[10px] text-sm">Alles</TabsTrigger>
            <TabsTrigger value="west" className="rounded-[10px] text-sm">West Daily</TabsTrigger>
            <TabsTrigger value="midsland" className="rounded-[10px] text-sm">Foodbar</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Ticket list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[20px]" />
          ))
        ) : sortedTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[15px] text-muted-foreground">
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
        className="hover:scale-105 active:scale-95"
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)',
          transition: 'all 200ms ease',
          zIndex: 50,
        }}
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
    <div
      onClick={onClick}
      style={{ ...cardStyle, padding: '16px 20px', cursor: 'pointer' }}
      className="hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '6px',
              backgroundColor: prio.bg, color: prio.color,
              fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {prio.label}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '6px',
              backgroundColor: status.bg, color: status.color,
              fontSize: '11px', fontWeight: 600,
            }}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {ticket.vestiging}
            </span>
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">
            {ticket.titel}
          </h3>
          <p className="text-[13px] text-muted-foreground">
            {ticket.melder?.naam ?? 'Onbekend'} &middot;{' '}
            {formatDistanceToNow(new Date(ticket.aangemaakt_op), { addSuffix: true, locale: nl })}
          </p>
        </div>
      </div>
    </div>
  );
}
