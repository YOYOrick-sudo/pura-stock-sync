import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ApplicationStatus, STATUS_LABELS } from '@/types/hr';

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const variant: Record<ApplicationStatus, 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  received: 'info',
  screening: 'info',
  interview_scheduled: 'warning',
  trial_scheduled: 'warning',
  offer_sent: 'warning',
  hired: 'success',
  rejected: 'error',
  reserve: 'secondary',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={variant[status]} className={cn(className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
