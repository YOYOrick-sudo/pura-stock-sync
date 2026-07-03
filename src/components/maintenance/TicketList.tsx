import { useState } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle2, MapPin, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaintenanceTickets, useTicketCounts } from '@/hooks/maintenance/useMaintenanceTickets';
import { useSignedPhotoUrl } from '@/hooks/maintenance/useMaintenancePhoto';
import type { MaintenanceActor, MaintenanceTicket, TicketStatus } from '@/types/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TicketListProps {
  actor: MaintenanceActor;
  onNewTicket: () => void;
  onTicketClick: (ticketId: string) => void;
}

const prioriteitConfig = {
  hoog: { color: '#EF4444', bg: 'hsl(var(--destructive) / 0.1)', label: 'Hoog' },
  midden: { color: '#F59E0B', bg: 'hsl(45 100% 95%)', label: 'Normaal' },
  laag: { color: '#2D8E6F', bg: 'hsl(160 40% 95%)', label: 'Laag' },
};

const statusConfig = {
  nieuw: { color: '#EF4444', bg: 'hsl(var(--destructive) / 0.1)', label: 'Open', icon: AlertTriangle },
  in_behandeling: { color: '#F59E0B', bg: 'hsl(45 100% 95%)', label: 'Bezig', icon: Clock },
  afgehandeld: { color: '#2D8E6F', bg: 'hsl(160 40% 95%)', label: 'Klaar', icon: CheckCircle2 },
};

type StatusFilter = 'open' | 'klaar' | 'alles';

const cardStyle: React.CSSProperties = {
  borderRadius: '20px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
  transition: 'all 200ms ease',
};

export function TicketList({ actor, onNewTicket, onTicketClick }: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');

  const { data: tickets, isLoading } = useMaintenanceTickets(actor.vestiging);
  const counts = useTicketCounts(actor.vestiging);

  const filteredTickets = (tickets ?? []).filter((t) => {
    if (statusFilter === 'alles') return true;
    if (statusFilter === 'open') return t.status === 'nieuw' || t.status === 'in_behandeling';
    return t.status === 'afgehandeld';
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const prioOrder = { hoog: 0, midden: 1, laag: 2 };
    const statusOrder: Record<TicketStatus, number> = { nieuw: 0, in_behandeling: 1, afgehandeld: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    if (prioOrder[a.prioriteit] !== prioOrder[b.prioriteit]) {
      return prioOrder[a.prioriteit] - prioOrder[b.prioriteit];
    }
    return new Date(b.aangemaakt_op).getTime() - new Date(a.aangemaakt_op).getTime();
  });

  const vestigingLabel = actor.vestiging === 'west' ? 'Daily' : 'Foodbar';

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground truncate">
            Onderhoud <span className="text-muted-foreground font-normal">— {vestigingLabel}</span>
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            Meld iets dat niet in de haak is
          </p>
        </div>
      </div>

      {/* KPI Tellers */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Hoog', value: counts.hoog, icon: AlertTriangle, color: '#EF4444', bg: 'hsl(var(--destructive) / 0.1)' },
          { label: 'Openstaand', value: counts.openstaand, icon: Clock, color: '#F59E0B', bg: 'hsl(45 100% 95%)' },
          { label: 'Klaar', value: counts.afgehandeld, icon: CheckCircle2, color: '#2D8E6F', bg: 'hsl(160 40% 95%)' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  backgroundColor: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: kpi.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-semibold leading-tight" style={{ color: kpi.color }}>
                  {isLoading ? <Skeleton className="h-7 w-8" /> : kpi.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status filter */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList className="bg-card border border-border rounded-[14px] p-1 w-full grid grid-cols-3">
          <TabsTrigger value="open" className="rounded-[10px] text-sm">Open</TabsTrigger>
          <TabsTrigger value="klaar" className="rounded-[10px] text-sm">Klaar</TabsTrigger>
          <TabsTrigger value="alles" className="rounded-[10px] text-sm">Alles</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Ticket list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[20px]" />
          ))
        ) : sortedTickets.length === 0 ? (
          <div
            style={{ ...cardStyle, padding: '40px 24px' }}
            className="text-center"
          >
            <div
              className="mx-auto mb-3 flex items-center justify-center"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '20px',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
              }}
            >
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-[15px] font-medium text-foreground mb-1">Niks te melden hier</p>
            <p className="text-[13px] text-muted-foreground">
              Zie je iets dat niet in de haak is? Tik op de + knop.
            </p>
          </div>
        ) : (
          sortedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
          ))
        )}
      </div>

      {/* FAB - New ticket button */}
      <button
        onClick={onNewTicket}
        aria-label="Nieuwe melding"
        className="hover:scale-105 active:scale-95"
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          height: '60px',
          borderRadius: '20px',
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '0 24px',
          fontSize: '15px',
          fontWeight: 600,
          boxShadow: '0 8px 24px hsl(var(--primary) / 0.35)',
          transition: 'all 200ms ease',
          zIndex: 50,
        }}
      >
        <Plus className="h-6 w-6" />
        Nieuwe melding
      </button>
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: MaintenanceTicket; onClick: () => void }) {
  const prio = prioriteitConfig[ticket.prioriteit];
  const status = statusConfig[ticket.status];
  const StatusIcon = status.icon;
  const thumbUrl = useSignedPhotoUrl(ticket.foto_url);
  const melderNaam = ticket.melder_naam ?? ticket.melder?.naam ?? 'Onbekend';

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: '0',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
      }}
      className="hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
    >
      {/* Urgency strip */}
      <div style={{ width: '6px', backgroundColor: prio.color, flexShrink: 0 }} />

      <div className="flex-1 min-w-0 flex gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: status.bg,
                color: status.color,
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                gap: '4px',
              }}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            {ticket.plek && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '11px',
                  fontWeight: 600,
                  gap: '3px',
                }}
              >
                <MapPin className="h-3 w-3" />
                {ticket.plek}
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1 line-clamp-2">
            {ticket.titel}
          </h3>
          <p className="text-[12px] text-muted-foreground">
            {melderNaam} · {formatDistanceToNow(new Date(ticket.aangemaakt_op), { addSuffix: true, locale: nl })}
          </p>
        </div>

        {/* Thumbnail */}
        {ticket.foto_url && (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              backgroundColor: 'hsl(var(--muted))',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
