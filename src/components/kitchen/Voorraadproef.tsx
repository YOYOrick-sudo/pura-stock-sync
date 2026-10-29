import { useRef, useState } from 'react';
import { ChevronDown, Check, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InfoKnop } from '@/components/foh/InfoKnop';
import { amsterdamDatum, tellingTotaal, type TelPlek } from '@/lib/voorraadproef';
import { useVoorraadproef, type ProefStand, type ProefTelling, type TellingInvoer } from '@/hooks/useVoorraadproef';

const getal = (n: number | null | undefined) => n == null ? '–' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 3 }).format(n);
function plekkenVan(a: ProefStand): TelPlek[] {
  if (!Array.isArray(a.opslagplekken)) return [];
  return a.opslagplekken.flatMap((p) => p && typeof p === 'object' && !Array.isArray(p) && typeof p.naam === 'string' && typeof p.eenheid === 'string' && typeof p.factor === 'number' ? [{ naam: p.naam, eenheid: p.eenheid, factor: p.factor }] : []);
}

export function Voorraadproef({ vestiging }: { vestiging: string }) {
  const { standen, opslaan } = useVoorraadproef(vestiging);
  const [rol, setRol] = useState<'bediening' | 'keuken'>('bediening');
  const [artikel, setArtikel] = useState<ProefStand | null>(null);
  const [waarden, setWaarden] = useState<Record<string, string>>({});
  const [moment, setMoment] = useState<'voor_opening' | 'na_sluiting'>('voor_opening');
  const [resultaat, setResultaat] = useState<ProefTelling | null>(null);
  const [ouder, setOuder] = useState<ProefTelling | null>(null);
  const [fout, setFout] = useState('');
  const pending = useRef<TellingInvoer | null>(null);
  const regels = (standen.data ?? []).filter((a) => a.telrol === rol);
  const plekken = artikel ? plekkenVan(artikel) : [];
  const totaal = tellingTotaal(plekken, waarden);
  const blind = !!artikel && (!resultaat || !resultaat.betrouwbaar);

  const begin = (a: ProefStand) => {
    setArtikel(a); setWaarden({}); setResultaat(null); setOuder(null); setFout(''); pending.current = null;
    setMoment(a.telmoment === 'na_sluiting' ? 'na_sluiting' : 'voor_opening');
  };
  const bewaar = async () => {
    if (!artikel?.id || totaal == null || opslaan.isPending) return;
    if (!pending.current) {
      const id = crypto.randomUUID();
      pending.current = { id, voorraad_artikel_id: artikel.id, datum: ouder?.datum ?? amsterdamDatum(), moment,
        per_plek: Object.fromEntries(plekken.map((p) => [p.naam, Number(waarden[p.naam].replace(',', '.'))])),
        totaal, hertelling_van: ouder?.id ?? null, bron_ref: `telling:${id}` };
    }
    setFout('');
    try { setResultaat(await opslaan.mutateAsync(pending.current)); }
    catch (e) { setFout(`Niet opgeslagen. Je invoer blijft staan. ${e instanceof Error ? e.message : 'Probeer opnieuw.'}`); }
  };

  return (
    <section className="overflow-hidden rounded-polar-xl border border-border bg-card">
      <Collapsible>
        <div className="flex items-center pr-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="group min-h-12 flex-1 justify-start gap-2 rounded-none px-3">
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              <span>Even tellen (proef)</span>
              {(standen.data ?? []).some((a) => a.tellen_nodig) && <Badge variant="secondary">tellen</Badge>}
            </Button>
          </CollapsibleTrigger>
          <InfoKnop tekst="Woensdag vóór opening. Koffie: alle espresso-bonen behalve decaf, ook open zakken en hopper. Fritz: koeling én magazijn. Berekend is een indicatie; er wordt niets besteld." />
        </div>
        <CollapsibleContent className="border-t border-border">
          <div className="flex gap-2 p-3">
            {(['bediening', 'keuken'] as const).map((r) => <Button key={r} variant={rol === r ? 'default' : 'outline'} className="min-h-11" onClick={() => setRol(r)} aria-pressed={rol === r}>{r === 'bediening' ? 'Bediening' : 'Keuken'}</Button>)}
          </div>
          {standen.isLoading ? <p className="p-3 text-sm text-muted-foreground">Laden…</p> : standen.isError ? <div role="alert" className="p-3 text-sm"><p>Voorraad niet opgehaald.</p><Button variant="outline" className="mt-2 min-h-11" onClick={() => standen.refetch()}>Opnieuw proberen</Button></div> : regels.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Geen proefartikelen</p> :
            <div className="divide-y divide-border">
              {regels.map((a) => <div key={a.id} className="px-3 py-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{a.naam}</p>{a.tellen_nodig && <Badge variant="secondary" className="mt-1">tellen</Badge>}</div>
                  <Button variant="outline" className="min-h-11 shrink-0 gap-1" onClick={() => begin(a)}><ClipboardCheck className="h-4 w-4" />Tellen</Button>
                </div>
                {!blind && <div className="mt-2 text-sm text-muted-foreground">
                  {a.stand == null ? <p>Voorraad onbekend</p> : <>
                    <p className="flex flex-wrap gap-x-3 gap-y-1"><span>Geteld {getal(a.geteld)} {a.tel_eenheid}</span><span>+ ontvangen {getal(a.ontvangen)}</span><span>− kassa {getal(a.kassa)}</span><span className="font-semibold text-foreground">= {getal(a.stand)} {a.tel_eenheid}</span></p>
                    {a.laatste_telling && <p className="mt-1 text-xs">Laatste telling {new Date(a.laatste_telling + 'T12:00:00').toLocaleDateString('nl-NL')}</p>}
                    <details className="mt-1"><summary className="min-h-11 cursor-pointer content-center">Correcties en opslag</summary><p>Correcties {getal(a.correcties)} · opslag {getal(a.opslag)} ({getal(a.verbruiksopslag_pct)}%)</p></details>
                    {!a.volledig && <Badge variant="secondary">onvolledig</Badge>}
                  </>}
                </div>}
              </div>)}
            </div>}
        </CollapsibleContent>
      </Collapsible>
      <Dialog open={!!artikel} onOpenChange={(open) => { if (!open && !opslaan.isPending && !(resultaat && !resultaat.betrouwbaar)) setArtikel(null); }}>
        <DialogContent className="max-w-[650px]">
          <DialogHeader><DialogTitle>{artikel?.naam}</DialogTitle></DialogHeader>
          {resultaat && !resultaat.betrouwbaar ? <div className="space-y-3"><p className="font-medium">Tel nog één keer</p><Button className="min-h-12 w-full" onClick={() => { setOuder(resultaat); setResultaat(null); setWaarden({}); setFout(''); pending.current = null; }}>Opnieuw tellen</Button></div> : resultaat ? <div className="space-y-3"><p className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" />Opgeslagen: {getal(resultaat.totaal)} {artikel?.tel_eenheid}</p>{resultaat.berekend_op_moment != null && <p className="text-sm text-muted-foreground">Berekend vóór telling {getal(resultaat.berekend_op_moment)} · verschil {getal(resultaat.totaal - resultaat.berekend_op_moment)}</p>}<Button className="min-h-12 w-full" onClick={() => setArtikel(null)}>Klaar</Button></div> : <div className="space-y-3">
            {!ouder && <div className="flex flex-wrap gap-2">{(['voor_opening', 'na_sluiting'] as const).map((m) => <Button key={m} disabled={opslaan.isPending || !!pending.current} variant={moment === m ? 'default' : 'outline'} className="min-h-11" onClick={() => setMoment(m)}>{m === 'voor_opening' ? 'Vóór opening' : 'Na sluiting'}</Button>)}</div>}
            {plekken.map((p) => <label key={p.naam} className="block text-sm font-medium">{p.naam} <span className="font-normal text-muted-foreground">({p.eenheid})</span><Input className="mt-1 h-12 text-base" inputMode="decimal" value={waarden[p.naam] ?? ''} disabled={opslaan.isPending || !!pending.current} onChange={(e) => setWaarden((w) => ({ ...w, [p.naam]: e.target.value }))} /></label>)}
            {fout && <p role="alert" className="text-sm text-destructive">{fout}</p>}
            <Button className="min-h-12 w-full" disabled={totaal == null || opslaan.isPending} onClick={bewaar}>{opslaan.isPending ? 'Opslaan…' : fout ? 'Opnieuw opslaan' : 'Opslaan'}</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </section>
  );
}