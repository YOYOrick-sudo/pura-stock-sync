import { useRef, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMeta } from '@/components/pura/lijst';
import { Badge } from '@/components/ui/badge';
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
      <p className="px-4 py-2 text-sm text-muted-foreground lg:px-6">
        Alles wat je hier bestelt, gaat naar Midsland. Een vrije naam controleren ze eerst.
      </p>
      <div>
        {producten.map((p) => {
          const per = inhoudPerEenheid(p.inhoud_per_eenheid, p.inhoud_eenheid, p.eenheid);
          const max = maxVan(p);
          return (
            <div key={p.product_id} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 last:border-0 lg:px-6">
              <div className="min-w-0 flex-1 basis-full sm:basis-0">
                <div className="flex min-h-6 min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{p.naam}</span>
                  {p.open_aantal > 0 && <Badge variant="info" className="shrink-0 whitespace-nowrap font-medium">{`${getal(p.open_aantal)} onderweg`}</Badge>}
                </div>
                <RijMeta altijd>{per || '—'}</RijMeta>
              </div>
              <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
                <AantalStapper
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
                  className="h-11 w-[11rem] shrink-0 text-base"
                />
                <Button type="button" size="touch" variant="outline" className="shrink-0" aria-label={`Bestellen ${p.naam}`} disabled={bezig} onClick={() => bestellen(p)}>
                  Bestellen
                </Button>
              </div>
            </div>
          );
        })}
        <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 last:border-0 lg:px-6">
          <div className="min-w-0 flex-1 basis-full">
            <p className="truncate text-sm font-medium text-foreground">Iets anders</p>
            <RijMeta altijd>Typ de naam. Midsland koppelt die aan een bestaand artikel voor ze het maken of meegeven.</RijMeta>
          </div>
          <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
            <Input value={vrijNaam} onChange={(e) => setVrijNaam(e.target.value)} aria-label="Vrije naam" placeholder="Naam" className="h-11 min-w-[10rem] flex-1 text-base" />
            <AantalStapper waarde={vrijAantal} min={1} max={null} eenheid={vrijEenheid} label="Aantal vrije naam" onChange={setVrijAantal} />
            <select
              value={vrijEenheid}
              onChange={(e) => setVrijEenheid(e.target.value)}
              aria-label="Eenheid vrije naam"
              className="h-11 shrink-0 rounded-polar-lg border border-input bg-background px-2 text-base"
            >
              {EENHEDEN.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <Input type="date" value={vrijDag} min={vandaag} onChange={(e) => setVrijDag(e.target.value)} aria-label="Gewenste leverdag vrije naam" className="h-11 w-[11rem] shrink-0 text-base" />
            <Button type="button" size="touch" variant="outline" className="shrink-0" aria-label="Vrije naam bestellen" disabled={bezig} onClick={vrijBestellen}>Bestellen</Button>
          </div>
        </div>
      </div>
      {open.length > 0 && (
        <div className="border-t border-border">
          {open.map((a) => {
            const status = statusWeergave(a, vandaag);
            const toon = status.toon === 'success' ? 'success' : status.toon === 'warning' ? 'warning' : status.toon === 'neutral' ? 'secondary' : 'info';
            const extra = [status.nieuw ? 'Nieuw' : '', status.verstreken ? 'Levermoment verstreken' : ''].filter(Boolean).join(' · ');
            return (
              <div key={a.id} className="flex min-h-12 items-center gap-3 border-b border-border px-4 py-2 last:border-0 lg:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex min-h-6 min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">{a.naam}</span>
                    <Badge variant={toon} className="shrink-0 whitespace-nowrap font-medium">{status.label}</Badge>
                  </div>
                  <RijMeta altijd>{[aantalRegel(a), a.verwachte_leverdag ? `leverdag ${leverdagTekst(a.verwachte_leverdag)}` : a.gewenste_leverdag ? `gewenst ${leverdagTekst(a.gewenste_leverdag)}` : '', extra].filter(Boolean).join(' · ')}</RijMeta>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {losse.length > 0 && (
        <div className="border-t border-border">
          <p className="px-4 py-2 text-sm text-muted-foreground lg:px-6">Deze regels staan nog los op het bord. Zet ze door, dan gaan ze naar Midsland.</p>
          {losse.map((r) => (
            <div key={r.id} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 last:border-0 lg:px-6">
              <div className="min-w-0 flex-1 basis-full sm:basis-0">
                <span className="block truncate text-sm font-medium text-foreground">{r.naam}</span>
                <RijMeta altijd>{getal(r.aantal)} {r.eenheid}</RijMeta>
              </div>
              <Button type="button" size="touch" variant="outline" className="ml-auto shrink-0" aria-label={`Doorzetten ${r.naam}`} disabled={bezig} onClick={() => onDoorzetten(r).catch((e) => toast.error(foutTekst(e)))}>
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
