import { Badge } from '@/components/ui/badge';
import type { BordRegelInfo } from '@/hooks/useBestelbord';

/** Klein onder het aantal: totaal, 'eenheid controleren' en eventuele afwijking. Alleen weergave. */
export function RegelInfo({ info }: { info?: BordRegelInfo | null }) {
  if (!info || (!info.totaal_tekst && !info.eenheid_controleren && !info.afwijking_tekst)) return null;
  return (
    <div className="mt-0.5 flex flex-col items-end gap-0.5 text-right">
      {info.totaal_tekst && <span className="text-xs font-normal text-muted-foreground">{info.totaal_tekst}</span>}
      {info.eenheid_controleren && <Badge variant="warning" className="px-1.5 py-0 text-[11px] font-normal">eenheid controleren</Badge>}
      {info.afwijking_tekst && <span className="text-xs font-normal text-warning">{info.afwijking_tekst}</span>}
    </div>
  );
}
