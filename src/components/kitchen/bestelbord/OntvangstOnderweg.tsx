import { eenheidVorm } from '@/lib/hoeveelheid';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, Hourglass, Minus, PackageCheck, Plus, Truck } from 'lucide-react';
import { DetailLade, GroepRij, KaartKop, LaadRijen, LijstKaart } from '@/components/pura/patronen';
import { RijMenu, RijMeta } from '@/components/pura/lijst';
import { AnnuleerLade } from './MandjeVragen';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CompacteTabel } from './CompacteTabel';
import { zoekBordSuggesties, type BordSuggestie } from '@/hooks/useBestelbord';
import { useOntvangstMutaties, type NaleveringKandidaat, type OntvangstRestant, type OntvangstVandaag } from '@/hooks/useOntvangstV2';
import { vandaagZonderOpenRest, afrondWaarschuwingen, onderwegBlokken, isAutomatisch, bouwRegel, eindcheckFout, kortDatum, restantVan, type EindcheckInvoer, type OntvangstModus, type RestBron } from '@/lib/ontvangstV2';

const BRONNEN: { id: RestBron; naam: string }[] = [{ id: 'pakbon', naam: 'Pakbon' }, { id: 'mail', naam: 'Mail' }, { id: 'orderbevestiging', naam: 'Bevestiging' }];
const sleutelVan = (r: OntvangstVandaag) => r.open_regel_id ?? r.signaal_id ?? r.pakbon_regel_id ?? r.naam;
const fout = (e: unknown) => toast.error((e as Error)?.message || 'Niet opgeslagen');

function Aantal({ waarde, onChange, min = 0 }: { waarde: number; onChange: (n: number) => void; min?: number }) {
  return <div className="flex items-center rounded-polar-lg border border-input bg-background">
    <Button type="button" variant="ghost" size="touch-icon" aria-label="Minder" onClick={() => onChange(Math.max(min, waarde - 1))}><Minus className="h-4 w-4" /></Button>
    <Input value={String(waarde)} inputMode="numeric" aria-label="Aantal" onChange={(e) => onChange(Math.max(min, Number(e.target.value.replace(/[^0-9]/g, '')) || 0))} className="h-11 w-14 border-0 text-center text-base font-semibold shadow-none focus-visible:ring-0" />
    <Button type="button" variant="ghost" size="touch-icon" aria-label="Meer" onClick={() => onChange(waarde + 1)}><Plus className="h-4 w-4" /></Button>
  </div>;
}

function startInvoer(r: OntvangstVandaag, restanten: OntvangstRestant[]): EindcheckInvoer {
  const besteld = Number(r.besteld_aantal ?? r.pakbon_aantal ?? 0);
  return {
    soort: r.soort, signaal_id: r.signaal_id, open_regel_id: r.open_regel_id, pakbon_regel_id: r.pakbon_regel_id, geleverd_vorm_id: r.geleverd_vorm_id,
    besteld, binnen: Number(r.voorstel_aantal ?? r.pakbon_aantal ?? besteld), kapot: 0, ander_product: false, ander_product_tekst: '',
    nageleverd: false, rest_bron: null, rest_notitie: '', verwacht_op: '', opmerking: '', automatisch: isAutomatisch(r, restanten),
  };
}

