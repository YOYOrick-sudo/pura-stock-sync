import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { BordRegelInfo } from '@/hooks/useBestelbord';

/** Beknopte rijstatus; volledige verpakkingsinformatie alleen in de detailweergave. */
export function RegelInfo({ info, detail = false }: { info?: BordRegelInfo | null; detail?: boolean }) {
  if (!info || (!info.totaal_tekst && !info.eenheid_controleren && !info.afwijking_tekst)) return null;
  if (!detail) return info.eenheid_controleren ? <Tooltip><TooltipTrigger asChild><span className="inline-flex shrink-0 text-warning" tabIndex={0} aria-label="Controleer verpakking"><AlertCircle className="h-4 w-4" /></span></TooltipTrigger><TooltipContent>Controleer verpakking</TooltipContent></Tooltip> : null;
  return (
    <div className="mt-0.5 flex flex-col items-end gap-0.5 text-right">
      {info.totaal_tekst && <span className="text-xs font-normal text-muted-foreground">{info.totaal_tekst}</span>}
      {info.eenheid_controleren && <Badge variant="warning" className="px-1.5 py-0 text-[11px] font-normal">eenheid controleren</Badge>}
      {info.afwijking_tekst && <span className="text-xs font-normal text-warning">{info.afwijking_tekst}</span>}
    </div>
  );
}
