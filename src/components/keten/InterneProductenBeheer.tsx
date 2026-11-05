import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Package } from 'lucide-react';
import { foutTekst } from '@/hooks/useInterneLevering';
import {
  useInterneV2ArtikelenZoeken, useInterneV2Beheer, useInterneV2ProductOpslaan,
  type InternV2BeheerProduct, type StamArtikel,
} from '@/hooks/useInterneLeveringV2';
import { EENHEDEN } from '@/lib/interneLeveringV2';

export function InterneProductenBeheerKaart({
  producten, artikelen, zoek, gekozen, eenheid, inhoud, inhoudEenheid, max, bezig,
  onZoek, onKies, onEenheid, onInhoud, onInhoudEenheid, onMax, onOpslaan,
}: {
  producten: InternV2BeheerProduct[];
  artikelen: StamArtikel[];
  zoek: string;
  gekozen: StamArtikel | null;
  eenheid: string;
  inhoud: string;
  inhoudEenheid: string;
  max: string;
  bezig?: boolean;
  onZoek: (waarde: string) => void;
  onKies: (artikel: StamArtikel) => void;
  onEenheid: (waarde: string) => void;
  onInhoud: (waarde: string) => void;
  onInhoudEenheid: (waarde: string) => void;
  onMax: (waarde: string) => void;
  onOpslaan: () => void;
}) {
  const huidig = producten.filter((p) => p.huidige_route);
  const nieuw = producten.filter((p) => !p.huidige_route);
  return (
    <div className="space-y-4">
      <LijstKaart kop={<KaartKop icoon={Package} titel="Intern beschikbaar" />}>
        <p className="px-4 pb-1 pt-3 text-sm text-muted-foreground lg:px-6">
          Kies een artikel uit de stam. Je maakt geen nieuw artikel. Eenheid en verpakking gelden voor de bestelling van West bij Midsland.
        </p>
        <div className="space-y-3 px-4 py-3 lg:px-6">
          <Input value={zoek} onChange={(e) => onZoek(e.target.value)} aria-label="Artikel zoeken" placeholder="Zoek een bestaand artikel" className="h-11 text-base" />
          {artikelen.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-polar-lg border border-border">
              {artikelen.map((a) => (
                <button key={a.id} type="button" className="block min-h-11 w-full px-3 py-2 text-left text-base hover:bg-muted" onClick={() => onKies(a)}>
                  {a.naam}
                </button>
              ))}
            </div>
          )}
          {gekozen && (
            <div className="space-y-2 rounded-polar-lg border border-border p-3">
              <p className="font-medium text-foreground">{gekozen.naam}</p>
              <div className="flex flex-wrap items-center gap-2">
                <select value={eenheid} onChange={(e) => onEenheid(e.target.value)} aria-label="Eenheid" className="h-11 rounded-polar-lg border border-input bg-background px-2 text-base">
                  {EENHEDEN.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <Input value={inhoud} onChange={(e) => onInhoud(e.target.value)} inputMode="decimal" aria-label="Verpakkingsinhoud" placeholder="Inhoud" className="h-11 w-28 text-base" />
                <Input value={inhoudEenheid} onChange={(e) => onInhoudEenheid(e.target.value)} aria-label="Inhoud eenheid" placeholder="g, kg, st" className="h-11 w-28 text-base" />
                <Input value={max} onChange={(e) => onMax(e.target.value)} inputMode="numeric" aria-label="Maximum per bestelling" placeholder="Max" className="h-11 w-24 text-base" />
                <Button type="button" size="touch" aria-label="Intern beschikbaar maken" disabled={bezig} onClick={onOpslaan}>Beschikbaar maken</Button>
              </div>
            </div>
          )}
        </div>
      </LijstKaart>
      {huidig.length > 0 && (
        <LijstKaart kop={<KaartKop titel="Huidige route" teller={huidig.length} />}>
          <div className="divide-y divide-border">
            {huidig.map((p) => (
              <div key={p.product_id} className="flex flex-wrap items-center gap-2 px-4 py-3 lg:px-6">
                <span className="font-medium text-foreground">{p.naam}</span>
                <StatusBadge tone="neutral">al beschikbaar</StatusBadge>
                <span className="text-sm text-muted-foreground">{p.eenheid}</span>
              </div>
            ))}
          </div>
        </LijstKaart>
      )}
      {nieuw.length > 0 && (
        <LijstKaart kop={<KaartKop titel="Alleen nieuwe route" teller={nieuw.length} />}>
          <div className="divide-y divide-border">
            {nieuw.map((p) => (
              <div key={p.product_id} className="px-4 py-3 lg:px-6">
                <p className="font-medium text-foreground">{p.naam}</p>
                <p className="text-sm text-muted-foreground">{[p.eenheid, p.inhoud_per_eenheid && p.inhoud_eenheid ? `${p.inhoud_per_eenheid} ${p.inhoud_eenheid} per ${p.eenheid}` : ''].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
          </div>
        </LijstKaart>
      )}
    </div>
  );
}

export function InterneProductenBeheer({ vestiging }: { vestiging: string }) {
  const lijst = useInterneV2Beheer(vestiging);
  const opslaan = useInterneV2ProductOpslaan();
  const [zoek, setZoek] = useState('');
  const [gekozen, setGekozen] = useState<StamArtikel | null>(null);
  const [eenheid, setEenheid] = useState<string>(EENHEDEN[0]);
  const [inhoud, setInhoud] = useState('');
  const [inhoudEenheid, setInhoudEenheid] = useState('');
  const [max, setMax] = useState('');
  const artikelen = useInterneV2ArtikelenZoeken(vestiging, zoek);
  if (lijst.data == null && !lijst.isLoading) return null;

  const bewaar = async () => {
    if (!gekozen) return;
    const inhoudGetal = inhoud.trim() ? Number(inhoud.replace(',', '.')) : null;
    const maxGetal = max.trim() ? Number(max.replace(',', '.')) : null;
    try {
      const uit = await opslaan.mutateAsync({
        vestiging,
        artikelId: gekozen.id,
        eenheid,
        inhoudPerEenheid: inhoudGetal != null && Number.isFinite(inhoudGetal) ? inhoudGetal : null,
        inhoudEenheid: inhoudEenheid.trim() || null,
        max: maxGetal != null && Number.isFinite(maxGetal) ? maxGetal : null,
        beschikbaar: true,
      });
      if (uit.ongewijzigd) toast(uit.reden ?? 'Dit artikel hoort al bij de huidige route');
      else toast.success(`${gekozen.naam} is intern beschikbaar`);
      setGekozen(null);
      setZoek('');
      setInhoud('');
      setInhoudEenheid('');
      setMax('');
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

  return (
    <InterneProductenBeheerKaart
      producten={lijst.data ?? []}
      artikelen={artikelen.data ?? []}
      zoek={zoek}
      gekozen={gekozen}
      eenheid={eenheid}
      inhoud={inhoud}
      inhoudEenheid={inhoudEenheid}
      max={max}
      bezig={opslaan.isPending}
      onZoek={setZoek}
      onKies={setGekozen}
      onEenheid={setEenheid}
      onInhoud={setInhoud}
      onInhoudEenheid={setInhoudEenheid}
      onMax={setMax}
      onOpslaan={bewaar}
    />
  );
}
