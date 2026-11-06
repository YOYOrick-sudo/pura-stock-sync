import { useState } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaintenanceTickets, useTicketCounts } from '@/hooks/maintenance/useMaintenanceTickets';
import { useSignedPhotoUrl } from '@/hooks/maintenance/useMaintenancePhoto';
import type { MaintenanceActor, MaintenanceTicket, TicketStatus } from '@/types/maintenance';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  StatusBadge,
  Kengetal,
  LegeStaatBlok,
  toneColor,
  type StatusTone,
  LijstKaart,
  StatusLabel,
  segmentTabsKlasse,
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
  { tone: StatusTone; label: string }
> = {
  nieuw: { tone: 'danger', label: 'Open' },
  in_behandeling: { tone: 'warning', label: 'Bezig' },
  afgehandeld: { tone: 'success', label: 'Klaar' },
};

type StatusFilter = 'open' | 'klaar' | 'alles';

export function TicketList({ actor, onNewTicket, onTicketClick }: TicketListProps) {
  const isMobile = useIsMobile();
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
    <div className={isMobile ? 'min-w-0 space-y-4' : 'space-y-4'}>
      {/* KPI Tellers */}
      <div className={isMobile ? 'grid min-w-0 grid-cols-3 gap-2 [&>div]:min-w-0 [&>div]:flex-col [&>div]:items-start [&>div]:!gap-2 [&>div]:!p-3 [&>div>div]:max-w-full [&_svg]:shrink-0 [&_p]:break-words' : 'grid grid-cols-3 gap-3 sm:gap-4'}>
        <Kengetal
          label="Hoog"
          waarde={isLoading ? <Skeleton className="h-7 w-8" /> : counts.hoog}
          icoon={AlertTriangle}
          toon="fout"
        />
        <Kengetal
          label="Openstaand"
          waarde={isLoading ? <Skeleton className="h-7 w-8" /> : counts.openstaand}
          icoon={Clock}
          toon="let-op"
        />
        <Kengetal
          label="Klaar"
          waarde={isLoading ? <Skeleton className="h-7 w-8" /> : counts.afgehandeld}
          icoon={CheckCircle2}
          toon="goed"
        />
      </div>

      <div className={isMobile ? 'flex min-w-0 flex-col gap-2 [&>div]:max-w-full [&>div]:overflow-x-auto [&>div]:flex-nowrap [&_button]:min-h-11 [&_button]:shrink-0 [&_button]:whitespace-nowrap' : 'flex flex-wrap items-center justify-between gap-3'}>
        <Tabs value={statusFilter} onValueChange={(waarde) => setStatusFilter(waarde as StatusFilter)}>
          <TabsList className={segmentTabsKlasse}>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="klaar">Klaar</TabsTrigger>
            <TabsTrigger value="alles">Alles</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          onClick={onNewTicket}
          size="touch"
          className={isMobile ? 'w-full gap-2' : 'gap-2'}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nieuwe melding
        </Button>
      </div>


      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-polar-lg" />
          ))
        ) : sortedTickets.length === 0 ? (
          <LegeStaatBlok tekst="Niks te melden hier Zie je iets dat niet in de haak is? Tik op 'Nieuwe melding' rechtsboven." />
        ) : (
          isMobile ? (
            <LijstKaart>
              <div className="divide-y divide-border">
                {sortedTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
                ))}
              </div>
            </LijstKaart>
          ) : sortedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, onClick }: { ticket: MaintenanceTicket; onClick: () => void }) {
  const isMobile = useIsMobile();
  const prio = prioriteitConfig[ticket.prioriteit];
  const status = statusConfig[ticket.status];
  const thumbUrl = useSignedPhotoUrl(ticket.foto_url);
  const melderNaam = ticket.melder_naam ?? ticket.melder?.naam ?? 'Onbekend';

  if (isMobile) {
    return (
      <Button variant="ghost" onClick={onClick} className="h-auto min-h-12 w-full justify-start gap-2 whitespace-normal rounded-none px-3 py-2 text-left">
        {ticket.foto_url && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-polar-md bg-muted">
            {thumbUrl ? <img src={thumbUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{ticket.titel}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {ticket.plek && `${ticket.plek} · `}{melderNaam} · {formatDistanceToNow(new Date(ticket.aangemaakt_op), { addSuffix: true, locale: nl })}
          </span>
        </span>
        <StatusLabel toon={status.tone === 'danger' ? 'fout' : status.tone === 'warning' ? 'let-op' : 'goed'}>{status.label}</StatusLabel>
      </Button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full overflow-hidden rounded-polar-lg border border-border bg-card text-left shadow-sm hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <StatusBadge tone={status.tone}>
              {status.label}
            </StatusBadge>
            {ticket.plek && (
              <StatusBadge tone="neutral">
                {ticket.plek}
              </StatusBadge>
            )}
          </div>
          <h3 className="mb-1 line-clamp-2 text-base font-semibold leading-snug text-foreground">
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
