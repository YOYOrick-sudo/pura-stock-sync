import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

/** De bestaande leverancierskop behoudt zijn indeling en krijgt alleen een hint of één waarschuwing. */
export function DeadlineNaam({ naam, hint, letOp = false }: { naam: string; hint: string | null; letOp?: boolean }) {
  // Telefoon: naam en badge op één regel, naam met ellipsis; vanaf 744px ongewijzigd.
  // Een waarschuwing mag wel afbreken, anders verdwijnt de leveranciersnaam.
  const isMobile = useIsMobile();
  return <span className={isMobile && !letOp ? 'flex min-w-0 max-w-full flex-nowrap items-center gap-2' : 'inline-flex max-w-full flex-wrap items-center gap-2'}><span className="min-w-0 truncate">{naam}</span>{letOp ? <Badge variant="warning" className="shrink-0 gap-1 whitespace-nowrap font-medium"><AlertTriangle className="h-3 w-3" aria-hidden="true" />deadline voorbij</Badge> : hint && <Badge variant="secondary" className="shrink-0 gap-1 whitespace-nowrap font-medium text-muted-foreground"><Clock className="h-4 w-4" aria-hidden="true" />{hint}</Badge>}</span>;
}