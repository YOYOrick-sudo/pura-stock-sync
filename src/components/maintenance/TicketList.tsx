import { useState } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle2, MapPin, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMaintenanceTickets, useTicketCounts } from '@/hooks/maintenance/useMaintenanceTickets';
import { useSignedPhotoUrl } from '@/hooks/maintenance/useMaintenancePhoto';
import type { MaintenanceActor, MaintenanceTicket, TicketStatus } from '@/types/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  PageSubheader,
  StatusBadge,
  SegmentedTabs,
  StatCard,
  EmptyState,
  toneColor,
  type StatusTone,
} from '@/components/pura';

interface TicketListProps {
  actor: MaintenanceActor;
  onNewTicket: () => void;
  onTicketClick: (ticketId: string) => void;
}

const prioriteitConfig: Record<
  'hoog' | 'midden' | 'laag',
  { tone: StatusTone; label: string }
> = {
  hoog: { tone: 'danger', label: 'Hoog' },
  midden: { tone: 'warning', label: 'Normaal' },
  laag: { tone: 'success', label: 'Laag' },
};

const statusConfig: Record<
  TicketStatus,
  { tone: StatusTone; label: string; icon: typeof AlertTriangle }
> = {
  nieuw: { tone: 'danger', label: 'Open', icon: AlertTriangle },
  in_behandeling: { tone: 'warning', label: 'Bezig', icon: Clock },
  afgehandeld: { tone: 'success', label: 'Klaar', icon: CheckCircle2 },
};

type StatusFilter = 'open' | 'klaar' | 'alles';

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

  return (
    <div className="space-y-6">
      <PageSubheader
        description="Meld iets dat niet in de haak is."
        action={
          <Button
            onClick={onNewTicket}
            size="lg"
            className="h-11 px-5 text-[15px] gap-2 rounded-polar-xl"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
            Nieuwe melding
          </Button>
        }
      />

      {/* KPI Tellers */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Hoog"
          value={isLoading ? <Skeleton className="h-7 w-8" /> : counts.hoog}
          icon={<AlertTriangle />}
          tone="danger"
        />
        <StatCard
          label="Openstaand"
          value={isLoading ? <Skeleton className="h-7 w-8" /> : counts.openstaand}
          icon={<Clock />}
          tone="warning"
        />
        <StatCard
          label="Klaar"
          value={isLoading ? <Skeleton className="h-7 w-8" /> : counts.afgehandeld}
          icon={<CheckCircle2 />}
          tone="success"
        />
      </div>

      <SegmentedTabs<StatusFilter>
        value={statusFilter}
        onValueChange={setStatusFilter}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'klaar', label: 'Klaar' },
          { value: 'alles', label: 'Alles' },
        ]}
      />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-polar-xl" />
          ))
        ) : sortedTickets.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Niks te melden hier"
            description="Zie je iets dat niet in de haak is? Tik op 'Nieuwe melding' rechtsboven."
          />
        ) : (
          sortedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
          ))
        )}
      </div>
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
    <button
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-polar-xl shadow-card overflow-hidden flex transition-all duration-200 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Urgency strip */}
      <div
        className="w-1 flex-shrink-0"
        style={{ backgroundColor: toneColor(prio.tone) }}
        aria-hidden
      />

      <div className="flex-1 min-w-0 flex gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge tone={status.tone} shape="label" icon={<StatusIcon />}>
              {status.label}
            </StatusBadge>
            {ticket.plek && (
              <StatusBadge tone="neutral" shape="label" icon={<MapPin />}>
                {ticket.plek}
              </StatusBadge>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1 line-clamp-2">
            {ticket.titel}
          </h3>
          <p className="text-xs text-muted-foreground">
            {melderNaam} · {formatDistanceToNow(new Date(ticket.aangemaakt_op), { addSuffix: true, locale: nl })}
          </p>
        </div>

        {ticket.foto_url && (
          <div className="w-16 h-16 flex-shrink-0 rounded-polar-md bg-muted overflow-hidden flex items-center justify-center">
            {thumbUrl ? (
              <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </button>
  );
}
