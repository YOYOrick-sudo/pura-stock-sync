import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InfoKnop } from '@/components/foh/InfoKnop';
import { cn } from '@/lib/utils';
import { amsterdamDatum, laatstGeteldTekst, tellingTotaal, type TelPlek } from '@/lib/voorraadproef';
import { useVoorraadproef, type ProefStand, type ProefTelling, type TellingInvoer } from '@/hooks/useVoorraadproef';
import { deelTellenIn, telStatus } from '@/components/kitchen/tellenOrde';

type Moment = 'voor_opening' | 'na_sluiting';
type Opslaan = ReturnType<typeof useVoorraadproef>['opslaan'];

const getal = (n: number | null | undefined) => n == null ? '–' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 3 }).format(n);
function plekkenVan(a: ProefStand): TelPlek[] {
  if (!Array.isArray(a.opslagplekken)) return [];
  return a.opslagplekken.flatMap((p) => p && typeof p === 'object' && !Array.isArray(p) && typeof p.naam === 'string' && typeof p.eenheid === 'string' && typeof p.factor === 'number' ? [{ naam: p.naam, eenheid: p.eenheid, factor: p.factor }] : []);
}

function StatusBadge({ a, geteldNu }: { a: ProefStand; geteldNu: boolean }) {
  const s = geteldNu ? { soort: 'geteld' as const } : telStatus(a);
  if (s.soort === 'tellen') return <Badge variant="default" className="shrink-0 font-normal">tellen</Badge>;
  if (s.soort === 'geteld') return <Badge variant="secondary" className="shrink-0 gap-1 font-normal"><Check className="h-3 w-3" />geteld</Badge>;
  if (s.soort === 'onbekend') return <Badge variant="outline" className="shrink-0 font-normal text-muted-foreground">onbekend</Badge>;
  return <Badge variant="outline" className="shrink-0 font-normal tabular-nums">{getal(s.stand)} {a.tel_eenheid}</Badge>;
}

function TelRij({ a, momentKeuze, opslaan }: { a: ProefStand; momentKeuze: Moment | null; opslaan: Opslaan }) {
  const plekken = plekkenVan(a);
  const enkel = plekken.length === 1;
  const [open, setOpen] = useState(false);
  const [waarden, setWaarden] = useState<Record<string, string>>({});
  const [resultaat, setResultaat] = useState<ProefTelling | null>(null);
  const [ouder, setOuder] = useState<ProefTelling | null>(null);
  const [fout, setFout] = useState('');
  const pending = useRef<TellingInvoer | null>(null);
  const totaal = tellingTotaal(plekken, waarden);
  const moment: Moment = (ouder?.moment as Moment | undefined) ?? momentKeuze ?? (a.telmoment === 'na_sluiting' ? 'na_sluiting' : 'voor_opening');
  const herteller = !!resultaat && !resultaat.betrouwbaar;
  const bezig = Object.values(waarden).some((v) => v.trim() !== '') || !!pending.current;
  // Blind tellen: geen berekende stand zolang er geteld wordt of de telling niet betrouwbaar is.
  const blind = !!a.tellen_nodig || herteller || (bezig && !resultaat);

  const bewaar = async () => {
    if (!a.id || totaal == null || opslaan.isPending) return;
    if (!pending.current) {
      const id = crypto.randomUUID();
      pending.current = { id, voorraad_artikel_id: a.id, datum: ouder?.datum ?? amsterdamDatum(), moment,
        per_plek: Object.fromEntries(plekken.map((p) => [p.naam, Number(waarden[p.naam].replace(',', '.'))])),
        totaal, hertelling_van: ouder?.id ?? null, bron_ref: `telling:${id}` };
    }
    setFout('');
    try {
      const r = await opslaan.mutateAsync(pending.current);
      setResultaat(r);
      if (!r.betrouwbaar) { setOpen(true); return; }
      setWaarden({});
      pending.current = null;
      setOuder(null);
    } catch (e) { setFout(`Niet opgeslagen. Je invoer blijft staan. ${e instanceof Error ? e.message : 'Probeer opnieuw.'}`); }
  };
  const opnieuw = () => { if (!resultaat) return; setOuder(resultaat); setResultaat(null); setWaarden({}); setFout(''); pending.current = null; };

  const veld = (p: TelPlek, klein: boolean) => (
    <Input
      key={p.naam}
      aria-label={`${a.naam} ${p.naam} (${p.eenheid})`}
      className={cn('h-11 text-center text-base tabular-nums', klein ? 'w-20' : 'w-24')}
      inputMode="decimal"
      placeholder={p.eenheid}
      value={waarden[p.naam] ?? ''}
      disabled={opslaan.isPending || !!pending.current || herteller}
      onChange={(e) => { setResultaat(null); setWaarden((w) => ({ ...w, [p.naam]: e.target.value })); }}
      onKeyDown={(e) => e.key === 'Enter' && bewaar()}
    />
  );
  const opslaanKnop = (
    <Button size="sm" className="h-11 w-11 shrink-0 p-0" aria-label={fout ? 'Opnieuw opslaan' : 'Opslaan'} disabled={totaal == null || opslaan.isPending || herteller} onClick={bewaar}>
      <Check className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn(open && 'bg-muted/30')}>
      <div className="flex min-h-12 items-center gap-2 px-3 py-1">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{a.naam}</span>
          <StatusBadge a={a} geteldNu={!!resultaat?.betrouwbaar} />
        </button>
        {enkel && <>{veld(plekken[0], true)}{opslaanKnop}</>}
      </div>
      {(resultaat || fout) && (
        <div className="px-3 pb-2 text-[13px]">
          {fout && <p role="alert" className="text-destructive">{fout}</p>}
          {resultaat?.betrouwbaar && <p className="flex items-center gap-1 text-primary"><Check className="h-3.5 w-3.5" />Opgeslagen: {getal(resultaat.totaal)} {a.tel_eenheid}</p>}
          {herteller && (
            <div className="flex items-center gap-2">
              <span className="flex-1 font-medium text-foreground">Tel nog één keer</span>
              <Button size="sm" variant="outline" className="h-9" onClick={opnieuw}>Opnieuw tellen</Button>
            </div>
          )}
        </div>
      )}
      {open && (
        <div className="space-y-2 px-3 pb-3 pl-9 text-[13px] text-muted-foreground">
          {!enkel && plekken.length > 0 && (
            <div className="space-y-1.5">
              {plekken.map((p) => (
                <label key={p.naam} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-[14px] text-foreground">{p.naam} <span className="text-muted-foreground">({p.eenheid})</span></span>
                  {veld(p, false)}
                </label>
              ))}
              <div className="flex justify-end">
                <Button size="sm" className="h-11" disabled={totaal == null || opslaan.isPending || herteller} onClick={bewaar}>
                  {opslaan.isPending ? 'Opslaan…' : fout ? 'Opnieuw opslaan' : 'Opslaan'}
                </Button>
              </div>
            </div>
          )}
          <p>{laatstGeteldTekst(a.dagen_sinds_telling)}</p>
          {!blind && (a.stand == null ? <p>Voorraad onbekend</p> : (
            <>
              <p className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                <span>Geteld {getal(a.geteld)} {a.tel_eenheid}</span><span>+ ontvangen {getal(a.ontvangen)}</span><span>− kassa {getal(a.kassa)}</span>
                <span className="font-semibold text-foreground">= {getal(a.stand)} {a.tel_eenheid}</span>
              </p>
              <p>Correcties {getal(a.correcties)} · opslag {getal(a.opslag)} ({getal(a.verbruiksopslag_pct)}%){!a.volledig && ' · onvolledig'}</p>
            </>
          ))}
        </div>
      )}
    </div>
  );
}

