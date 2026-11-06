import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Package } from 'lucide-react';
import { STAM_INHOUD_EENHEDEN, STAM_VORM_EENHEDEN } from '@/components/kitchen/bestelbord/verpakking';
import { foutTekst, inhoudPerEenheid } from '@/hooks/useInterneLevering';
import { useIsEigenaar } from '@/hooks/useIsEigenaar';
import {
  useInterneV2ArtikelenZoeken, useInterneV2Beheer, useInterneV2ProductOpslaan, useInterneVormOpslaan,
  type InternV2BeheerProduct, type StamArtikel,
} from '@/hooks/useInterneLeveringV2';
import { EENHEDEN } from '@/lib/interneLeveringV2';

export function InterneProductenBeheerKaart({
  producten, artikelen, zoek, gekozen, eenheid, inhoud, inhoudEenheid,   max, bezig, bewerken,
  onZoek, onKies, onEenheid, onInhoud, onInhoudEenheid, onMax, onOpslaan, onBewerk,
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
  bewerken?: boolean;
  onBewerk?: (product: InternV2BeheerProduct) => void;
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
              <ProductRij key={p.product_id} product={p} bewerken={bewerken} onBewerk={onBewerk} />
            ))}
          </div>
        </LijstKaart>
      )}
      {nieuw.length > 0 && (
        <LijstKaart kop={<KaartKop titel="Alleen nieuwe route" teller={nieuw.length} />}>
          <div className="divide-y divide-border">
            {nieuw.map((p) => (
              <ProductRij key={p.product_id} product={p} bewerken={bewerken} onBewerk={onBewerk} />
            ))}
          </div>
        </LijstKaart>
      )}
    </div>
  );
}

function ProductRij({ product: p, bewerken, onBewerk }: { product: InternV2BeheerProduct; bewerken?: boolean; onBewerk?: (product: InternV2BeheerProduct) => void }) {
  const per = inhoudPerEenheid(p.inhoud_per_eenheid, p.inhoud_eenheid, p.eenheid);
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 lg:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{p.naam}</span>
          {p.huidige_route && <StatusBadge tone="neutral">al beschikbaar</StatusBadge>}
        </div>
        <p className="text-sm text-muted-foreground">{[p.eenheid, per].filter(Boolean).join(' · ')}</p>
      </div>
      {bewerken && onBewerk && <Button type="button" variant="outline" size="sm" aria-label={`Bewerken ${p.naam}`} onClick={() => onBewerk(p)}>Bewerken</Button>}
    </div>
  );
}

function zitErin(lijst: readonly string[], waarde: string) {
  return lijst.includes(waarde);
}

