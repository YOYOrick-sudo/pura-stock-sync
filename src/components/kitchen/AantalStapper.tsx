import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { klemAantal, stapperBevestig, stapperTekst } from '@/hooks/useInterneLevering';

/**
 * Stepper met eenheid. Een gevulde invoer gaat meteen naar de ouder; blur vult alleen een leeg veld aan tot het minimum.
 * Vorm gelijk aan TelStapper (pura/canoniek): 44px, cijfer text-sm, eenheid text-xs op dezelfde lijn.
 */
export function AantalStapper({ waarde, min, max, eenheid, onChange, label = 'Aantal' }: {
  waarde: number;
  min: number;
  max: number | null;
  eenheid?: string;
  onChange: (n: number) => void;
  label?: string;
}) {
  const conceptRef = useRef<string | null>(null);
  const [concept, setConcept] = useState<string | null>(null);
  const toon = (tekst: string | null) => {
    conceptRef.current = tekst;
    setConcept(tekst);
  };
  const lees = () => conceptRef.current == null ? waarde : stapperBevestig(conceptRef.current, min, max);
  const getoond = concept ?? String(waarde);
  const zet = (n: number) => {
    toon(null);
    onChange(klemAantal(n, min, max));
  };
  return (
    <div className="flex h-11 shrink-0 items-center rounded-polar-lg border border-input bg-background">
      <Button type="button" variant="ghost" size="touch-icon" aria-label="Minder" disabled={lees() <= min} onClick={() => zet(lees() - 1)}>
        <Minus className="h-4 w-4" />
      </Button>
      <label className="flex h-11 min-w-[5.5rem] cursor-text items-center justify-center gap-2 px-1 leading-none">
        <input
          value={getoond}
          onChange={(e) => {
            const tekst = stapperTekst(e.target.value);
            toon(tekst);
            if (tekst) onChange(klemAantal(Number(tekst), min, max));
          }}
          onBlur={() => {
            if (conceptRef.current === '') onChange(min);
            toon(null);
          }}
          inputMode="numeric"
          aria-label={label}
          style={{ width: `${Math.max(1, getoond.length)}ch` }}
          className="bg-transparent p-0 text-center text-sm font-semibold tabular-nums leading-none text-foreground outline-none"
        />
        {eenheid && <span className="text-xs leading-none text-muted-foreground">{eenheid}</span>}
      </label>
      <Button type="button" variant="ghost" size="touch-icon" aria-label="Meer" disabled={max != null && lees() >= max} onClick={() => zet(lees() + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