export function Voorraadproef({ vestiging }: { vestiging: string }) {
  const { standen, opslaan } = useVoorraadproef(vestiging);
  const alle = standen.data ?? [];
  const rollen = (['bediening', 'keuken'] as const).filter((r) => alle.some((a) => a.telrol === r));
  const [rolKeuze, setRolKeuze] = useState<'bediening' | 'keuken' | null>(null);
  const rol = rolKeuze && rollen.includes(rolKeuze) ? rolKeuze : rollen[0] ?? 'bediening';
  const [momentKeuze, setMomentKeuze] = useState<Moment | null>(null);
  const { vandaag, overige } = deelTellenIn(alle, rol);

  const sectie = (titel: string, lijst: ProefStand[]) => lijst.length > 0 && (
    <div>
      <p className="bg-muted/40 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{titel}</p>
      <div className="divide-y divide-border/60">
        {lijst.map((a) => <TelRij key={a.id} a={a} momentKeuze={momentKeuze} opslaan={opslaan} />)}
      </div>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-polar-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
        <span className="text-[15px] font-semibold">Tellen</span>
        <InfoKnop tekst="Elke dag max 3 artikelen, roulerend. Tel alle plekken (ook open zakken/hopper bij koffie, koeling én magazijn bij drank). Berekend = laatste telling + ontvangen − kassaverbruik; er wordt niets besteld." />
        <div className="ml-auto flex gap-1" role="group" aria-label="Moment">
          {(['voor_opening', 'na_sluiting'] as const).map((m) => (
            <Button key={m} size="sm" variant={momentKeuze === m ? 'default' : 'ghost'} className="h-9 px-2.5 text-[13px]" aria-pressed={momentKeuze === m}
              onClick={() => setMomentKeuze((k) => (k === m ? null : m))}>
              {m === 'voor_opening' ? 'Vóór opening' : 'Na sluiting'}
            </Button>
          ))}
        </div>
      </div>
      {standen.isLoading ? <p className="p-3 text-sm text-muted-foreground">Laden…</p> : standen.isError ? (
        <div role="alert" className="flex items-center gap-2 p-3 text-sm">
          <span className="flex-1">Voorraad niet opgehaald.</span>
          <Button size="sm" variant="outline" className="h-11" onClick={() => standen.refetch()}>Opnieuw proberen</Button>
        </div>
      ) : rollen.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Geen artikelen om te tellen</p> : (
        <>
          {rollen.length > 1 && (
            <div className="flex gap-1 border-b border-border/60 px-3 py-1.5" role="tablist">
              {rollen.map((r) => (
                <Button key={r} role="tab" aria-selected={rol === r} size="sm" variant={rol === r ? 'default' : 'ghost'} className="h-9" onClick={() => setRolKeuze(r)}>
                  {r === 'bediening' ? 'Bediening' : 'Keuken'}
                </Button>
              ))}
            </div>
          )}
          {sectie('Vandaag', vandaag)}
          {sectie('Overige', overige)}
        </>
      )}
    </section>
  );
}
