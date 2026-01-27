import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Application, STATUS_LABELS } from '@/types/hr';
import { StatusBadge } from './StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface InboxCardProps {
  application: Application;
  onClick: () => void;
}

export function InboxCard({ application, onClick }: InboxCardProps) {
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
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-foreground truncate">{candidateName}</h3>
            <StatusBadge status={application.status} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{application.position}</span>
            {application.target_location && (
              <>
                <span>•</span>
                <span>{application.target_location}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-sm">
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