/** Bovenaan Onderweg: 'Wordt nageleverd' en 'Nog niet binnen'. Elk blok alleen als het iets bevat. */
export function NageleverdKaart({ modus, regels }: { modus: OntvangstModus; regels: OntvangstRestant[] }) {
  const [annuleer, setAnnuleer] = useState<OntvangstRestant | null>(null);
  const b = onderwegBlokken(regels);
  const blok = (titel: string, icoon: typeof Hourglass, warn: boolean, d: { actief: OntvangstRestant[]; opnieuw: OntvangstRestant[] }) => {
    if (!d.actief.length && !d.opnieuw.length) return null;
    const Icoon = icoon;
    const rij = (r: OntvangstRestant, licht: boolean) => <TableRow key={r.regel_id ?? r.api_backorder_id ?? r.naam} className={cn(licht && 'text-muted-foreground')}>
      <TableCell className="!px-0"><div className="mx-auto flex h-11 w-8 items-center justify-center"><Icoon className={cn('size-4', warn && !licht ? 'text-warning' : 'text-muted-foreground')} aria-hidden /></div></TableCell>
      <TableCell><div className="flex min-h-11 min-w-0 flex-col justify-center">
        <span className="min-w-0 break-words font-medium">{r.naam}</span>
        <RijMeta altijd>{licht ? <Badge variant="secondary">mogelijke nalevering</Badge> : warn && <Badge variant="warning">Mist</Badge>}<span className="min-w-0 break-words">{[r.leverancier_naam, kortDatum(r.verwacht_op ?? r.controle_op)].filter(Boolean).join(' · ')}</span></RijMeta>
      </div></TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="inline-flex items-center gap-1.5"><span className="rounded-full bg-muted px-2 text-sm font-semibold">{Number(r.aantal)}</span>{r.eenheid && <span className="text-xs text-muted-foreground">{eenheidVorm(Number(r.aantal), r.eenheid)}</span>}</span></TableCell>
      <TableCell className="!px-0" />
      <TableCell className="!px-0">{licht && modus.magBeslissen && r.regel_id && <RijMenu naam={r.naam} acties={[{ label: 'Geannuleerd door leverancier', gevaar: true, onClick: () => setAnnuleer(r) }]} />}</TableCell>
    </TableRow>;
    return <LijstKaart kop={<KaartKop icoon={Icoon} titel={titel} teller={d.actief.length} />}>
      <CompacteTabel zonderKop onderweg smal kinderen={<TableBody>{d.actief.map((r) => rij(r, false))}{d.opnieuw.map((r) => rij(r, true))}</TableBody>} />
    </LijstKaart>;
  };
  return <>
    {blok('Wordt nageleverd', Hourglass, false, b.nageleverd)}
    {blok('Nog niet binnen', AlertCircle, true, b.mist)}
    <AnnuleerLade modus={modus} regel={annuleer?.regel_id ? { regel_id: annuleer.regel_id, naam: annuleer.naam } : null} onSluit={() => setAnnuleer(null)} />
  </>;
}

/** Waarschuwingen na afronden als toast. */
export function toonWaarschuwingen(res: unknown) {
  afrondWaarschuwingen(res).forEach((w) => toast.warning(w));
}

