import type { ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { LegeStaatBlok } from '@/components/pura/canoniek';

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/** Zelfde titel, uitleg en knoptekst, nu het compacte lege blok. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  const tekst = description ? `${title} ${description}` : title;
  return (
    <LegeStaatBlok
      tekst={tekst}
      actie={action ? (
        <Button type="button" variant="ghost" size="touch" onClick={action.onClick}>{action.label}</Button>
      ) : undefined}
    />
  );
}
