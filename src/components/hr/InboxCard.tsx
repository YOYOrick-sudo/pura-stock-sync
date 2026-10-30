import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Application, STATUS_LABELS } from '@/types/hr';
import { StatusBadge } from './StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface InboxCardProps {
  application: Application;
  onClick: () => void;
}

export function InboxCard({ application, onClick }: InboxCardProps) {
  const isMobile = useIsMobile();
  const candidate = application.candidate;
  const candidateName = candidate 
    ? `${candidate.first_name} ${candidate.last_name}` 
    : 'Onbekend';

  const nextActionLabel = application.next_action_type || 'Actie nodig';
  const nextActionDate = application.next_action_at 
    ? format(new Date(application.next_action_at), 'd MMM, HH:mm', { locale: nl })
    : null;

  const createdAgo = formatDistanceToNow(new Date(application.created_at), { 
    addSuffix: true, 
    locale: nl 
  });

  return (
    <Card 
      className={isMobile ? 'p-3 min-h-12 min-w-0 cursor-pointer hover:bg-muted/50 transition-colors group' : 'p-4 cursor-pointer hover:bg-muted/50 transition-colors group'}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className={isMobile ? 'flex items-center gap-2 mb-1 min-w-0 [&>div]:shrink-0' : 'flex items-center gap-3 mb-1'}>
            <h3 className={isMobile ? 'font-semibold text-foreground truncate min-w-0 flex-1' : 'font-semibold text-foreground truncate'}>{candidateName}</h3>
            <StatusBadge status={application.status} />
          </div>
          
          <div className={isMobile ? 'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground break-words [overflow-wrap:anywhere]' : 'flex items-center gap-4 text-sm text-muted-foreground'}>
            <span>{application.position}</span>
            {application.target_location && (
              <>
                <span>•</span>
                <span>{application.target_location}</span>
              </>
            )}
          </div>
          
          <div className={isMobile ? 'flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm break-words [overflow-wrap:anywhere]' : 'flex items-center gap-4 mt-2 text-sm'}>
            {nextActionDate ? (
              <span className="text-primary font-medium">
                {nextActionLabel} - {nextActionDate}
              </span>
            ) : (
              <span className="text-destructive font-medium">
                Geen volgende actie gepland
              </span>
            )}
            <span className="text-muted-foreground">
              Ontvangen {createdAgo}
            </span>
          </div>
        </div>
        
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </div>
    </Card>
  );
}
