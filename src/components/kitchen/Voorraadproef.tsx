import { useEffect, useRef, useState } from 'react';
import { Calculator, Check, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FoutRegel, InklapGroep, KaartKop, LaadRijen, LegeStaat, LijstKaart, segmentTabsKlasse } from '@/components/pura/patronen';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusLabel } from '@/components/pura/lijst';
import { amsterdamDatum, tellingTotaal, type TelPlek } from '@/lib/voorraadproef';
import { useVoorraadproef, type ProefStand, type ProefTelling, type TellingInvoer } from '@/hooks/useVoorraadproef';
import { telMoment } from './bestelbord/presentatie';

const getal = (n: number | null | undefined) => n == null ? '—' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 3 }).format(n);
function plekkenVan(a: ProefStand): TelPlek[] {
  if (!Array.isArray(a.opslagplekken)) return [];
  return a.opslagplekken.flatMap((p) => p && typeof p === 'object' && !Array.isArray(p) && typeof p.naam === 'string' && typeof p.eenheid === 'string' && typeof p.factor === 'number' ? [{ naam: p.naam, eenheid: p.eenheid, factor: p.factor }] : []);
}

export function Voorraadproef({ vestiging, onOverzicht }: { vestiging: string; onOverzicht?: (a: { open: number; geladen: boolean }) => void }) {
  const { standen, opslaan } = useVoorraadproef(vestiging);
  const artikelen = standen.data ?? [];
  const openVragen = artikelen.filter((a) => a.tellen_nodig).length;
  useEffect(() => { onOverzicht?.({ open: openVragen, geladen: standen.isSuccess }); }, [openVragen, standen.isSuccess, onOverzicht]);
  const [rolKeuze, setRol] = useState<string | null>(null);
  const rollen = ['bediening', 'keuken'].filter((r) => artikelen.some((a) => a.telrol === r));
  const rol = rolKeuze && rollen.includes(rolKeuze) ? rolKeuze : rollen[0];
  const regels = artikelen.filter((a) => !rol || a.telrol === rol);
  const vandaag = regels.filter((a) => a.telvraag_vandaag);
  const overige = regels.filter((a) => !a.telvraag_vandaag);
  const geteld = vandaag.filter((a) => !a.tellen_nodig).length;
  const [artikel, setArtikel] = useState<ProefStand | null>(null);
  const [waarden, setWaarden] = useState<Record<string, string>>({});
  const [moment, setMoment] = useState<'voor_opening' | 'na_sluiting'>('voor_opening');
  const [resultaat, setResultaat] = useState<ProefTelling | null>(null);
  const [ouder, setOuder] = useState<ProefTelling | null>(null);
  const [fout, setFout] = useState('');
  const pending = useRef<TellingInvoer | null>(null);
  const plekken = artikel ? plekkenVan(artikel) : [];
  const totaal = tellingTotaal(plekken, waarden);
  const vergrendeld = opslaan.isPending || !!fout || !!(resultaat && !resultaat.betrouwbaar);

  const begin = (a: ProefStand) => {
    if (vergrendeld) return;
    if (artikel?.id === a.id) { setArtikel(null); return; }
    setArtikel(a); setWaarden({}); setResultaat(null); setOuder(null); setFout(''); pending.current = null;
    setMoment(telMoment(a.telmoment));
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

  const rij = (a: ProefStand) => {
    const actief = !!artikel && artikel.id === a.id;
    const blind = actief && (!resultaat || !resultaat.betrouwbaar);
    const gereed = actief && resultaat?.betrouwbaar;
    const status = gereed || (a.telvraag_vandaag && !a.tellen_nodig) ? 'geteld' : a.tellen_nodig ? 'tellen' : 'onbekend';
    return <div key={a.id} className="border-b border-border last:border-0">
      <Button variant="ghost" className="min-h-12 h-auto w-full justify-between gap-3 rounded-none px-3 py-2 text-left" onClick={() => begin(a)} disabled={vergrendeld} aria-expanded={actief}>
        <span className="min-w-0 break-words font-medium">{a.naam}</span>
        <span className="flex shrink-0 items-center gap-2 text-sm">
          {!blind && !a.tellen_nodig && (gereed || a.stand != null) ? <span className="font-semibold tabular-nums">{getal(gereed ? resultaat?.totaal : a.stand)} <span className="font-normal text-muted-foreground">{a.tel_eenheid}</span></span> : <StatusLabel toon={status === 'geteld' ? 'goed' : status === 'tellen' ? 'let-op' : 'neutraal'}>{status === 'geteld' ? 'Geteld' : status === 'tellen' ? 'Tellen' : 'Onbekend'}</StatusLabel>}
          <ChevronDown className={actief ? 'h-4 w-4 rotate-180 text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
        </span>
      </Button>
      {actief && <div className="space-y-3 bg-muted/30 px-3 pb-3 pt-2">
        {resultaat && !resultaat.betrouwbaar ? <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">Tel nog één keer</p><Button className="min-h-11" onClick={() => { setOuder(resultaat); setResultaat(null); setWaarden({}); setFout(''); pending.current = null; }}>Opnieuw tellen</Button></div> : resultaat ? <p className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" />Opgeslagen: {getal(resultaat.totaal)} {a.tel_eenheid}</p> : <>
          <div className="grid gap-3 sm:grid-cols-3">{plekken.map((p) => <label key={p.naam} className="min-w-0 text-sm font-medium">{p.naam}<div className="relative mt-1"><Input aria-label={`${a.naam} ${p.naam}`} className="h-11 pr-16 text-base" inputMode="decimal" value={waarden[p.naam] ?? ''} disabled={opslaan.isPending || !!pending.current} onChange={(e) => setWaarden((w) => ({ ...w, [p.naam]: e.target.value }))} /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-normal text-muted-foreground">{p.eenheid}</span></div></label>)}</div>
          {fout && <p role="alert" className="text-sm text-destructive">{fout}</p>}
          <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Totaal <span className="text-lg font-semibold tabular-nums text-foreground">{getal(totaal)}</span> {a.tel_eenheid}</span><Button className="min-h-11" disabled={totaal == null || opslaan.isPending} onClick={bewaar}>{opslaan.isPending ? 'Opslaan…' : fout ? 'Opnieuw opslaan' : 'Opslaan'}</Button></div>
        </>}
      </div>}
    </div>;
  };

  return <div className="space-y-3">
    {rollen.length > 1 && <Tabs value={rol} onValueChange={setRol}><TabsList className={segmentTabsKlasse}><TabsTrigger value="bediening" disabled={vergrendeld}>Bediening</TabsTrigger><TabsTrigger value="keuken" disabled={vergrendeld}>Keuken</TabsTrigger></TabsList></Tabs>}
    {standen.isLoading ? <LijstKaart><LaadRijen /></LijstKaart> : standen.isError ? <LijstKaart><div role="alert"><FoutRegel tekst="Voorraad niet opgehaald." onOpnieuw={() => standen.refetch()} /></div></LijstKaart> : <>
      <Card className="overflow-hidden">
        <KaartKop icoon={Calculator} titel={<span className="flex items-center gap-1">Vandaag<Popover><PopoverTrigger asChild><Button variant="ghost" size="touch-icon" aria-label="Informatie over tellen"><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="max-w-xs text-sm">Tel wat er nu staat, per plek. Je ziet de verwachte stand pas na opslaan.</PopoverContent></Popover></span>} rechts={<span className="text-sm tabular-nums text-muted-foreground">{geteld}/{vandaag.length}</span>} />
        <div className="flex h-1 bg-muted" aria-label="Voortgang telling" role="progressbar" aria-valuemin={0} aria-valuemax={vandaag.length || 1} aria-valuenow={geteld}>{vandaag.map((a, i) => <span key={a.id} className={i < geteld ? 'flex-1 bg-primary' : 'flex-1'} />)}</div>
        {vandaag.length ? vandaag.map(rij) : <LegeStaat tekst="Vandaag niets te tellen." />}
      </Card>
      {!!overige.length && <InklapGroep titel="Overige" aantal={overige.length}><Card className="overflow-hidden">{overige.map(rij)}</Card></InklapGroep>}
    </>}
  </div>;
}
