import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChefHat, Loader2, PackageX, RotateCcw, WifiOff } from 'lucide-react';
import { SectieBalk } from './SectieBalk';
import { InfoKnop } from './InfoKnop';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  ketenKortLabel,
  vulnormLabel,
  diepsteBron,
  type KoelcelCheck,
  type KoelcelCheckItem,
} from '@/hooks/useKoelcelCheck';
import { useVoorraadLades, positieLabel } from '@/hooks/useVoorraadLades';
import { useMepKalender } from '@/hooks/useMepPlanning';
import { soortVanBron, volgendeOpenDag } from '@/lib/sluitronde';

interface Groep {
  id: string;
  titel: string;
  items: KoelcelCheckItem[];
}

const UITKOMST: Record<string, string> = {
  mep: 'op de MEP',
  bestelbord: 'op het bestelbord',
  midsland: 'op de bestellijst voor Midsland',
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
  const [open, setOpen] = useState(true);
  const [bezig, setBezig] = useState<Set<string>>(new Set());
  const [mislukt, setMislukt] = useState<Record<string, () => void>>({});

  // Snelknop "Sluitronde keuken": openen en ernaartoe scrollen.
  useEffect(() => {
    const ga = () => {
      setOpen(true);
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
      toast.error('Niet opgeslagen. Controleer de wifi en probeer opnieuw.');
    } finally {
      setBezig((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const vink = (item: KoelcelCheckItem) => {
    const uit = checks.has(item.id);
    const run = () =>
      metStatus(item.id, () => zetStatus.mutateAsync({ item, status: 'aanwezig', uit }), () => vink(item));
    run();
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

  const op = (item: KoelcelCheckItem) => {
    metStatus(
      item.id,
      async () => {
        const r = await bronOp.mutateAsync({ item, taakDatum });
        toast.success(`${r.bronItem.naam} staat ${UITKOMST[r.bestemming.soort] ?? 'gemeld'}`);
      },
      () => op(item),
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
        titel="Sluitronde keuken"
        stand={`${klaar}/${alle.length}`}
        afgerond={klaar === alle.length}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />

      {open && (
        <div>
          <div className="mb-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <InfoKnop tekst="Vink af wat er ligt of wat je net hebt aangevuld. Bron op: ook de voorraad erachter is leeg. Naar MEP: moet gesneden of gemaakt worden." />
            <span>Hoe werkt dit?</span>
          </div>

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
                <ul className="divide-y divide-border border-b border-border pb-2">

                  {g.items.map((i) => {
                    const c = checks.get(i.id);
                    const soort = soortVanBron(i.bron);
                    const afgevinkt = c?.status === 'aanwezig';
                    const doorgezet = c && c.status !== 'aanwezig';
                    const laden = bezig.has(i.id);
                    const fout = !!mislukt[i.id];
                    const bron = soort === 'pakken' ? diepsteBron(i, items) : null;
                    const uitleg =
                      soort === 'pakken'
                        ? `${vulnormLabel(i)} · ${ketenKortLabel(i, items)}`
                        : `${vulnormLabel(i)} · op? ${soort === 'snijden' ? 'snijden' : 'maken'} via MEP`;
                    return (
                      <li key={i.id} className="flex items-center gap-2 px-2 py-1.5">
                        <button
                          type="button"
                          aria-label={`${i.naam} afvinken`}
                          aria-pressed={afgevinkt}
                          disabled={laden || !!doorgezet}
                          onClick={() => vink(i)}
                          className="flex h-12 w-12 shrink-0 items-center justify-center"
                        >
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                              afgevinkt
                                ? 'border-primary bg-primary text-primary-foreground'
                                : doorgezet
                                  ? 'border-warning bg-warning/15'
                                  : fout
                                    ? 'border-destructive'
                                    : 'border-input',
                            )}
                          >
                            {laden ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : afgevinkt ? (
                              <Check className="h-4 w-4" />
                            ) : null}
                          </span>
                        </button>
                        <div className="min-w-0 flex-1 py-1">
                          <p
                            className={cn(
                              'text-[15px] font-medium leading-tight text-foreground',
                              afgevinkt && 'text-muted-foreground line-through',
                            )}
                          >
                            {i.naam}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {doorgezet
                              ? `Staat ${UITKOMST[c!.doorgezet_naar ?? ''] ?? 'gemeld'}`
                              : uitleg}
                          </p>
                        </div>
                        {!afgevinkt && !doorgezet && (
                          soort === 'pakken' ? (
                            <Button
                              variant="outline"
                              className="h-11 shrink-0 px-3"
                              disabled={laden}
                              onClick={() => op(i)}
                              aria-label={`Bron op: ${i.naam}`}
                              title={bron ? `Gaat naar ${bron.bestemming.label}` : undefined}
                            >
                              <PackageX className="h-4 w-4" /> Bron op
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="h-11 shrink-0 px-3"
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
                            className="h-11 shrink-0 px-3 text-muted-foreground"
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
      )}
    </div>
  );
}

export default AfvinkRonde;