/** 5.3 Eindcheck: wat is er vandaag binnen; restant standaard 'Mist'. */
export function EindcheckKaart({ modus, regels: alleRegels, restanten, laden, leveranciers }: { modus: OntvangstModus; regels: OntvangstVandaag[]; restanten: OntvangstRestant[]; laden: boolean; leveranciers?: Map<string, string> }) {
  const regels = useMemo(() => vandaagZonderOpenRest(alleRegels), [alleRegels]);
  const { afronden } = useOntvangstMutaties(modus);
  const [invoer, setInvoer] = useState<Record<string, EindcheckInvoer>>({});
  const [gekozen, setGekozen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [zonderOrder, setZonderOrder] = useState(false);

  useEffect(() => {
    setInvoer((oud) => Object.fromEntries(regels.map((r) => [sleutelVan(r), { ...(oud[sleutelVan(r)] ?? startInvoer(r, restanten)), automatisch: isAutomatisch(r, restanten) }])));
    setGekozen((oud) => new Set([...oud].filter((k) => regels.some((r) => sleutelVan(r) === k))));
  }, [regels, restanten]);

  const groepen = useMemo(() => {
    const m = new Map<string, OntvangstVandaag[]>();
    for (const r of regels) m.set(r.leverancier_naam ?? 'Leverancier onbekend', [...(m.get(r.leverancier_naam ?? 'Leverancier onbekend') ?? []), r]);
    return [...m.entries()];
  }, [regels]);

  const zet = (k: string, d: Partial<EindcheckInvoer>) => setInvoer((o) => ({ ...o, [k]: { ...o[k], ...d } }));
  const kies = (k: string, aan: boolean) => setGekozen((o) => { const n = new Set(o); if (aan) n.add(k); else n.delete(k); return n; });
  const n = gekozen.size;

  const rondAf = () => {
    const lijst = [...gekozen].map((k) => invoer[k]).filter(Boolean);
    const f = lijst.map(eindcheckFout).find(Boolean);
    if (f) { toast.error(f); return; }
    afronden.mutate(lijst.map(bouwRegel), {
      onSuccess: (res) => { toonWaarschuwingen(res); toast.success(`${lijst.length} ${lijst.length === 1 ? 'regel' : 'regels'} afgerond`); setGekozen(new Set()); },
      onError: fout,
    });
  };

  const huidig = open ? invoer[open] : null;
  const huidigeRegel = open ? regels.find((r) => sleutelVan(r) === open) : null;

  return <>
    <LijstKaart kop={<KaartKop icoon={PackageCheck} titel="Vandaag binnen" teller={regels.length} rechts={<Button variant="ghost" size="touch" className="-my-1 gap-1 px-2" onClick={() => setZonderOrder(true)}><Plus className="h-4 w-4" />Zonder order</Button>} />}>
      {laden ? <LaadRijen /> : regels.length === 0 ? <p className="px-4 py-6 text-center text-sm text-muted-foreground">Niets te checken</p> : <>
        <CompacteTabel zonderKop onderweg vinkKop="Binnen" kinderen={<TableBody>{groepen.map(([lev, rs]) => <Fragment key={lev}>
          <GroepRij kolommen={5} naam={lev} aantal={rs.length} />
          {rs.map((r) => {
            const k = sleutelVan(r); const v = invoer[k]; if (!v) return null;
            const rest = restantVan(v);
            return <TableRow key={k} className="cursor-pointer" onClick={() => { kies(k, true); setOpen(k); }}>
              <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}><label className="mx-auto flex h-11 w-11 cursor-pointer items-center justify-center"><Checkbox aria-label={`${r.naam} meenemen`} checked={gekozen.has(k)} onCheckedChange={(b) => kies(k, b === true)} /></label></TableCell>
              <TableCell><div className="flex min-h-11 min-w-0 flex-col justify-center">
                <span className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 line-clamp-2 break-words font-medium">{r.naam}</span>{r.soort !== 'onderweg' && r.soort !== 'alleen_pakbon' && <Hourglass className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Wordt nageleverd" />}</span>
                {(rest > 0 || r.te_laat) && <RijMeta altijd>{rest > 0 && <Badge variant={v.nageleverd || v.automatisch ? 'info' : 'warning'}>{rest} {v.nageleverd || v.automatisch ? 'wordt nageleverd' : 'mist'}</Badge>}</RijMeta>}
              </div></TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="inline-flex items-center gap-1.5"><span className="rounded-full bg-muted px-2 text-sm font-semibold">{v.binnen}</span><span className="text-xs text-muted-foreground">/ {v.besteld} {eenheidVorm(Number(v.besteld), r.eenheid)}</span></span></TableCell>
              <TableCell className="!px-0" /><TableCell className="!px-0" />
            </TableRow>;
          })}
        </Fragment>)}</TableBody>} />
        <div className="border-t border-border p-3"><Button className="h-12 w-full" disabled={!n || afronden.isPending} onClick={rondAf}>Levering afronden ({n})</Button></div>
      </>}
    </LijstKaart>

    <DetailLade open={!!huidig} onOpenChange={(o) => !o && setOpen(null)} titel={huidigeRegel?.naam}>
      {huidig && open && <div className="space-y-4">
        <Veld label={`Binnen (besteld ${huidig.besteld})`}><Aantal waarde={huidig.binnen} onChange={(x) => zet(open, { binnen: x })} /></Veld>
        <Veld label="Kapot"><Aantal waarde={huidig.kapot} onChange={(x) => zet(open, { kapot: x })} /></Veld>
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium">Ander product<Switch checked={huidig.ander_product} onCheckedChange={(b) => zet(open, { ander_product: b })} /></label>
        {huidig.ander_product && <Input className="h-11 text-base" placeholder="Wat is er geleverd?" value={huidig.ander_product_tekst} onChange={(e) => zet(open, { ander_product_tekst: e.target.value })} />}
        {restantVan(huidig) > 0 && (huidig.automatisch
          ? <Badge variant="info" className="gap-1"><Hourglass className="h-3 w-3" />Leverancier meldt nalevering zelf</Badge>
          : <div className="space-y-3 rounded-polar-md border border-border p-3">
            <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium"><span className="flex items-center gap-2"><Hourglass className="h-4 w-4 text-muted-foreground" />Wordt nageleverd ({restantVan(huidig)})</span><Switch checked={huidig.nageleverd} onCheckedChange={(b) => zet(open, { nageleverd: b })} /></label>
            {huidig.nageleverd && <>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Bron">{BRONNEN.map((b) => <Button key={b.id} type="button" role="radio" aria-checked={huidig.rest_bron === b.id} variant={huidig.rest_bron === b.id ? 'default' : 'outline'} className="h-11 px-2" onClick={() => zet(open, { rest_bron: b.id })}>{b.naam}</Button>)}</div>
              <Textarea className="text-base" placeholder="Notitie (verplicht)" value={huidig.rest_notitie} onChange={(e) => zet(open, { rest_notitie: e.target.value })} />
              <Veld label="Verwacht op"><Input type="date" className="h-11 text-base" value={huidig.verwacht_op} onChange={(e) => zet(open, { verwacht_op: e.target.value })} /></Veld>
            </>}
          </div>)}
        <Textarea className="text-base" placeholder="Opmerking" value={huidig.opmerking} onChange={(e) => zet(open, { opmerking: e.target.value })} />
        <Button className="h-12 w-full" onClick={() => { const f = eindcheckFout(huidig); if (f) toast.error(f); else setOpen(null); }}>Klaar</Button>
      </div>}
    </DetailLade>

    <ZonderOrderLade open={zonderOrder} onOpenChange={setZonderOrder} modus={modus} leveranciers={leveranciers} />
  </>;
}

