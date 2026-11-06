import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DRUK, STAP_MOTION } from './aanvulMotion';

type Props = {
  titel: string;
  aantalTekst: string;
  afgevinkt: boolean;
  laden: boolean;
  fout: boolean;
  onVink: () => void;
  /** Tweede vervolg als de stap niet bij te vullen is. Ontbreekt hij, dan blijft de regel een vinkje. */
  onNietBijTeVullen?: () => void;
  nietBijTeVullenUitleg?: string | null;
};

/**
 * Vaste vervolgstap na pakken uit de koelcel. Geen vraag: dezelfde
 * afvinkregel als de rest van de sluitlijst, met het aantal eronder.
 */
export function VriezerNaarKoelcelRij({
  titel,
  aantalTekst,
  afgevinkt,
  laden,
  fout,
  onVink,
  onNietBijTeVullen,
  nietBijTeVullenUitleg,
}: Props) {
  return (
    <li
      data-aanvulketen="vriezer-koelcel"
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-polar border px-2 py-1 sm:gap-3',
        STAP_MOTION,
        afgevinkt ? 'border-transparent bg-muted/40' : 'border-border bg-card',
      )}
    >
      <button
        type="button"
        aria-label={`${titel} afvinken`}
        aria-pressed={afgevinkt}
        disabled={laden}
        onClick={onVink}
        className={cn('flex h-11 w-11 shrink-0 items-center justify-center', DRUK)}
      >
        <span
          className={cn(
            'flex h-[26px] w-[26px] items-center justify-center rounded-polar-sm border-2 bg-background sm:h-6 sm:w-6',
            afgevinkt
              ? 'border-muted-foreground/30 bg-muted-foreground/15 text-muted-foreground'
              : fout
                ? 'border-destructive'
                : 'border-border',
          )}
        >
          {laden ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : afgevinkt ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : null}
        </span>
      </button>
      <div className="min-w-0 flex-1 py-1.5">
        <p
          className={cn(
            'text-[16px] font-medium leading-snug text-foreground',
            afgevinkt && 'text-muted-foreground line-through opacity-55',
          )}
        >
          {titel}
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{aantalTekst}</p>
      </div>
      {onNietBijTeVullen && !afgevinkt && (
        <Button
          type="button"
          variant="ghost"
          className={cn('h-11 shrink-0 px-3 text-[13px] font-medium text-foreground', DRUK)}
          disabled={laden}
          title={nietBijTeVullenUitleg ?? undefined}
          onClick={onNietBijTeVullen}
        >
          Niet bij te vullen
        </Button>
      )}
      {nietBijTeVullenUitleg && !afgevinkt && (
        <p className="w-full text-[13px] text-muted-foreground">{nietBijTeVullenUitleg}</p>
      )}
      {fout && !afgevinkt && <p className="w-full text-[13px] text-destructive">Niet opgeslagen. Tik opnieuw.</p>}
    </li>
  );
}
