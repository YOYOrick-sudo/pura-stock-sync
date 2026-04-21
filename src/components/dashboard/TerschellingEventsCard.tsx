import { Calendar, ExternalLink } from 'lucide-react';
import { PolarKPICard } from '@/components/polar';
import {
  getNextEvent,
  getUpcomingEvents,
  getDaysUntil,
  formatEventDate,
} from '@/lib/terschelling-events';

const VVV_URL = 'https://www.vvvterschelling.nl/evenementen/';

export function TerschellingEventsCard() {
  const next = getNextEvent();
  const upcomingCount = getUpcomingEvents(999).length;

  if (!next) {
    return (
      <div
        onClick={() => window.open(VVV_URL, '_blank', 'noopener,noreferrer')}
        className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{ borderRadius: '20px' }}
      >
        <PolarKPICard
          compact
          title="Terschelling Evenementen"
          value="—"
          contentText={{
            primary: 'Geen aankomende events',
            secondary: 'Bekijk vvvterschelling.nl',
          }}
          statusColor={{
            bg: 'transparent',
            text: 'hsl(var(--muted-foreground))',
            icon: <Calendar size={16} className="text-primary" />,
          }}
        />
      </div>
    );
  }

  const days = getDaysUntil(next.startDate);
  const dateLabel = formatEventDate(next.startDate);

  let dayBadge: string;
  if (days === 0) dayBadge = 'Vandaag';
  else if (days === 1) dayBadge = 'Morgen';
  else if (days < 0) dayBadge = 'Loopt nu';
  else dayBadge = `Nog ${days} dagen`;

  return (
    <div
      onClick={() => window.open(VVV_URL, '_blank', 'noopener,noreferrer')}
      className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group relative h-full"
      style={{ borderRadius: '20px' }}
      title={`Bekijk alle ${upcomingCount} aankomende evenementen`}
    >
      <div className="bg-card border border-border rounded-[20px] p-5 flex flex-col gap-2 h-full min-h-[140px] shadow-soft transition-all duration-200">
        <div className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Calendar size={16} className="text-primary" />
          Volgend event op Terschelling
        </div>
        <div className="text-[18px] font-semibold text-foreground tracking-tight leading-tight mt-1">
          {next.name}
        </div>
        <div className="text-[13px] font-medium text-foreground mt-auto">
          {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
        </div>
        <div className="text-xs text-muted-foreground">
          {dayBadge} · +{upcomingCount - 1} meer
        </div>
      </div>
      <ExternalLink
        size={14}
        className="absolute top-4 right-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
