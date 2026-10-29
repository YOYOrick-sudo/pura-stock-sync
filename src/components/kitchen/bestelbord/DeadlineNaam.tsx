import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** De bestaande leverancierskop behoudt zijn indeling en krijgt alleen een hint. */
export function DeadlineNaam({ naam, hint }: { naam: string; hint: string | null }) {
  return <span className="inline-flex max-w-full flex-wrap items-center gap-2"><span className="min-w-0 truncate">{naam}</span>{hint && <Badge variant="secondary" className="shrink-0 gap-1 whitespace-nowrap font-medium text-muted-foreground"><Clock className="h-4 w-4" aria-hidden="true" />{hint}</Badge>}</span>;
}