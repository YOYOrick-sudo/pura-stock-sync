import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { klemAantal } from '@/hooks/useInterneLevering';

/** Stepper met eenheid, begrensd op min en (als die er is) max. */
export function AantalStapper({ waarde, min, max, eenheid, onChange, label = 'Aantal' }: {
  waarde: number;
  min: number;
  max: number | null;
  eenheid?: string;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-0 rounded-polar-lg border border-input bg-background">
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Minder" disabled={waarde <= min} onClick={() => onChange(klemAantal(waarde - 1, min, max))}>
        <Minus className="h-4 w-4" />
      </Button>
      <label className="flex h-11 min-w-[5.5rem] cursor-text items-baseline justify-center gap-1 px-1">
        <input
          value={String(waarde)}
          onChange={(e) => {
            const d = e.target.value.replace(/[^0-9]/g, '');
            if (!d) return;
            onChange(klemAantal(Number(d), min, max));
          }}
          inputMode="numeric"
          aria-label={label}
          style={{ width: `${Math.max(1, String(waarde).length)}ch` }}
          className="bg-transparent p-0 text-center text-lg font-semibold tabular-nums text-foreground outline-none"
        />
        {eenheid && <span className="text-sm text-muted-foreground">{eenheid}</span>}
      </label>
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Meer" disabled={max != null && waarde >= max} onClick={() => onChange(klemAantal(waarde + 1, min, max))}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
