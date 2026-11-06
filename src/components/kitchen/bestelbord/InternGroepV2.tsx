import { useRef, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMeta } from '@/components/pura/lijst';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { useFase2VlagAan } from '@/hooks/useOntvangstV2';
import { foutTekst, inhoudPerEenheid, klemAantal, alsGetal } from '@/hooks/useInterneLevering';
import { useInterneV2Aanvragen, useInterneV2Plaatsen, useInterneV2Producten, type InternV2Product } from '@/hooks/useInterneLeveringV2';
import {
  aantalRegel, EENHEDEN, GROEP_TITEL, INTERNE_LEVERING_V2, leverdagTekst, openRestant, statusWeergave,
  v2BordZichtbaar, vandaagAmsterdam, type Aanvraag,
} from '@/lib/interneLeveringV2';
import { getal } from '@/lib/hoeveelheid';

export type LosseInternRegel = { id: string; naam: string; aantal: number; eenheid: string };

function maxVan(p: InternV2Product) {
  const n = alsGetal(p.max_per_bestelling);
  return n != null && n >= 1 ? n : null;
}

export function InternGroepV2Kaart({
  producten, aanvragen, losse, vandaag, bezig, onBestellen, onVrij, onDoorzetten,
}: {
  producten: InternV2Product[];
  aanvragen: Aanvraag[];
  losse: LosseInternRegel[];
  vandaag: string;
  bezig?: boolean;
  onBestellen: (product: InternV2Product, aantal: number, sleutel: string, gewenste: string | null) => Promise<unknown>;
  onVrij: (naam: string, aantal: number, eenheid: string, sleutel: string, gewenste: string | null) => Promise<unknown>;
  onDoorzetten: (regel: LosseInternRegel) => Promise<unknown>;
}) {
  const [aantallen, setAantallen] = useState<Record<string, number>>({});
  const [dagen, setDagen] = useState<Record<string, string>>({});
  const sleutels = useRef(new Map<string, string>());
  const [vrijNaam, setVrijNaam] = useState('');
  const [vrijAantal, setVrijAantal] = useState(1);
  const [vrijEenheid, setVrijEenheid] = useState<string>(EENHEDEN[0]);
  const [vrijDag, setVrijDag] = useState('');
  const vrijSleutel = useRef(crypto.randomUUID());
  const open = aanvragen.filter((a) => openRestant(a) > 0);

  const sleutelVoor = (id: string) => {
    let sleutel = sleutels.current.get(id);
    if (!sleutel) {
      sleutel = crypto.randomUUID();
      sleutels.current.set(id, sleutel);
    }
    return sleutel;
  };

  const bestellen = async (p: InternV2Product) => {
    const sleutel = sleutelVoor(p.product_id);
    const aantal = aantallen[p.product_id] ?? klemAantal(1, 1, maxVan(p));
    try {
      await onBestellen(p, aantal, sleutel, dagen[p.product_id] || null);
      sleutels.current.delete(p.product_id);
      setAantallen((h) => ({ ...h, [p.product_id]: 1 }));
      toast.success(`${p.naam} is besteld bij Midsland`);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  const vrijBestellen = async () => {
    try {
      await onVrij(vrijNaam, vrijAantal, vrijEenheid, vrijSleutel.current, vrijDag || null);
      vrijSleutel.current = crypto.randomUUID();
      setVrijNaam('');
      setVrijAantal(1);
      setVrijDag('');
      toast.success('De naam staat ter controle bij Midsland');
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  return (
    <LijstKaart kop={<KaartKop icoon={Warehouse} titel={GROEP_TITEL} teller={producten.length + open.length} />}>
      <p className="px-4 pb-1 pt-3 text-sm text-muted-foreground lg:px-6">
        Alles wat je hier bestelt, gaat naar Midsland. Een vrije naam controleren ze eerst.
      </p>
      <div className="divide-y divide-border">
        {producten.map((p) => {
          const per = inhoudPerEenheid(p.inhoud_per_eenheid, p.inhoud_eenheid, p.eenheid);
          const max = maxVan(p);
          return (
            <div key={p.product_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 lg:px-6">
              <div className="min-w-[8rem] flex-1">
                <div className="flex min-h-11 min-w-0 flex-wrap items-center gap-1.5">
                  <span className="min-w-0 break-words font-medium text-foreground">{p.naam}</span>
                  {p.open_aantal > 0 && <StatusBadge tone="info" className="px-2 py-0.5">{`${getal(p.open_aantal)} onderweg`}</StatusBadge>}
                </div>
                {per && <RijMeta altijd>{per}</RijMeta>}
              </div>
              <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
                <AantalStapper
                  compact
                  waarde={aantallen[p.product_id] ?? klemAantal(1, 1, max)}
                  min={1}
                  max={max}
                  eenheid={p.eenheid}
                  label={`Aantal ${p.naam}`}
                  onChange={(n) => setAantallen((h) => ({ ...h, [p.product_id]: n }))}
                />
                <Input
                  type="date"
                  value={dagen[p.product_id] ?? ''}
                  min={vandaag}
                  onChange={(e) => setDagen((h) => ({ ...h, [p.product_id]: e.target.value }))}
                  aria-label={`Gewenste leverdag ${p.naam}`}
                  className="h-9 w-[9.5rem] text-sm"
                />
                <Button type="button" size="sm" className="shrink-0 px-3" aria-label={`Bestellen ${p.naam}`} disabled={bezig} onClick={() => bestellen(p)}>
                  Bestellen
                </Button>
              </div>
            </div>
          );
        })}
        <div className="space-y-2 px-4 py-3 lg:px-6">
          <p className="font-medium text-foreground">Iets anders</p>
          <p className="text-xs text-muted-foreground">Typ de naam. Midsland koppelt die aan een bestaand artikel voor ze het maken of meegeven.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={vrijNaam} onChange={(e) => setVrijNaam(e.target.value)} aria-label="Vrije naam" placeholder="Naam" className="h-11 min-w-[10rem] flex-1 text-base" />
            <AantalStapper compact waarde={vrijAantal} min={1} max={null} eenheid={vrijEenheid} label="Aantal vrije naam" onChange={setVrijAantal} />
            <select
              value={vrijEenheid}
              onChange={(e) => setVrijEenheid(e.target.value)}
              aria-label="Eenheid vrije naam"
              className="h-11 rounded-polar-lg border border-input bg-background px-2 text-base"
            >
              {EENHEDEN.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <Input type="date" value={vrijDag} min={vandaag} onChange={(e) => setVrijDag(e.target.value)} aria-label="Gewenste leverdag vrije naam" className="h-11 w-[11rem] text-base" />
            <Button type="button" size="sm" className="shrink-0 px-3" aria-label="Vrije naam bestellen" disabled={bezig} onClick={vrijBestellen}>Bestellen</Button>
          </div>
        </div>
      </div>
      {open.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          {open.map((a) => {
            const status = statusWeergave(a, vandaag);
            return (
              <div key={a.id} className="space-y-1 px-4 py-3 lg:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{a.naam}</span>
                  <StatusBadge tone={status.toon}>{status.label}</StatusBadge>
                  {status.nieuw && <StatusBadge tone="brand">Nieuw</StatusBadge>}
                  {status.verstreken && <StatusBadge tone="warning">Levermoment verstreken</StatusBadge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[aantalRegel(a), a.verwachte_leverdag ? `leverdag ${leverdagTekst(a.verwachte_leverdag)}` : a.gewenste_leverdag ? `gewenst ${leverdagTekst(a.gewenste_leverdag)}` : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
            );
          })}
        </div>
      )}
      {losse.length > 0 && (
        <div className="divide-y divide-border border-t border-border">
          <p className="px-4 pb-1 pt-3 text-sm text-muted-foreground lg:px-6">Deze regels staan nog los op het bord. Zet ze door, dan gaan ze naar Midsland.</p>
          {losse.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-3 lg:px-6">
              <span className="min-w-0 flex-1 font-medium text-foreground">{r.naam}</span>
              <span className="text-sm text-muted-foreground">{getal(r.aantal)} {r.eenheid}</span>
              <Button type="button" size="sm" variant="outline" className="shrink-0 px-3" aria-label={`Doorzetten ${r.naam}`} disabled={bezig} onClick={() => onDoorzetten(r).catch((e) => toast.error(foutTekst(e)))}>
                Doorzetten
              </Button>
            </div>
          ))}
        </div>
      )}
    </LijstKaart>
  );
}

/** Eén groep op het bestelbord. Zonder vlag rendert hij niets en doet hij geen aanvraag. */
export function InternGroepV2({ vestiging, losse = [], onLosseWeg }: {
  vestiging: string;
  losse?: LosseInternRegel[];
  onLosseWeg?: (id: string) => void;
}) {
  const vlag = useFase2VlagAan(vestiging || null, INTERNE_LEVERING_V2);
  const zichtbaar = v2BordZichtbaar(vestiging, vlag);
  const producten = useInterneV2Producten(zichtbaar ? vestiging : null);
  const aanvragen = useInterneV2Aanvragen(zichtbaar ? vestiging : null, 'bord');
  const plaatsen = useInterneV2Plaatsen();
  if (!zichtbaar || producten.data == null) return null;
  return (
    <InternGroepV2Kaart
      producten={producten.data}
      aanvragen={aanvragen.data ?? []}
      losse={losse}
      vandaag={vandaagAmsterdam()}
      bezig={plaatsen.isPending}
      onBestellen={(p, aantal, sleutel, gewenste) => plaatsen.mutateAsync({
        vestiging, productId: p.product_id, aantal, sleutel, gewensteLeverdag: gewenste,
      })}
      onVrij={(naam, aantal, eenheid, sleutel, gewenste) => plaatsen.mutateAsync({
        vestiging, vrijeNaam: naam, aantal, eenheid, sleutel, gewensteLeverdag: gewenste,
      })}
      onDoorzetten={async (regel) => {
        await plaatsen.mutateAsync({
          vestiging, vrijeNaam: regel.naam, aantal: regel.aantal, eenheid: regel.eenheid, sleutel: `bord:${regel.id}`,
        });
        onLosseWeg?.(regel.id);
        toast.success(`${regel.naam} staat bij Midsland ter controle`);
      }}
    />
  );
}
