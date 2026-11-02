import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { klemAantal, stapperBevestig, stapperTekst } from '@/hooks/useInterneLevering';

/** Stepper met eenheid. Tijdens het typen blijft de invoer staan; de grens geldt bij blur en op de knoppen. */
export function AantalStapper({ waarde, min, max, eenheid, onChange, label = 'Aantal' }: {
  waarde: number;
  min: number;
  max: number | null;
  eenheid?: string;
  onChange: (n: number) => void;
  label?: string;
}) {
  const [concept, setConcept] = useState<string | null>(null);
  const getoond = concept ?? String(waarde);
  const gelezen = concept == null ? waarde : stapperBevestig(concept, min, max);
  const zet = (n: number) => {
    setConcept(null);
    onChange(klemAantal(n, min, max));
  };
  return (
    <div className="flex items-center gap-0 rounded-polar-lg border border-input bg-background">
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Minder" disabled={gelezen <= min} onClick={() => zet(gelezen - 1)}>
        <Minus className="h-4 w-4" />
      </Button>
      <label className="flex h-11 min-w-[5.5rem] cursor-text items-baseline justify-center gap-1 px-1">
        <input
          value={getoond}
          onChange={(e) => setConcept(stapperTekst(e.target.value))}
          onBlur={() => {
            onChange(stapperBevestig(concept ?? String(waarde), min, max));
            setConcept(null);
          }}
          inputMode="numeric"
          aria-label={label}
          style={{ width: `${Math.max(1, getoond.length)}ch` }}
          className="bg-transparent p-0 text-center text-lg font-semibold tabular-nums text-foreground outline-none"
        />
        {eenheid && <span className="text-sm text-muted-foreground">{eenheid}</span>}
      </label>
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Meer" disabled={max != null && gelezen >= max} onClick={() => zet(gelezen + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
