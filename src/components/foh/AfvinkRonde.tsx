import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, ChefHat, Loader2, PackageX, RotateCcw, WifiOff } from 'lucide-react';
import { SectieBalk } from './SectieBalk';
import { KetenLijstRij } from './KetenLijstRij';
import { TaakBewerkKnop } from './TaakBewerkKnop';
import { TaakVervolgPaneel } from './TaakVervolgPaneel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';
import { useFase2VlagAan } from '@/hooks/useOntvangstV2';
import { useInterneV2Producten } from '@/hooks/useInterneLeveringV2';
import {
  aanvulketenAan,
  hoeveelheidTekst,
  koelcelRegelVoor,
  ontdooiStickerOpdracht,
  vriezerNaarKoelcelAantal,
  vriezerNaarKoelcelEenheid,
} from '@/lib/aanvulketen';
import {
  ketenSessieSleutel,
  ketenUitleg,
  ketenVoor,
  leesKetenSessie,
  lijstKnop,
  planKeten,
  stapTitel,
  type Eindactie,
  type KetenSessie,
} from '@/lib/keten';
import { INTERNE_LEVERING_V2 } from '@/lib/interneLeveringV2';
import { vraagtKoelcelBevestiging } from '@/lib/koelcelBevestiging';
import { isPreviewHost } from '@/lib/pwa';
import { cn } from '@/lib/utils';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  ketenKortLabel,
  diepsteBron,
  type KoelcelCheck,
  type KoelcelCheckItem,
} from '@/hooks/useKoelcelCheck';
import { useVoorraadLades, positieLabel } from '@/hooks/useVoorraadLades';
import { useMepKalender } from '@/hooks/useMepPlanning';
import { soortVanBron, volgendeOpenDag, aanvulTekst, herkomstLabel, peilBlokjes, peilKort } from '@/lib/sluitronde';
import { useIsEigenaar } from '@/hooks/useIsEigenaar';
import { useInterneProducten } from '@/hooks/useInterneLevering';
import { useTaakVervolg } from '@/hooks/useTaakVervolg';
import {
  interneProductVoor,
  taakSleutelVan,
  VervolgFout,
  type KetenInvoer,
} from '@/lib/taakVervolg';
import { VulPeil } from './VulPeil';

interface Groep {
  id: string;
  titel: string;
  items: KoelcelCheckItem[];
}

/** Wat er onder de regel staat nadat je hebt doorgezet. */
const UITKOMST: Record<string, string> = {
  mep: 'Op de MEP voor morgen',
  bestelbord: 'Bijbesteld · op het bestelbord',
  midsland: 'Bijbesteld · op de bestellijst Midsland',
};

/** Wat de groene melding zegt na je tik. */
const BEVESTIG: Record<string, string> = {
  mep: 'staat op de MEP',
  bestelbord: 'is bijbesteld · op het bestelbord',
  midsland: 'is bijbesteld · op de bestellijst Midsland',
};

function isVrijdag(datum: string) {
  return new Date(`${datum}T12:00:00`).getDay() === 5;
}

/**
 * Sluitronde West: per product één vinkje. Pak je iets uit de keten, dan vink
 * je af. Moet het gesneden of gemaakt worden, dan één tik naar de MEP. Alleen
 * als de hele keten leeg is gaat het naar het bestelbord of Midsland.
 */