function VormFormulier({ product, bezig, onOpslaan }: {
  product: InternV2BeheerProduct;
  bezig?: boolean;
  onOpslaan: (eenheid: string, inhoud: string, inhoudEenheid: string) => void;
}) {
  const startEenheid = product.eenheid || STAM_VORM_EENHEDEN[0];
  const [eenheid, setEenheid] = useState(startEenheid);
  const [inhoud, setInhoud] = useState(product.inhoud_per_eenheid == null ? '' : String(product.inhoud_per_eenheid).replace('.', ','));
  const [inhoudEenheid, setInhoudEenheid] = useState(product.inhoud_eenheid && zitErin(STAM_INHOUD_EENHEDEN, product.inhoud_eenheid) ? product.inhoud_eenheid : STAM_INHOUD_EENHEDEN[0]);
  const getal = inhoud.trim() ? Number(inhoud.replace(',', '.')) : null;
  const voorbeeld = getal != null && Number.isFinite(getal) ? inhoudPerEenheid(getal, inhoudEenheid, eenheid) : null;
  const eenheden = zitErin(STAM_VORM_EENHEDEN, eenheid) ? STAM_VORM_EENHEDEN : [eenheid, ...STAM_VORM_EENHEDEN];
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-left text-[16px]">{product.naam}</DialogTitle>
        <DialogDescription className="text-left text-[13px]">Eenheid en inhoud horen bij de artikelstam. Gram vanaf 1000 wordt als kilogram getoond.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <label className="block space-y-1 text-sm font-medium">Eenheid
          <select value={eenheid} onChange={(e) => setEenheid(e.target.value)} aria-label="Eenheid van de verpakking" className="h-11 w-full rounded-polar-lg border border-input bg-background px-2 text-base font-normal">
            {eenheden.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <label className="block min-w-[8rem] flex-1 space-y-1 text-sm font-medium">Inhoud
            <Input value={inhoud} onChange={(e) => setInhoud(e.target.value)} inputMode="decimal" aria-label="Inhoud" placeholder="leeg laten mag" className="h-11 text-base font-normal" />
          </label>
          <label className="block w-28 space-y-1 text-sm font-medium">Inhoud-eenheid
            <select value={inhoudEenheid} onChange={(e) => setInhoudEenheid(e.target.value)} aria-label="Inhoud-eenheid" className="h-11 w-full rounded-polar-lg border border-input bg-background px-2 text-base font-normal">
              {STAM_INHOUD_EENHEDEN.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
        </div>
        {voorbeeld && <p className="text-sm text-muted-foreground">Op het bord: {voorbeeld}</p>}
        <Button type="button" className="h-11" disabled={bezig} onClick={() => onOpslaan(eenheid, inhoud, inhoudEenheid)}>Opslaan</Button>
      </div>
    </>
  );
}

function VormDialog({ product, bezig, onSluit, onOpslaan }: {
  product: InternV2BeheerProduct | null;
  bezig?: boolean;
  onSluit: () => void;
  onOpslaan: (eenheid: string, inhoud: string, inhoudEenheid: string) => void;
}) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) onSluit(); }}>
      <DialogContent className="max-w-[650px]">
        {product && <VormFormulier key={product.product_id} product={product} bezig={bezig} onOpslaan={onOpslaan} />}
      </DialogContent>
    </Dialog>
  );
}

export function InterneProductenBeheer({ vestiging }: { vestiging: string }) {
  const lijst = useInterneV2Beheer(vestiging);
  const opslaan = useInterneV2ProductOpslaan();
  const vormOpslaan = useInterneVormOpslaan();
  const eigenaar = useIsEigenaar();
  const [bewerk, setBewerk] = useState<InternV2BeheerProduct | null>(null);
  const [zoek, setZoek] = useState('');
  const [gekozen, setGekozen] = useState<StamArtikel | null>(null);
  const [eenheid, setEenheid] = useState<string>(EENHEDEN[0]);
  const [inhoud, setInhoud] = useState('');
  const [inhoudEenheid, setInhoudEenheid] = useState('');
  const [max, setMax] = useState('');
  const artikelen = useInterneV2ArtikelenZoeken(vestiging, zoek);
  if (lijst.data == null && !lijst.isLoading) return null;

  const bewaarVorm = async (vormEenheid: string, vormInhoud: string, vormInhoudEenheid: string) => {
    if (!bewerk) return;
    const inhoudGetal = vormInhoud.trim() ? Number(vormInhoud.replace(',', '.')) : null;
    if (vormInhoud.trim() && (inhoudGetal == null || !Number.isFinite(inhoudGetal))) {
      toast.error('Vul een getal in voor de inhoud');
      return;
    }
    try {
      await vormOpslaan.mutateAsync({
        productId: bewerk.product_id,
        eenheid: vormEenheid,
        inhoud: inhoudGetal,
        inhoudEenheid: inhoudGetal == null ? null : vormInhoudEenheid,
      });
      toast.success(`${bewerk.naam} staat in de artikelstam`);
      setBewerk(null);
    } catch (e) {
      toast.error(foutTekst(e));
    }
  };

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
    <>
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
        bewerken={eigenaar}
        onZoek={setZoek}
        onKies={setGekozen}
        onEenheid={setEenheid}
        onInhoud={setInhoud}
        onInhoudEenheid={setInhoudEenheid}
        onMax={setMax}
        onOpslaan={bewaar}
        onBewerk={setBewerk}
      />
      <VormDialog product={eigenaar ? bewerk : null} bezig={vormOpslaan.isPending} onSluit={() => setBewerk(null)} onOpslaan={bewaarVorm} />
    </>
  );
}
