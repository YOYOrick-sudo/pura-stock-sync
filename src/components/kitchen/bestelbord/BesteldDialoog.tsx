import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BestelSignaal } from '@/hooks/useBestelbord';

/** Bevestiging per leveranciersgroep: leverdag, optioneel ordernummer, regels aan of uit. */
export function BesteldDialoog({ groep, leverdatum, minDatum, maxDatum, bezig, onSluiten, onBevestig }: {
  groep: { naam: string; regels: BestelSignaal[] } | null;
  leverdatum: string;
  minDatum: string;
  maxDatum: string;
  bezig: boolean;
  onSluiten: () => void;
  onBevestig: (regels: BestelSignaal[], leverdatum: string, referentie: string) => void;
}) {
  const [datum, setDatum] = useState(leverdatum);
  const [referentie, setReferentie] = useState('');
  const [aan, setAan] = useState<string[]>([]);
  const sleutel = groep ? `${groep.naam}|${groep.regels.map((r) => r.id).join(',')}|${leverdatum}` : '';

  useEffect(() => {
    if (!groep) return;
    setDatum(leverdatum);
    setReferentie('');
    setAan(groep.regels.map((r) => r.id));
  }, [sleutel, groep, leverdatum]);

  const gekozen = groep?.regels.filter((r) => aan.includes(r.id)) ?? [];
  const datumOk = !!datum && datum >= minDatum && datum <= maxDatum;

  return (
    <Dialog open={!!groep} onOpenChange={(open) => { if (!open && !bezig) onSluiten(); }}>
      <DialogContent className="gap-4">
        <DialogHeader>
          <DialogTitle>Besteld — {groep?.naam}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="besteld-leverdag">Leverdag</Label>
            <Input
              id="besteld-leverdag"
              type="date"
              value={datum}
              min={minDatum}
              max={maxDatum}
              onChange={(e) => setDatum(e.target.value)}
              className="h-11 text-base"
            />
            <p className="text-xs text-muted-foreground">Voorstel uit het leverschema. Pas de dag aan als de levering anders is.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="besteld-ordernummer">Ordernummer</Label>
            <Input
              id="besteld-ordernummer"
              value={referentie}
              maxLength={200}
              onChange={(e) => setReferentie(e.target.value)}
              placeholder="optioneel"
              className="h-11 text-base"
              autoComplete="off"
            />
          </div>
          <ul className="space-y-2">
            {groep?.regels.map((s) => {
              const mee = aan.includes(s.id);
              return (
                <li key={s.id}>
                  <label className="flex min-h-11 items-center gap-2">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                      <Checkbox checked={mee} onCheckedChange={(b) => setAan((vorige) => b === true ? (vorige.includes(s.id) ? vorige : [...vorige, s.id]) : vorige.filter((id) => id !== s.id))} aria-label={`${s.naam} meenemen`} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.naam}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{Number(s.aantal)} {s.eenheid}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" size="touch" disabled={bezig} onClick={onSluiten}>Annuleren</Button>
          <Button type="button" size="touch" disabled={bezig || !gekozen.length || !datumOk} onClick={() => onBevestig(gekozen, datum, referentie.trim())}>
            {bezig ? 'Bezig…' : 'Besteld'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
