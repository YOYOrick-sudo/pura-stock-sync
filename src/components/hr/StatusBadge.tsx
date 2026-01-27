import { cn } from '@/lib/utils';
import { ApplicationStatus, STATUS_LABELS } from '@/types/hr';

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

const statusStyles: Record<ApplicationStatus, string> = {
  received: 'bg-amber-100 text-amber-800 border-amber-200',
  screening: 'bg-blue-100 text-blue-800 border-blue-200',
  interview_scheduled: 'bg-violet-100 text-violet-800 border-violet-200',
  trial_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
  offer_sent: 'bg-orange-100 text-orange-800 border-orange-200',
  hired: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  reserve: 'bg-slate-100 text-slate-800 border-slate-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
