import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, ChefHat, Loader2, PackageX, RotateCcw, WifiOff } from 'lucide-react';
import { SectieBalk } from './SectieBalk';
import { FalafelAanvulRij } from './FalafelAanvulRij';
import { TaakBewerkKnop } from './TaakBewerkKnop';
import { TaakVervolgPaneel } from './TaakVervolgPaneel';
import { VriezerNaarKoelcelRij } from './VriezerNaarKoelcelRij';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';
import {
  aanvulketenAan,
  heeftVriezerNaarKoelcel,
  hoeveelheidTekst,
  isFalafelVoorbeeld,
  koelcelRegelVoor,
  leesVriezerStappen,
  ontdooiStickerOpdracht,
  vriezerNaarKoelcelAantal,
  vriezerNaarKoelcelEenheid,
  vriezerNaarKoelcelTitel,
  vriezerStapSleutel,
  type VriezerStapStand,
} from '@/lib/aanvulketen';
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
  configVoorTaak,
  interneProductVoor,
  taakSleutelVan,
  VervolgFout,
  type VervolgActie,
  type VervolgInvoer,
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
  const { zetStatus, naarMepDirect, bronOp, ontdooiDirect, bestelUitSluitlijst } = useKoelcelCheckMutaties(vestiging, datum, items);
  const [zoekparams] = useSearchParams();
  const ketenAan = aanvulketenAan({
    vestiging,
    env: (import.meta.env as { VITE_SLUIT_AANVULKETEN?: string }).VITE_SLUIT_AANVULKETEN,
    search: zoekparams.toString(),
    previewHost: typeof window !== 'undefined' && isPreviewHost(window.location.hostname),
  });
  const eigenaar = useIsEigenaar();
  // Potlood en paneel voor de eigenaar, ook zonder ?aanvulketen=1.
  const toonInstellen = eigenaar;
  // Lezen voor het paneel. De vlag zet alleen de query aan; opslaan niet.
  const vervolg = useTaakVervolg(vestiging, datum, ketenAan || toonInstellen);
  const internProducten = useInterneProducten((ketenAan || toonInstellen) ? vestiging : null);
  const [paneelItem, setPaneelItem] = useState<KoelcelCheckItem | null>(null);
  const printSticker = useCreateStickerPrintJob();
  const [vriezerStappen, setVriezerStappen] = useState<Record<string, VriezerStapStand>>(() => {
    if (typeof sessionStorage === 'undefined') return {};
    try {
      return leesVriezerStappen(sessionStorage.getItem(vriezerStapSleutel(vestiging, datum)));
    } catch {
      return {};
    }
  });
  const stappenRef = useRef(vriezerStappen);
  stappenRef.current = vriezerStappen;

  useEffect(() => {
    try {
      const gelezen = leesVriezerStappen(sessionStorage.getItem(vriezerStapSleutel(vestiging, datum)));
      stappenRef.current = gelezen;
      setVriezerStappen(gelezen);
    } catch {
      /* stil */
    }
  }, [vestiging, datum]);

  const bewaarVriezerStap = (id: string, stand: VriezerStapStand | null) => {
    const next = { ...stappenRef.current };
    if (stand) next[id] = stand;
    else delete next[id];
    stappenRef.current = next;
    setVriezerStappen(next);
    try {
      sessionStorage.setItem(vriezerStapSleutel(vestiging, datum), JSON.stringify(next));
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
    } catch (e: any) {
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

  // Uitvoeren blijft achter de schakelaar. Zonder keten is afvinken een gewoon vinkje:
  // de stap uit vriezer naar koelcel (en de andere vervolgacties) verschijnt dan niet.
  const configVan = (item: KoelcelCheckItem) =>
    ketenAan ? configVoorTaak(item, vestiging, vervolg.rijen) : null;

  const instellingVan = (item: KoelcelCheckItem): VervolgInvoer => {
    const cfg = configVoorTaak(item, vestiging, vervolg.rijen);
    return {
      instructie: cfg?.instructie ?? '',
      vervolgactie: cfg?.vervolgactie ?? 'geen',
      vervolgAlsOp: cfg?.vervolgAlsOp ?? null,
    };
  };

  const voerActie = async (item: KoelcelCheckItem, actie: VervolgActie) => {
    if (actie === 'mep') {
      const r = await naarMepDirect.mutateAsync({ item, taakDatum });
      toast.success(r.dubbel ? `${item.naam} stond al op de MEP` : `${item.naam} staat op de MEP`);
      return;
    }
    if (actie === 'intern_midsland') {
      const product = interneProductVoor(item, internProducten.data);
      if (!product) throw new VervolgFout('Dit product staat niet in de interne producten.');
      try {
        await vervolg.intern(item, product.product_id);
      } catch (e) {
        throw new VervolgFout(e instanceof Error && e.message ? e.message : 'Intern bestellen lukte niet.');
      }
      toast.success(`${item.naam} is intern bij Midsland besteld`);
      return;
    }
    if (actie === 'bestelbord') {
      try {
        const r = await vervolg.bestelbord(item);
        toast.success(r.dubbel ? `${item.naam} stond al op het bestelbord` : `${item.naam} staat op het bestelbord`);
      } catch (e) {
        throw new VervolgFout(e instanceof Error && e.message ? e.message : 'Het bestelbord is niet bijgewerkt.');
      }
    }
  };

  const vink = (item: KoelcelCheckItem, metVervolg = true) => {
    const uit = checks.has(item.id);
    // typeof blijft veilig als een test alleen deze handler los uitvoert.
    const cfg = metVervolg && typeof configVan === 'function' ? configVan(item) : null;
    if (!uit && cfg?.vervolgactie === 'vriezer_naar_koelcel' && !isFalafelVoorbeeld(item)) {
      if (vriezerStappen[item.id] !== 'open') bewaarVriezerStap(item.id, 'open');
      return;
    }
    if (!uit && cfg && (cfg.vervolgactie === 'mep' || cfg.vervolgactie === 'bestelbord' || cfg.vervolgactie === 'intern_midsland')) {
      metStatus(item.id, () => voerActie(item, cfg.vervolgactie), () => vink(item, true));
      return;
    }
    metStatus(item.id, () => zetStatus.mutateAsync({ item, status: 'aanwezig', uit }), () => vink(item, metVervolg));
  };

  const nietBijTeVullen = (item: KoelcelCheckItem, actie: VervolgActie) => {
    metStatus(
      item.id,
      async () => {
        await voerActie(item, actie);
        bewaarVriezerStap(item.id, null);
      },
      () => nietBijTeVullen(item, actie),
    );
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

  const ontdooi = (item: KoelcelCheckItem) => {
    metStatus(
      item.id,
      async () => {
        const r = await ontdooiDirect.mutateAsync({ item, taakDatum });
        toast.success(r.dubbel ? `${item.naam} stond al op de ontdooilijst` : `Ontdooien gestart voor ${item.naam}`);
      },
      () => ontdooi(item),
    );
  };

  const vinkUitVriezer = (item: KoelcelCheckItem, aantal: number, stickerNaam: string) => {
    const uit = checks.has(item.id);
    metStatus(
      item.id,
      async () => {
        await zetStatus.mutateAsync({ item, status: 'aanwezig', uit });
        if (!uit) {
          try {
            await printSticker.mutateAsync(ontdooiStickerOpdracht(stickerNaam, aantal, new Date()));
            toast.success(`Sticker "Ontdooid · ${stickerNaam}" wordt geprint`);
          } catch (e) {
            const bericht = e instanceof Error ? e.message : 'onbekende fout';
            toast.error(`Stap opgeslagen. Sticker niet geprint: ${bericht}`);
          }
        }
        bewaarVriezerStap(item.id, uit ? 'open' : 'af');
      },
      () => vinkUitVriezer(item, aantal, stickerNaam),
    );
  };

  const bestelVoorbeeld = (item: KoelcelCheckItem) => {
    metStatus(
      item.id,
      async () => {
        const r = await bestelUitSluitlijst.mutateAsync({ item });
        toast.success(r.dubbel ? `${item.naam} stond al op het bestelbord` : `${item.naam} staat op het bestelbord`);
      },
      () => bestelVoorbeeld(item),
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
                    const cfg = configVan(i);
                    const instructie = cfg?.instructie ?? '';
                    const bewerk = toonInstellen ? () => setPaneelItem(i) : undefined;
                    const internProduct = interneProductVoor(i, internProducten.data);
                    const alsOpUitleg = cfg?.vervolgAlsOp === 'intern_midsland' && internProducten.isFetched && !internProduct
                      ? 'Dit product staat niet bij de interne producten.'
                      : null;
                    if (ketenAan && isFalafelVoorbeeld(i)) {
                      const stand = vriezerStappen[i.id];
                      const keten = heeftVriezerNaarKoelcel(i, vervolg.rijen, vestiging);
                      const koelcel = koelcelRegelVoor(i, items);
                      const hoeveel = vriezerNaarKoelcelAantal(i, koelcel);
                      const eenheid = vriezerNaarKoelcelEenheid(hoeveel.bron, i, koelcel);
                      const toonStap = keten && (stand === 'open' || (stand === 'af' && !!afgevinkt));
                      return (
                        <Fragment key={i.id}>
                          <FalafelAanvulRij
                            naam={naam}
                            vulnorm={i.vulnorm}
                            eenheid={i.eenheid}
                            doelAantal={i.doel_aantal}
                            batchAantal={i.batch_aantal}
                            afgevinkt={!!afgevinkt}
                            doorgezet={!!doorgezet}
                            doorgezetNaar={c?.doorgezet_naar}
                            laden={laden}
                            fout={stand === 'open' ? false : fout}
                            koelcelGepakt={stand === 'open'}
                            beginStap={stand === 'open' ? 'koelcel' : 'lade'}
                            instructie={instructie}
                            onBewerk={bewerk}
                            onOpPeil={() => {
                              bewaarVriezerStap(i.id, null);
                              vink(i, false);
                            }}
                            onAangevuld={() => {
                              if (keten) bewaarVriezerStap(i.id, 'open');
                              else vink(i, true);
                            }}
                            onOntdooien={() => ontdooi(i)}
                            onBestellen={() => bestelVoorbeeld(i)}
                            onHerstel={() => {
                              bewaarVriezerStap(i.id, null);
                              metStatus(i.id, () => zetStatus.mutateAsync({ item: i, status: 'aanwezig', uit: true }), () => {});
                            }}
                            onVink={() => {
                              if (stand === 'open') return;
                              bewaarVriezerStap(i.id, null);
                              vink(i, false);
                            }}
                            onTerugVanKoelcel={() => bewaarVriezerStap(i.id, null)}
                          />
                          {toonStap && (
                            <VriezerNaarKoelcelRij
                              titel={vriezerNaarKoelcelTitel(naam)}
                              aantalTekst={hoeveelheidTekst(hoeveel.aantal, eenheid)}
                              afgevinkt={stand === 'af' && !!afgevinkt}
                              laden={laden}
                              fout={stand === 'open' && fout}
                              onVink={() => vinkUitVriezer(i, hoeveel.aantal, naam)}
                              onNietBijTeVullen={cfg?.vervolgAlsOp && !alsOpUitleg ? () => nietBijTeVullen(i, cfg.vervolgAlsOp!) : undefined}
                              nietBijTeVullenUitleg={cfg?.vervolgAlsOp ? alsOpUitleg : null}
                            />
                          )}
                        </Fragment>
                      );
                    }
                    const stand = vriezerStappen[i.id];
                    const vriezerStap = !!cfg && cfg.vervolgactie === 'vriezer_naar_koelcel';
                    const toonVriezer = vriezerStap && (stand === 'open' || (stand === 'af' && !!afgevinkt));
                    const koelcel = vriezerStap ? koelcelRegelVoor(i, items) : null;
                    const hoeveel = vriezerStap ? vriezerNaarKoelcelAantal(i, koelcel) : null;
                    const eenheid = hoeveel ? vriezerNaarKoelcelEenheid(hoeveel.bron, i, koelcel) : null;
                    return (
                      <Fragment key={i.id}>
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
                          {!!instructie.trim() && (
                            <p className="mt-0.5 text-[13px] leading-snug text-foreground">{instructie.trim()}</p>
                          )}
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
                      {toonVriezer && hoeveel && (
                        <VriezerNaarKoelcelRij
                          titel={vriezerNaarKoelcelTitel(naam)}
                          aantalTekst={hoeveelheidTekst(hoeveel.aantal, eenheid)}
                          afgevinkt={stand === 'af' && !!afgevinkt}
                          laden={laden}
                          fout={!!fout}
                          onVink={() => vinkUitVriezer(i, hoeveel.aantal, naam)}
                          onNietBijTeVullen={cfg?.vervolgAlsOp && !alsOpUitleg ? () => nietBijTeVullen(i, cfg.vervolgAlsOp!) : undefined}
                          nietBijTeVullenUitleg={cfg?.vervolgAlsOp ? alsOpUitleg : null}
                        />
                      )}
                      </Fragment>
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
          ketenAan={ketenAan}
          internBeschikbaar={!!interneProductVoor(paneelItem, internProducten.data)}
          internLaden={internProducten.isLoading}
          opslaanBezig={vervolg.bewaar.isPending}
          onOpenChange={(open) => { if (!open) setPaneelItem(null); }}
          onOpslaan={(invoer) => {
            const item = paneelItem;
            void vervolg.bewaar.mutateAsync({ taakSleutel: taakSleutelVan(item), invoer }).then(() => {
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
