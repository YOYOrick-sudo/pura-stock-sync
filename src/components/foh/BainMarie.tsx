import { useEffect, useRef, useState } from 'react';
import { nl } from 'date-fns/locale';
import { Printer, Check, Trash2, Calendar as CalendarIcon, PackageOpen } from 'lucide-react';
import { SectieBalk } from './SectieBalk';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { buildStickerOmschrijving } from '@/lib/labelZpl';
import {
  BAIN_MARIE_PRODUCTEN,
  bakStatus,
  houdbaarheidVan,
  isoDatum,
  useBainMarieBakken,
  useBainMarieWeggegooid,
  useGooiBainMarieWeg,
  useZetBainMarieStart,
  type BainMarieBak,
  type BainMarieSleutel,
} from '@/hooks/useBainMarie';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';

type Product = (typeof BAIN_MARIE_PRODUCTEN)[number];

/** Datum met dag erbij, bv. "do 22/10". */
export function korteDatum(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dag = d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '');
  return `${dag} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function plusDagen(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDatum(d);
}

const maxVan = (bak: BainMarieBak) =>
  Math.max(Number(bak.houdbaarheid_dagen) || houdbaarheidVan(bak.product), 1);

const zakWoord = (p: Product) => (p.heeftVriesZak ? 'zak' : 'bak');

/** "Geopend za 24/10 · t/m wo 28/10" + meter + "nog 4 dagen". */
function statusRegel(bak: BainMarieBak | undefined, vandaagIso: string) {
  const s = bakStatus(bak, vandaagIso);
  if (s.status === 'geen' || !bak) {
    return <span className="text-[13px] text-muted-foreground/70">Geen bak open</span>;
  }
  const max = maxVan(bak);
  const dagNr = Math.max(1, Number(s.dagNr) || 1);
  const totIso = plusDagen(s.startDatum!, max - 1);
  const over = Math.max(0, max - dagNr);
  const pct = Math.max(0, Math.min(100, (over / max) * 100));
  const weg = s.status === 'te-oud' || s.status === 'laatste-dag';
  const tekst =
    s.status === 'te-oud'
      ? 'Over de datum'
      : s.status === 'laatste-dag'
        ? 'Vandaag laatste dag'
        : over === 1
          ? 'nog 1 dag'
          : `nog ${over} dagen`;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
      <span className="text-muted-foreground">
        Geopend <span className="font-semibold text-foreground">{korteDatum(s.startDatum!)}</span>
        {' · '}t/m <span className="font-semibold text-foreground">{korteDatum(totIso)}</span>
      </span>
      <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full', weg ? 'bg-destructive/70' : 'bg-primary/50')}
          style={{ width: `${weg ? 100 : pct}%` }}
        />
      </span>
      <span className={cn(weg ? 'font-semibold text-destructive' : 'text-muted-foreground')}>{tekst}</span>
    </span>
  );
}

const knopBasis =
  'flex shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60';
const knopNeutraal = `${knopBasis} bg-muted/60 text-foreground hover:bg-muted`;
const knopPrimair = `${knopBasis} bg-primary/10 text-primary hover:bg-primary/15`;

function Vakje({ aan, zwak }: { aan: boolean; zwak?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors sm:h-6 sm:w-6',
        aan ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
        zwak && 'opacity-40',
      )}
    >
      {aan && <Check size={14} strokeWidth={3} />}
    </span>
  );
}

/**
 * Print één bain-marie-sticker. Vangnet: dezelfde sticker (zelfde product
 * en datums) wordt binnen 15 seconden niet nog eens naar de printer gestuurd.
 */
function useBainSticker() {
  const printSticker = useCreateStickerPrintJob();
  const bezigRef = useRef<Set<string>>(new Set());
  const [bezig, setBezig] = useState<string | null>(null);

  const print = async (product: string, naam: string, startIso: string, max: number) => {
    const input = {
      type: 'bain' as const,
      naam,
      datum1: korteDatum(startIso),
      datum2: korteDatum(plusDagen(startIso, max - 1)),
    };
    const sleutel = `${product}|${input.datum1}|${input.datum2}`;
    if (bezigRef.current.has(sleutel)) return false;
    bezigRef.current.add(sleutel);
    setBezig(product);
    try {
      const grens = new Date(Date.now() - 15_000).toISOString();
      const { data: recent } = await supabase
        .from('print_jobs')
        .select('id')
        .eq('bron', 'bain_marie')
        .eq('label_omschrijving', buildStickerOmschrijving(input))
        .gte('created_at', grens)
        .limit(1);
      if (recent && recent.length > 0) return true;
      await printSticker.mutateAsync({ ...input, bron: 'bain_marie' });
      return true;
    } catch {
      return false;
    } finally {
      window.setTimeout(() => {
        bezigRef.current.delete(sleutel);
        setBezig((b) => (b === product ? null : b));
      }, 15_000);
      setBezig((b) => (b === product ? null : b));
    }
  };
  return { print, bezig };
}

/** Venster "Wanneer geopend?" → nieuwe zak/bak + direct de sticker. */
function NieuweZakDialog({
  product,
  vestiging,
  datum,
  onKlaar,
  onSluit,
}: {
  product: Product | null;
  vestiging: string;
  datum: string;
  onKlaar?: (p: Product) => void;
  onSluit: () => void;
}) {
  const zetStart = useZetBainMarieStart(vestiging);
  const { print } = useBainSticker();
  const [kalenderOpen, setKalenderOpen] = useState(false);
  const [bezig, setBezig] = useState(false);

  const kies = (iso: string) => {
    if (!product || bezig) return;
    setBezig(true);
    zetStart.mutate(
      {
        product: product.sleutel,
        productNaam: product.naam,
        startDatum: iso,
        nieuw: true,
        houdbaarheidDagen: product.houdbaarheid,
      },
      {
        onSuccess: async () => {
          await print(product.sleutel, product.naam, iso, product.houdbaarheid);
          onKlaar?.(product);
        },
        onSettled: () => {
          setBezig(false);
          onSluit();
        },
      },
    );
  };

  const opties = [
    { label: 'Vandaag', iso: datum },
    { label: 'Gisteren', iso: plusDagen(datum, -1) },
  ];

  return (
    <Dialog open={product !== null} onOpenChange={(o) => !o && onSluit()}>
      <DialogContent className="max-w-[650px] rounded-[24px]">
        {product && (
          <>
            <DialogHeader>
              <DialogTitle>Nieuwe {zakWoord(product)} {product.naam}</DialogTitle>
              <DialogDescription>
                Wanneer is de {zakWoord(product)} geopend? De sticker komt er direct uit.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {opties.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  disabled={bezig}
                  onClick={() => kies(o.iso)}
                  className={knopNeutraal}
                  style={{ minHeight: 48 }}
                >
                  {o.label} · {korteDatum(o.iso)}
                </button>
              ))}
              <Popover open={kalenderOpen} onOpenChange={setKalenderOpen}>
                <PopoverTrigger asChild>
                  <button type="button" disabled={bezig} className={knopNeutraal} style={{ minHeight: 48 }}>
                    <CalendarIcon size={15} />
                    Andere datum
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={nl}
                    weekStartsOn={1}
                    defaultMonth={new Date(`${datum}T12:00:00`)}
                    disabled={{ after: new Date(`${datum}T12:00:00`) }}
                    onSelect={(d) => {
                      if (!d) return;
                      setKalenderOpen(false);
                      kies(isoDatum(d));
                    }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {bezig && <p className="text-[13px] text-muted-foreground">Sticker wordt geprint…</p>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ochtendblok (Open-lijst West, keuken): de app weet al wanneer elke zak/bak
 * geopend is. Je ziet alleen de stand; open je een nieuwe, tik "Nieuwe zak".
 */
export function BainMarieOpen({ vestiging, datum }: { vestiging: string; datum: string }) {
  const bakken = useBainMarieBakken(vestiging).data ?? [];
  const weggegooid = useBainMarieWeggegooid(vestiging).data ?? new Map<string, BainMarieBak>();
  const [nieuwVoor, setNieuwVoor] = useState<Product | null>(null);

  const open = BAIN_MARIE_PRODUCTEN.filter((p) => bakken.some((b) => b.product === p.sleutel)).length;

  return (
    <div style={{ marginBottom: '32px' }}>
      <SectieBalk titel="Au bain-marie" stand={`${open}/${BAIN_MARIE_PRODUCTEN.length} open`} afgerond={false} />
      <div className="divide-y divide-border">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakken.find((b) => b.product === p.sleutel);
          const afgesloten = !bak ? weggegooid.get(p.sleutel) : undefined;
          return (
            <div key={p.sleutel} className="flex items-center gap-3 py-2.5" style={{ minHeight: 56 }}>
              <Vakje aan={!!bak} />
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-medium text-foreground">{p.naam}</div>
                {afgesloten ? (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
                    <Trash2 size={12} /> {afgesloten.reden === 'op' ? 'was op' : 'weggegooid'}
                  </span>
                ) : (
                  statusRegel(bak, datum)
                )}
              </div>
              <button type="button" onClick={() => setNieuwVoor(p)} className={knopNeutraal} style={{ minHeight: 44 }}>
                <PackageOpen size={15} />
                Nieuwe {zakWoord(p)}
              </button>
            </div>
          );
        })}
      </div>
      <NieuweZakDialog product={nieuwVoor} vestiging={vestiging} datum={datum} onSluit={() => setNieuwVoor(null)} />
    </div>
  );
}

/**
 * Avondblok (Sluitlijst West, keuken): controleren, niet opnieuw printen.
 * Vakje = "sticker zit erop en klopt". Nieuwe zak geopend → sticker direct.
 * Laatste dag of over de datum → Weggooien.
 */
export function BainMarieSluit({ vestiging, datum }: { vestiging: string; datum: string }) {
  const bakken = useBainMarieBakken(vestiging).data ?? [];
  const gooiWeg = useGooiBainMarieWeg(vestiging);
  const { print, bezig } = useBainSticker();

  const [bevestigWeg, setBevestigWeg] = useState<BainMarieSleutel | null>(null);
  const [nieuwVoor, setNieuwVoor] = useState<Product | null>(null);
  const [menuVoor, setMenuVoor] = useState<BainMarieSleutel | null>(null);

  const opslagSleutel = `bain-marie-gecontroleerd-${vestiging}-${datum}`;
  const [gecheckt, setGecheckt] = useState<string[]>([]);
  useEffect(() => {
    try {
      const ruw = localStorage.getItem(opslagSleutel);
      setGecheckt(ruw ? JSON.parse(ruw) : []);
    } catch {
      setGecheckt([]);
    }
  }, [opslagSleutel]);

  const zet = (product: string, aan: boolean) =>
    setGecheckt((g) => {
      const volgend = aan ? (g.includes(product) ? g : [...g, product]) : g.filter((x) => x !== product);
      try {
        localStorage.setItem(opslagSleutel, JSON.stringify(volgend));
      } catch {
        /* stille fallback */
      }
      return volgend;
    });

  const teDoen = BAIN_MARIE_PRODUCTEN.filter((p) => bakken.some((b) => b.product === p.sleutel));
  const gedaan = teDoen.filter((p) => gecheckt.includes(p.sleutel)).length;
  const afgerond = teDoen.length > 0 && gedaan === teDoen.length;
  const menuProduct = BAIN_MARIE_PRODUCTEN.find((x) => x.sleutel === menuVoor);
  const menuBak = menuProduct ? bakken.find((b) => b.product === menuProduct.sleutel) : undefined;

  return (
    <div style={{ marginBottom: '32px' }}>
      <SectieBalk
        titel="Au bain-marie — controleren"
        stand={teDoen.length === 0 ? 'geen bakken' : afgerond ? 'afgerond' : `${gedaan}/${teDoen.length}`}
        afgerond={afgerond || teDoen.length === 0}
      />
      <div className="divide-y divide-border">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakken.find((b) => b.product === p.sleutel);
          const s = bakStatus(bak, datum);
          const moetWeg = bak && (s.status === 'laatste-dag' || s.status === 'te-oud');
          const klaar = gecheckt.includes(p.sleutel);
          const bevestigt = bevestigWeg === p.sleutel;
          return (
            <div key={p.sleutel} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5" style={{ minHeight: 56 }}>
              <button
                type="button"
                disabled={!bak}
                aria-label={`${p.naam} gecontroleerd`}
                onClick={() => zet(p.sleutel, !klaar)}
                className="-m-2.5 flex items-center justify-center p-2.5"
              >
                <Vakje aan={klaar} zwak={!bak} />
              </button>
              <button
                type="button"
                disabled={!bak}
                onClick={() => setMenuVoor(p.sleutel)}
                className="min-w-0 flex-1 text-left"
                style={{ minHeight: 44 }}
              >
                <span
                  className={cn(
                    'block text-[16px] font-medium',
                    klaar ? 'text-muted-foreground line-through' : bak ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {p.naam}
                </span>
                {statusRegel(bak, datum)}
              </button>
              <div className="flex shrink-0 gap-1.5">
                {moetWeg ? (
                  <button
                    type="button"
                    disabled={gooiWeg.isPending}
                    onClick={() => {
                      if (!bevestigt) return setBevestigWeg(p.sleutel);
                      setBevestigWeg(null);
                      gooiWeg.mutate({ bak: bak! }, { onSuccess: () => zet(p.sleutel, false) });
                    }}
                    className={cn(
                      knopBasis,
                      bevestigt
                        ? 'bg-destructive text-destructive-foreground shadow-sm'
                        : 'bg-destructive/10 text-destructive hover:bg-destructive/15',
                    )}
                    style={{ minHeight: 44 }}
                  >
                    <Trash2 size={15} />
                    {bevestigt ? 'Zeker?' : 'Weggooien'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setNieuwVoor(p)}
                  className={moetWeg ? knopNeutraal : knopPrimair}
                  style={{ minHeight: 44 }}
                >
                  <PackageOpen size={15} />
                  Nieuwe {zakWoord(p)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <NieuweZakDialog
        product={nieuwVoor}
        vestiging={vestiging}
        datum={datum}
        onKlaar={(p) => zet(p.sleutel, true)}
        onSluit={() => setNieuwVoor(null)}
      />

      <Dialog open={!!menuBak} onOpenChange={(o) => !o && setMenuVoor(null)}>
        <DialogContent className="max-w-[650px] rounded-[24px]">
          {menuProduct && menuBak && (
            <>
              <DialogHeader>
                <DialogTitle>{menuProduct.naam}</DialogTitle>
                <DialogDescription>
                  Geopend {korteDatum(menuBak.start_datum)} · t/m{' '}
                  {korteDatum(plusDagen(menuBak.start_datum, maxVan(menuBak) - 1))}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={bezig === menuProduct.sleutel}
                  onClick={async () => {
                    await print(menuProduct.sleutel, menuProduct.naam, menuBak.start_datum, maxVan(menuBak));
                    setMenuVoor(null);
                  }}
                  className={`${knopNeutraal} justify-center`}
                  style={{ minHeight: 48 }}
                >
                  <Printer size={15} />
                  Sticker opnieuw printen
                </button>
                <button
                  type="button"
                  disabled={gooiWeg.isPending}
                  onClick={() =>
                    gooiWeg.mutate(
                      { bak: menuBak, reden: 'op' },
                      { onSettled: () => { zet(menuProduct.sleutel, false); setMenuVoor(null); } },
                    )
                  }
                  className={`${knopNeutraal} justify-center`}
                  style={{ minHeight: 48 }}
                >
                  {menuProduct.heeftVriesZak ? 'Zak' : 'Bak'} is op — niets over
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