export function AfvinkRonde({ vestiging, datum }: { vestiging: string; datum: string }) {
  const { data: items = [], isLoading } = useKoelcelCheckItems(vestiging);
  const { data: lades = [] } = useVoorraadLades(vestiging);
  const { data: checksLijst = [] } = useKoelcelChecks(vestiging, datum);
  const kalender = useMepKalender(vestiging);
  const { zetStatus, naarMepDirect, bronOp } = useKoelcelCheckMutaties(vestiging, datum, items);
  const [zoekparams] = useSearchParams();
  const previewHost = typeof window !== 'undefined' && isPreviewHost(window.location.hostname);
  const schrijfKeten = aanvulketenAan({
    vestiging,
    env: (import.meta.env as { VITE_SLUIT_AANVULKETEN?: string }).VITE_SLUIT_AANVULKETEN,
    search: zoekparams.toString(),
    previewHost,
  });
  // Op een preview-host zijn de stappen zichtbaar zonder de schakelaar.
  // Aanmaken (MEP, bestelbord, intern, sticker) blijft achter schrijfKeten.
  const toonKeten = schrijfKeten || previewHost;
  const eigenaar = useIsEigenaar();
  // Potlood en paneel voor de eigenaar, ook zonder ?aanvulketen=1.
  const toonInstellen = eigenaar;
  const leesKeten = schrijfKeten || toonInstellen || toonKeten;
  // Lezen voor het paneel. De vlag zet alleen de query aan; opslaan niet.
  const vervolg = useTaakVervolg(vestiging, datum, leesKeten);
  const internProducten = useInterneProducten(leesKeten ? vestiging : null);
  const internV2 = useInterneV2Producten(leesKeten ? vestiging : null);
  const v2Aan = useFase2VlagAan(vestiging, INTERNE_LEVERING_V2);
  const internLijst = useMemo(() => {
    const map = new Map<string, { product_id: string; naam: string }>();
    for (const product of [...(internProducten.data ?? []), ...(internV2.data ?? [])]) {
      if (product?.product_id && product.naam) map.set(product.product_id, { product_id: product.product_id, naam: product.naam });
    }
    return [...map.values()];
  }, [internProducten.data, internV2.data]);
  const [paneelItem, setPaneelItem] = useState<KoelcelCheckItem | null>(null);
  const printSticker = useCreateStickerPrintJob();
  const [sessie, setSessie] = useState<Record<string, KetenSessie>>(() => {
    if (typeof sessionStorage === 'undefined') return {};
    try {
      return leesKetenSessie(sessionStorage.getItem(ketenSessieSleutel(vestiging, datum)));
    } catch {
      return {};
    }
  });
  const stappenRef = useRef(sessie);
  stappenRef.current = sessie;

  useEffect(() => {
    try {
      const gelezen = leesKetenSessie(sessionStorage.getItem(ketenSessieSleutel(vestiging, datum)));
      stappenRef.current = gelezen;
      setSessie(gelezen);
    } catch {
      /* stil */
    }
  }, [vestiging, datum]);

  const bewaarSessie = (id: string, stand: KetenSessie | null) => {
    const next = { ...stappenRef.current };
    if (stand) next[id] = stand;
    else delete next[id];
    stappenRef.current = next;
    setSessie(next);
    try {
      sessionStorage.setItem(ketenSessieSleutel(vestiging, datum), JSON.stringify(next));
    } catch {
      /* stil */
    }
  };
  const [bezig, setBezig] = useState<Set<string>>(new Set());
  const [mislukt, setMislukt] = useState<Record<string, () => void>>({});
  const [koelcelKeuze, setKoelcelKeuze] = useState<KoelcelCheckItem | null>(null);

  // Snelknop "Bijvullen" op het dashboard: ernaartoe scrollen.
  useEffect(() => {
    const ga = () => {
      window.setTimeout(
        () => document.getElementById('afvinkronde-blok')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        150,
      );
    };
    try {
      const k = `voorraadronde-start-open-${vestiging}`;
      if (localStorage.getItem(k) === '1') ga();
    } catch {
      /* stil */
    }
    window.addEventListener('voorraadronde-open', ga);
    return () => window.removeEventListener('voorraadronde-open', ga);
  }, [vestiging]);

  const checks = useMemo(() => {
    const m = new Map<string, KoelcelCheck>();
    for (const c of checksLijst) m.set(c.item_id, c);
    return m;
  }, [checksLijst]);

  const groepen = useMemo<Groep[]>(() => {
    const vrijdag = isVrijdag(datum);
    const out: Groep[] = [];
    const actief = [...lades.filter((l) => l.actief)].sort((a, b) => a.volgorde - b.volgorde);
    for (const l of actief) {
      if (l.rol === 'niet_tellen') continue;
      if (l.rol === 'reserve' && !vrijdag) continue;
      const g = items.filter((i) => i.plek === 'werkbank' && i.lade_id === l.id);
      if (g.length) out.push({ id: l.id, titel: l.naam && l.naam !== positieLabel(l) ? `${l.naam} · ${positieLabel(l)}` : positieLabel(l), items: g });
    }
    const los = items.filter(
      (i) => i.plek === 'werkbank' && !lades.some((l) => l.id === i.lade_id),
    );
    if (los.length) out.push({ id: 'werkbank-los', titel: 'Koelwerkbank', items: los });
    const toppings = items.filter((i) => i.plek === 'werkblad');
    if (toppings.length) out.push({ id: 'werkblad', titel: 'Toppings', items: toppings });
    return out;
  }, [items, lades, datum]);

  const alle = groepen.flatMap((g) => g.items);
  const klaar = alle.filter((i) => checks.has(i.id)).length;
  const taakDatum = volgendeOpenDag(datum, kalender.isOpen);

  const metStatus = async (id: string, actie: () => Promise<unknown>, opnieuw: () => void) => {
    setBezig((s) => new Set(s).add(id));
    try {
      await actie();
      setMislukt((m) => {
        const n = { ...m };
        delete n[id];
        return n;
      });
    } catch (e: unknown) {
      setMislukt((m) => ({ ...m, [id]: opnieuw }));
      toast.error(e instanceof VervolgFout ? e.message : 'Niet opgeslagen. Controleer de wifi en probeer opnieuw.');
    } finally {
      setBezig((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const ketenVan = (item: KoelcelCheckItem) =>
    ketenVoor(item, items, vestiging, vervolg.rijen, internLijst);

  const instellingVan = (item: KoelcelCheckItem): KetenInvoer => {
    const keten = ketenVan(item);
    return {
      instructie: keten.instructie,
      stapKoelcel: keten.stappen.includes('koelcel'),
      stapVriezer: keten.stappen.includes('vriezer'),
      stapMagazijn: keten.stappen.includes('magazijn'),
      eindactie: keten.eindactie,
      komtUitMidsland: keten.komtUitMidsland,
    };
  };

  const voerActie = async (item: KoelcelCheckItem, actie: Eindactie) => {
    if (actie === 'mep') {
      const r = await naarMepDirect.mutateAsync({ item, taakDatum });
      toast.success(r.dubbel ? `${item.naam} stond al op de MEP` : `${item.naam} staat op de MEP`);
      return;
    }
    if (actie === 'intern_midsland') {
      const product = interneProductVoor(item, internLijst);
      if (!product) throw new VervolgFout('Dit product staat niet in de interne producten.');
      try {
        await vervolg.intern(item, product.product_id, v2Aan ? 'v2' : 'v1');
      } catch (e) {
        throw new VervolgFout(e instanceof Error && e.message ? e.message : 'Intern bestellen lukte niet.');
      }
      toast.success(`${item.naam} is intern bij Midsland besteld`);
      return;
    }
    try {
      const r = await vervolg.bestelbord(item);
      toast.success(r.dubbel ? `${item.naam} stond al op het bestelbord` : `${item.naam} staat op het bestelbord`);
    } catch (e) {
      throw new VervolgFout(e instanceof Error && e.message ? e.message : 'Het bestelbord is niet bijgewerkt.');
    }
  };

  const vink = (item: KoelcelCheckItem) => {
    const uit = checks.has(item.id);
    bewaarSessie(item.id, null);
    metStatus(item.id, () => zetStatus.mutateAsync({ item, status: 'aanwezig', uit }), () => vink(item));
  };

  const mep = (item: KoelcelCheckItem) => {
    metStatus(
      item.id,
      async () => {
        const r = await naarMepDirect.mutateAsync({ item, taakDatum });
        toast.success(r.dubbel ? `${item.naam} stond al op de MEP` : `${item.naam} staat op de MEP`);
      },
      () => mep(item),
    );
  };

  // Eén tik, één plan. Schrijven alleen als schrijfKeten aan staat.
  const opKeten = (item: KoelcelCheckItem, naam: string, gebeurtenis: 'op' | 'stap-af' | 'ook-op') => {
    const keten = ketenVan(item);
    const raw = stappenRef.current[item.id];
    const check = checks.get(item.id);
    const doorgezet = !!check && check.status !== 'aanwezig';
    const openIndex = raw && !raw.af && !raw.voorbeeldEind && raw.index < keten.stappen.length ? raw.index : null;
    const plan = planKeten(
      keten,
      gebeurtenis,
      openIndex,
      naam,
      item.plek === 'werkblad' ? 'werkblad' : 'werkbank',
      doorgezet || !!raw?.af || !!raw?.voorbeeldEind,
    );
    if (plan.soort === 'niets') return;
    if (plan.soort === 'open-stap') {
      bewaarSessie(item.id, { index: plan.index, af: false });
      return;
    }
    if (plan.soort === 'transfer') {
      const index = openIndex ?? 0;
      if (!schrijfKeten) {
        bewaarSessie(item.id, { index, af: true });
        return;
      }
      metStatus(item.id, async () => {
        await zetStatus.mutateAsync({ item, status: 'aanwezig', uit: false });
        if (plan.sticker) {
          const koelcel = koelcelRegelVoor(item, items);
          const hoeveel = vriezerNaarKoelcelAantal(item, koelcel);
          try {
            await printSticker.mutateAsync(ontdooiStickerOpdracht(naam, hoeveel.aantal, new Date()));
            toast.success(`Sticker "Ontdooid · ${naam}" wordt geprint`);
          } catch (e) {
            const bericht = e instanceof Error ? e.message : 'onbekende fout';
            toast.error(`Stap opgeslagen. Sticker niet geprint: ${bericht}`);
          }
        }
        bewaarSessie(item.id, { index, af: true });
      }, () => opKeten(item, naam, gebeurtenis));
      return;
    }
    if (!schrijfKeten) {
      bewaarSessie(item.id, { index: openIndex ?? 0, af: false, voorbeeldEind: plan.actie });
      toast.message('De aanvulketen staat uit. Er wordt niets aangemaakt.');
      return;
    }
    metStatus(
      item.id,
      async () => {
        await voerActie(item, plan.actie);
        bewaarSessie(item.id, null);
      },
      () => opKeten(item, naam, gebeurtenis),
    );
  };

  const op = (item: KoelcelCheckItem, koelcelLeeg = false) => {
    if (!koelcelLeeg && vraagtKoelcelBevestiging(item, items)) {
      setKoelcelKeuze(item);
      return;
    }
    metStatus(
      item.id,
      async () => {
        const r = await bronOp.mutateAsync({ item, taakDatum });
        toast.success(`${r.bronItem.naam} ${BEVESTIG[r.bestemming.soort] ?? 'is gemeld'}`);
      },
      () => op(item, koelcelLeeg),
    );
  };

  const openFouten = Object.entries(mislukt);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!alle.length) return null;

  return (
    <div id="afvinkronde-blok" style={{ marginBottom: '32px' }}>
      <SectieBalk
        titel="Bijvullen"
        stand={`${klaar}/${alle.length}`}
        afgerond={klaar === alle.length}
      />

      <div>


          {openFouten.length > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-[14px] border border-warning/40 bg-warning/10 p-3">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm">{openFouten.length} nog niet opgeslagen</span>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => openFouten.forEach(([, f]) => f())}
              >
                <RotateCcw className="h-4 w-4" /> Opnieuw
              </Button>
            </div>
          )}

          {groepen.map((g) => {
            const gedaan = g.items.filter((i) => checks.has(i.id)).length;
            const af = gedaan === g.items.length;
            return (
              <div key={g.id} style={{ marginBottom: '24px' }}>
                <h3
                  className={cn(
                    'mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.05em]',
                    af ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {g.titel}
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px] font-medium normal-case tracking-normal',
                      af ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground',
                    )}
                  >
                    {gedaan}/{g.items.length}
                  </span>
                </h3>
                <ul className="space-y-1.5">

                  {g.items.map((i) => {
                    const c = checks.get(i.id);
                    const soort = soortVanBron(i.bron);
                    const afgevinkt = c?.status === 'aanwezig';
                    const doorgezet = c && c.status !== 'aanwezig';
                    const laden = bezig.has(i.id);
                    const fout = !!mislukt[i.id];
                    const bron = soort === 'pakken' ? diepsteBron(i, items) : null;
                    const uitleg = (
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="inline-flex items-center gap-2">
                          <VulPeil procent={peilBlokjes(i.vulnorm)} label={aanvulTekst(i.vulnorm)} />
                          <span className="text-[13px] font-medium text-foreground">{peilKort(i.vulnorm)}</span>
                        </span>
                        <span className="text-muted-foreground/60" aria-hidden>·</span>
                        <span className={cn('text-[13px]', soort === 'pakken' ? 'text-muted-foreground' : 'font-medium text-primary')}>
                          {herkomstLabel(soort, ketenKortLabel(i, items))}
                        </span>
                      </span>
                    );
                    const naam = /flessen/i.test(g.titel) ? i.naam.replace(/\s*\(fles\)\s*$/i, '') : i.naam;
                    const bewerk = toonInstellen ? () => setPaneelItem(i) : undefined;
                    if (toonKeten) {
                      const keten = ketenVan(i);
                      const raw = sessie[i.id];
                      const stapSoort = raw && !raw.voorbeeldEind && raw.index < keten.stappen.length ? keten.stappen[raw.index] : null;
                      const stapOpen = !!raw && !raw.af && !raw.voorbeeldEind && !!stapSoort;
                      const knop = raw?.af || raw?.voorbeeldEind ? null : lijstKnop(keten, stapOpen);
                      const koelcel = stapSoort === 'vriezer' ? koelcelRegelVoor(i, items) : null;
                      const hoeveel = stapSoort === 'vriezer' ? vriezerNaarKoelcelAantal(i, koelcel) : null;
                      const eenheid = hoeveel ? vriezerNaarKoelcelEenheid(hoeveel.bron, i, koelcel) : null;
                      const mepTint = keten.stappen.length === 0 && keten.eindactie === 'mep';
                      return (
                        <KetenLijstRij
                          key={i.id}
                          naam={naam}
                          instructie={keten.instructie}
                          afgevinkt={!!afgevinkt}
                          doorgezet={!!doorgezet}
                          laden={laden}
                          fout={fout}
                          knop={knop}
                          voorbeeld={raw?.voorbeeldEind ? 'Voorbeeld. Er wordt niets op de MEP, het bestelbord of bij Midsland gezet.' : null}
                          uitleg={doorgezet ? (UITKOMST[c!.doorgezet_naar ?? ''] ?? 'Gemeld') : (
                            <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="inline-flex items-center gap-2">
                                <VulPeil procent={peilBlokjes(i.vulnorm)} label={aanvulTekst(i.vulnorm)} />
                                <span className="text-[13px] font-medium text-foreground">{peilKort(i.vulnorm)}</span>
                              </span>
                              <span className="text-muted-foreground/60" aria-hidden>·</span>
                              <span className={cn('text-[13px]', mepTint ? 'font-medium text-primary' : 'text-muted-foreground')}>
                                {ketenUitleg(keten)}
                              </span>
                            </span>
                          )}
                          stap={stapSoort ? {
                            titel: stapTitel(naam, stapSoort, i.plek === 'werkblad' ? 'werkblad' : 'werkbank'),
                            detail: hoeveel ? hoeveelheidTekst(hoeveel.aantal, eenheid) : null,
                            afgevinkt: !!raw?.af,
                            onAf: () => opKeten(i, naam, 'stap-af'),
                            onOokOp: () => opKeten(i, naam, 'ook-op'),
                          } : null}
                          onAfvinken={() => vink(i)}
                          onKnop={() => opKeten(i, naam, 'op')}
                          onHerstel={() => {
                            bewaarSessie(i.id, null);
                            metStatus(i.id, () => zetStatus.mutateAsync({ item: i, status: 'aanwezig', uit: true }), () => {});
                          }}
                          onBewerk={bewerk}
                        />
                      );
                    }
                    return (
                      <li
                        className={cn(
                          'flex items-center gap-1.5 rounded-[14px] border px-2 py-1 transition-colors sm:gap-3',
                          toonInstellen && 'flex-wrap',
                          afgevinkt ? 'border-transparent bg-muted/40' : doorgezet ? 'border-warning/30 bg-warning/5' : 'border-border bg-card',
                        )}
                      >
                        <button
                          type="button"
                          aria-label={`${i.naam} afvinken`}
                          aria-pressed={afgevinkt}
                          disabled={laden || !!doorgezet}
                          onClick={() => vink(i)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center"
                        >
                          <span
                            className={cn(
                              'flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border-2 bg-background transition-colors sm:h-6 sm:w-6',
                              afgevinkt
                                ? 'border-muted-foreground/30 bg-muted-foreground/15 text-muted-foreground'
                                : doorgezet
                                  ? 'border-warning bg-warning/15'
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
                        <div className={cn('min-w-0 flex-1 py-1.5', bewerk && 'min-w-40')}>
                          <p
                            className={cn(
                              'text-[16px] font-medium leading-snug text-foreground',
                              afgevinkt && 'text-muted-foreground line-through opacity-55',
                            )}
                          >
                            {naam}
                          </p>
                          <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                            {doorgezet
                              ? (UITKOMST[c!.doorgezet_naar ?? ''] ?? 'Gemeld')
                              : uitleg}
                          </div>
                        </div>
                        {bewerk && <TaakBewerkKnop naam={naam} onClick={bewerk} />}
                        {!afgevinkt && !doorgezet && (
                          soort === 'pakken' ? (
                            <Button
                              variant="ghost"
                              className="h-11 shrink-0 gap-1.5 rounded-[14px] border border-border bg-muted/60 px-3 text-[13px] font-medium text-foreground hover:bg-muted"
                              disabled={laden}
                              onClick={() => op(i)}
                              aria-label={`Bijbestellen: ${i.naam}`}
                              title={bron ? `Gaat naar ${bron.bestemming.label}` : undefined}
                            >
                              <PackageX className="h-4 w-4" /> Bijbestellen
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              className="h-11 shrink-0 gap-1.5 rounded-[14px] border border-primary/20 bg-primary/10 px-3 text-[13px] font-medium text-primary hover:bg-primary/15 hover:text-primary"
                              disabled={laden}
                              onClick={() => mep(i)}
                            >
                              <ChefHat className="h-4 w-4" /> Naar MEP
                            </Button>
                          )
                        )}
                        {doorgezet && (
                          <Button
                            variant="ghost"
                            className="h-11 shrink-0 px-2 text-[13px] text-muted-foreground"
                            disabled={laden}
                            onClick={() =>
                              metStatus(i.id, () => zetStatus.mutateAsync({ item: i, status: 'aanwezig', uit: true }), () => {})
                            }
                          >
                            Herstel
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
      </div>
      <Dialog open={!!koelcelKeuze} onOpenChange={(open) => { if (!open) setKoelcelKeuze(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{koelcelKeuze?.naam}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button variant="outline" size="touch" onClick={() => {
              if (!koelcelKeuze) return;
              const item = koelcelKeuze;
              setKoelcelKeuze(null);
              vink(item);
            }}>
              <Check className="h-4 w-4" /> Aanvullen uit koelcel
            </Button>
            <Button variant="outline" size="touch" onClick={() => {
              if (!koelcelKeuze) return;
              const item = koelcelKeuze;
              setKoelcelKeuze(null);
              op(item, true);
            }}>
              <PackageX className="h-4 w-4" /> Koelcel is leeg — bijbestellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {toonInstellen && paneelItem && (
        <TaakVervolgPaneel
          open
          naam={paneelItem.naam}
          waarde={instellingVan(paneelItem)}
          midslandVast={ketenVan(paneelItem).midslandVast}
          ketenAan={schrijfKeten}
          internBeschikbaar={!!interneProductVoor(paneelItem, internLijst)}
          internLaden={internProducten.isLoading || internV2.isLoading}
          opslaanBezig={vervolg.bewaar.isPending}
          onOpenChange={(open) => { if (!open) setPaneelItem(null); }}
          onOpslaan={(invoer) => {
            const item = paneelItem;
            const vast = ketenVan(item).midslandVast;
            void vervolg.bewaar.mutateAsync({ taakSleutel: taakSleutelVan(item), invoer, midslandVast: vast }).then(() => {
              toast.success(`Instelling voor ${item.naam} bewaard`);
              setPaneelItem(null);
            }).catch((e: unknown) => {
              const bericht = e instanceof Error && e.message ? e.message : 'Niet opgeslagen';
              toast.error(bericht.includes('taak_vervolg_config') ? 'De instelling staat nog niet in de database.' : bericht);
            });
          }}
        />
      )}
    </div>
  );
}

export default AfvinkRonde;
