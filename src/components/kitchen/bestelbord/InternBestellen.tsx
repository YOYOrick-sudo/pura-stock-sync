import { useRef, useState, type ReactNode } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMeta } from '@/components/pura/lijst';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Button } from '@/components/ui/button';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { getal } from '@/lib/hoeveelheid';
import {
  alsGetal, foutTekst, inhoudPerEenheid, klemAantal, mepDagLang,
  useInternePlaatsen, useInterneProducten,
  type InternProduct, type PlaatsResultaat,
} from '@/hooks/useInterneLevering';

function maxVan(p: InternProduct) {
  const n = alsGetal(p.max_per_bestelling);
  return n != null && n >= 1 ? n : null;
}

function subregel(producten: InternProduct[]) {
  const dagen = [...new Set(producten.map((p) => p.volgende_mep_datum).filter(Boolean))];
  if (dagen.length === 1) return `Komt op de MEP van Midsland van ${mepDagLang(dagen[0])}.`;
  return 'Komt op de MEP van Midsland.';
}

export function InternBestelKaart({ producten, onBestellen, bezigId, bestaande }: {
  producten: InternProduct[];
  onBestellen: (product: InternProduct, aantal: number, sleutel: string) => Promise<PlaatsResultaat>;
  bezigId?: string | null;
  bestaande?: ReactNode;
}) {
  const [aantallen, setAantallen] = useState<Record<string, number>>({});
  const gekozen = useRef<Record<string, number>>({});
  const sleutels = useRef(new Map<string, string>());
  const lijst = [...producten].sort((a, b) => (a.volgorde ?? 0) - (b.volgorde ?? 0) || a.naam.localeCompare(b.naam, 'nl'));

  const aantalVan = (p: InternProduct) => gekozen.current[p.product_id] ?? aantallen[p.product_id] ?? klemAantal(1, 1, maxVan(p));

  const sleutelVoor = (id: string) => {
    let sleutel = sleutels.current.get(id);
    if (!sleutel) {
      sleutel = crypto.randomUUID();
      sleutels.current.set(id, sleutel);
    }
    return sleutel;
  };

  const bestellen = async (p: InternProduct) => {
    const sleutel = sleutelVoor(p.product_id);
    try {
      const r = await onBestellen(p, aantalVan(p), sleutel);
      sleutels.current.delete(p.product_id);
      gekozen.current[p.product_id] = 1;
      setAantallen((huidig) => ({ ...huidig, [p.product_id]: 1 }));
      const dag = mepDagLang(r?.mep_datum);
      toast.success(dag ? `${p.naam} staat op de MEP van Midsland voor ${dag}` : `${p.naam} staat op de MEP van Midsland`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  return (
    <LijstKaart kop={<KaartKop icoon={Warehouse} titel="Intern uit Midsland" teller={lijst.length} />}>
      <p className="px-4 pb-1 pt-3 text-sm text-muted-foreground lg:px-6">{subregel(lijst)}</p>
      <div className="divide-y divide-border">
        {lijst.map((p) => {
          const open = alsGetal(p.open_aantal) ?? 0;
          const per = inhoudPerEenheid(p.inhoud_per_eenheid, p.inhoud_eenheid, p.eenheid);
          const max = maxVan(p);
          return (
            <div key={p.product_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 lg:px-6">
              <div className="min-w-[8rem] flex-1">
                <div className="flex min-h-11 min-w-0 flex-wrap items-center gap-1.5">
                  <span className="min-w-0 break-words font-medium text-foreground">{p.naam}</span>
                  {open > 0 && <StatusBadge tone="info" className="px-2 py-0.5">{`${getal(open)} onderweg`}</StatusBadge>}
                </div>
                {per && <RijMeta altijd>{per}</RijMeta>}
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <AantalStapper
                  compact
                  waarde={aantalVan(p)}
                  min={1}
                  max={max}
                  eenheid={p.eenheid}
                  label={`Aantal ${p.naam}`}
                  onChange={(n) => {
                    gekozen.current[p.product_id] = n;
                    setAantallen((huidig) => ({ ...huidig, [p.product_id]: n }));
                  }}
                />
                <Button type="button" size="sm" className="shrink-0 px-3" aria-label={`Bestellen ${p.naam}`} disabled={bezigId === p.product_id} onClick={() => bestellen(p)}>
                  Bestellen
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {bestaande && <div className="border-t border-border">{bestaande}</div>}
    </LijstKaart>
  );
}

/** Bestellen in West. Zonder vlag of zonder producten blijft de bestaande intern-kaart staan. */
export function InternBestellen({ vestiging, aan, bestaande, losseKaart }: {
  vestiging: string;
  aan: boolean;
  bestaande?: ReactNode;
  losseKaart?: ReactNode;
}) {
  const q = useInterneProducten(aan ? vestiging : null);
  const plaatsen = useInternePlaatsen();
  const producten = q.data;
  if (!aan || producten == null || producten.length === 0) return <>{losseKaart}</>;
  return (
    <InternBestelKaart
      producten={producten}
      bestaande={bestaande}
      bezigId={plaatsen.isPending ? plaatsen.variables?.productId : null}
      onBestellen={(p, aantal, sleutel) => plaatsen.mutateAsync({ productId: p.product_id, aantal, sleutel })}
    />
  );
}