function Veld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex min-h-11 items-center justify-between gap-3"><span className="text-sm font-medium">{label}</span>{children}</div>;
}

function ZonderOrderLade({ open, onOpenChange, modus, leveranciers }: { open: boolean; onOpenChange: (o: boolean) => void; modus: OntvangstModus; leveranciers?: Map<string, string> }) {
  const { afronden, zonderOrder, kandidaten } = useOntvangstMutaties(modus);
  const [levId, setLevId] = useState('');
  const [zoek, setZoek] = useState('');
  const [opties, setOpties] = useState<BordSuggestie[]>([]);
  const [artikel, setArtikel] = useState<BordSuggestie | null>(null);
  const [vrij, setVrij] = useState(false);
  const [aantal, setAantal] = useState(1);
  const [lijst, setLijst] = useState<NaleveringKandidaat[] | null>(null);
  const [bezig, setBezig] = useState(false);
  const zoekVestiging = modus.pBron ?? modus.pVestiging;

  useEffect(() => { if (!open) { setLevId(''); setZoek(''); setArtikel(null); setVrij(false); setAantal(1); setLijst(null); } }, [open]);
  useEffect(() => {
    const q = zoek.trim();
    if (!q || artikel || vrij) { setOpties([]); return; }
    const t = setTimeout(() => zoekBordSuggesties(zoekVestiging, q).then(setOpties).catch(() => setOpties([])), 150);
    return () => clearTimeout(t);
  }, [zoek, artikel, vrij, zoekVestiging]);

  const klaar = (res?: unknown) => { toonWaarschuwingen(res); toast.success('Ontvangst vastgelegd'); onOpenChange(false); };
  const naam = artikel?.naam ?? (vrij ? zoek.trim() : '');
  const vorm = artikel?.vormen.find((v) => v.leverancier_id === levId) ?? (artikel?.vormen.length === 1 ? artikel.vormen[0] : undefined);
  const naarZonderOrder = () => zonderOrder.mutate({ leverancierId: levId, regels: [{ omschrijving: naam, aantal, eenheid: vorm?.eenheid ?? artikel?.standaard_eenheid ?? 'stuks', ...(artikel ? { artikel_id: artikel.artikel_id } : {}), ...(vorm ? { artikel_vorm_id: vorm.id } : {}) }] }, { onSuccess: klaar, onError: fout });

  const controleer = async () => {
    setBezig(true);
    try {
      const k = await kandidaten({ leverancierId: levId, artikelId: artikel?.artikel_id ?? null, naam: naam || null });
      if (k?.length) setLijst(k); else naarZonderOrder();
    } catch (e) { fout(e); } finally { setBezig(false); }
  };
  const klaarVoor = !!levId && (!!artikel || (vrij && zoek.trim().length >= 3));

  return <DetailLade open={open} onOpenChange={onOpenChange} titel="Ontvangen zonder order">
    {lijst ? <div className="space-y-3">
      <p className="text-base">Is dit een nalevering?</p>
      <div className="divide-y divide-border rounded-polar-md border border-border">{lijst.map((k) => <Button key={k.regel_id} variant="ghost" className="flex min-h-12 w-full items-center justify-between gap-2 rounded-none px-3 text-left" disabled={afronden.isPending} onClick={() => afronden.mutate([{ open_regel_id: k.regel_id, binnen: aantal }], { onSuccess: klaar, onError: fout })}>
        <span className="min-w-0 line-clamp-2 break-words font-medium">{k.naam}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{[`${Number(k.aantal)} ${k.eenheid ?? ''}`.trim(), k.sinds ? kortDatum(k.sinds) : ''].filter(Boolean).join(' · ')}</span>
      </Button>)}</div>
      <Button variant="outline" className="h-12 w-full" disabled={zonderOrder.isPending} onClick={naarZonderOrder}>Nee, los ontvangen</Button>
    </div> : <div className="space-y-4">
      <Select value={levId} onValueChange={setLevId}>
        <SelectTrigger className="h-11 text-base" aria-label="Leverancier"><SelectValue placeholder="Leverancier" /></SelectTrigger>
        <SelectContent>{[...(leveranciers ?? new Map()).entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([id, naam]) => <SelectItem key={id} value={id}>{naam}</SelectItem>)}</SelectContent>
      </Select>
      <div className="relative">
        <Input className="h-11 text-base" placeholder={vrij ? 'Omschrijving' : 'Zoek artikel'} value={artikel?.naam ?? zoek} onChange={(e) => { setArtikel(null); setZoek(e.target.value); }} />
        {opties.length > 0 && <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-polar-md border border-border bg-popover shadow-md">
          {opties.map((o) => <Button key={o.artikel_id} variant="ghost" className="block min-h-12 w-full px-3 text-left" onClick={() => { setArtikel(o); setOpties([]); }}>{o.naam}</Button>)}
        </div>}
      </div>
      {!artikel && <Button type="button" variant={vrij ? 'default' : 'outline'} size="touch" className="w-full" aria-pressed={vrij} onClick={() => setVrij((x) => !x)}>Niet in de lijst</Button>}
      <Veld label="Aantal"><Aantal waarde={aantal} onChange={setAantal} min={1} /></Veld>
      <Button className="h-12 w-full gap-1" disabled={!klaarVoor || bezig || zonderOrder.isPending} onClick={controleer}><Truck className="h-4 w-4" />Vastleggen</Button>
    </div>}
  </DetailLade>;
}
