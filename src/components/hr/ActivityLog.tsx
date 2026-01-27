import { Card } from '@/components/ui/card';
import { useActivityLog } from '@/hooks/hr/useActivityLog';
import { ACTION_LABELS, ActionType } from '@/types/hr';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityLogProps {
  applicationId: string;
}

export function ActivityLog({ applicationId }: ActivityLogProps) {
  const { data: logs, isLoading } = useActivityLog(applicationId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Activiteiten</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground mb-3">Activiteiten</h3>
      
      {logs && logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log) => {
            const actionLabel = ACTION_LABELS[log.action_type as ActionType] || log.action_type;
            const date = format(new Date(log.created_at), "d MMM yyyy 'om' HH:mm", { locale: nl });

            return (
              <div 
                key={log.id} 
                className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{actionLabel}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{date}</span>
                  </div>
                  {log.previous_status && log.new_status && log.previous_status !== log.new_status && (
                    <p className="text-xs text-muted-foreground">
                      Status: {log.previous_status} → {log.new_status}
                    </p>
                  )}
                  {log.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nog geen activiteiten gelogd</p>
      )}
    </Card>
  );
}
