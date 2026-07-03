import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — één gedeelde lege-staat.
 * Icoon-tegel 56×56 in bg-primary/10 text-primary, gecentreerd.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-polar-xl shadow-card',
        'flex flex-col items-center justify-center text-center px-6 py-10',
        className,
      )}
    >
      {Icon && (
        <div className="mb-3 flex items-center justify-center w-14 h-14 rounded-polar-xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <p className="text-[15px] font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
