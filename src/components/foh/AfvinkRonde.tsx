import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChefHat, ChevronDown, Loader2, PackageX, RotateCcw, WifiOff } from 'lucide-react';
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
      if (g.length) out.push({ id: l.id, titel: `${l.naam || 'Lade'} · ${positieLabel(l)}`, items: g });
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
    <section id="voorraadronde-blok" className="mb-6 rounded-[20px] border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left"
      >
        <span className="flex-1">
          <span className="block text-base font-semibold text-foreground">Sluitronde keuken</span>
          <span className="block text-sm text-muted-foreground">
            Vink af wat er ligt of wat je hebt aangevuld
          </span>
        </span>
        <span
          className={cn(
            'text-sm font-semibold',
            klaar === alle.length ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          {klaar}/{alle.length}
        </span>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-4 px-3 pb-4 sm:px-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${alle.length ? (klaar / alle.length) * 100 : 0}%` }}
            />
          </div>

          {openFouten.length > 0 && (
            <div className="flex items-center gap-3 rounded-[14px] border border-warning/40 bg-warning/10 p-3">
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
            return (
              <div key={g.id} className="rounded-[16px] border border-border">
                <div className="flex items-center justify-between rounded-t-[16px] bg-muted px-4 py-3">
                  <h3 className="text-[15px] font-semibold text-foreground">{g.titel}</h3>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      gedaan === g.items.length ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {gedaan === g.items.length ? 'Klaar' : `${gedaan}/${g.items.length}`}
                  </span>
                </div>
                <ul className="divide-y divide-border">
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
                        : `${vulnormLabel(i)} · anders ${soort === 'snijden' ? 'snijden' : 'maken'}`;
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
                              aria-label={`${i.naam}: bron is op`}
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
    </section>
  );
}

export default AfvinkRonde;
