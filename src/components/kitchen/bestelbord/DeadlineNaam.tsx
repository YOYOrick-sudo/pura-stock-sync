import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

/** De bestaande leverancierskop behoudt zijn indeling en krijgt alleen een hint. */
export function DeadlineNaam({ naam, hint }: { naam: string; hint: string | null }) {
  // Telefoon: naam en badge op één regel, naam met ellipsis; vanaf 744px ongewijzigd.
  const isMobile = useIsMobile();
  return <span className={isMobile ? 'flex min-w-0 max-w-full flex-nowrap items-center gap-2' : 'inline-flex max-w-full flex-wrap items-center gap-2'}><span className="min-w-0 truncate">{naam}</span>{hint && <Badge variant="secondary" className="shrink-0 gap-1 whitespace-nowrap font-medium text-muted-foreground"><Clock className="h-4 w-4" aria-hidden="true" />{hint}</Badge>}</span>;
}