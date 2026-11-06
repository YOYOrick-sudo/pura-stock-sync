import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { LegeStaatBlok } from '@/components/pura/canoniek';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Zelfde teksten als voorheen, nu het compacte lege blok. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  const tekst = description ? `${title} ${description}` : title;
  return <LegeStaatBlok tekst={tekst} actie={action} />;
}
