import { useEffect, useState } from 'react';
import { Soup, Printer, Check, AlertTriangle } from 'lucide-react';
import {
  BAIN_MARIE_PRODUCTEN,
  bakStatus,
  dagKort,
  isoDatum,
  useBainMarieBakken,
  useZetBainMarieStart,
  type BainMarieBak,
  type BainMarieSleutel,
} from '@/hooks/useBainMarie';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';
import { InfoKnop } from './InfoKnop';

/** Datum op de sticker, zelfde formaat als de bestaande keukenstickers: "do 17/09". */
function stickerDatum(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '');
}

/** Hoeveel dagen een bak standaard meegaat (per product overschrijfbaar in de database). */
const STANDAARD_HOUBAARHEID = 5;

/** Korte status als rustig chipje: "ma · dag 5/5". Alleen laatste dag en te oud springen eruit. */
function statusRegel(bak: BainMarieBak | undefined, vandaagIso: string) {
  const s = bakStatus(bak, vandaagIso);
  if (s.status === 'geen') {
    return <span className="text-[12px] text-muted-foreground/70">—</span>;
  }
  const max = Math.max(Number(bak?.houdbaarheid_dagen) || STANDAARD_HOUBAARHEID, 1);
  const basis = `${dagKort(s.startDatum!)} · dag ${s.dagNr}/${max}`;
  const chip = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold';
  if (s.status === 'te-oud') {
    return (
      <span className={`${chip} bg-destructive/10 text-destructive`}>
        <AlertTriangle size={12} /> {basis} · weggooien
      </span>
    );
  }
  if (s.status === 'laatste-dag') {
    return (
      <span className={`${chip} bg-amber-500/10 text-amber-700 dark:text-amber-400`}>
        <AlertTriangle size={12} /> {basis} · laatste dag
      </span>
    );
  }
  return <span className={`${chip} bg-muted text-muted-foreground`}>{basis}</span>;
}

/** Sectiekop in de stijl van de takenlijst: klein, rustig, met info-icoon. */
function Kop({
  icoon: Icoon,
  titel,
  uitleg,
}: {
  icoon: typeof Soup;
  titel: string;
  uitleg: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icoon size={16} className="text-primary" />
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {titel}
      </h3>
      <InfoKnop tekst={uitleg} label={`Uitleg ${titel}`} />
    </div>
  );
}

/**
 * Ochtendblok (Open-lijst West, keuken): noteer per product welke datum op de
 * bak staat. Eén tik, geen typen. Niets tikken = vandaag geen bak.
 */
export function BainMarieOpen({ vestiging, datum }: { vestiging: string; datum: string }) {
  const bakkenQuery = useBainMarieBakken(vestiging);
  const zetStart = useZetBainMarieStart(vestiging);
  const bakken = bakkenQuery.data ?? [];

  const bakVan = (sleutel: BainMarieSleutel) => bakken.find((b) => b.product === sleutel);

  /** Dagnaam-knoppen: vandaag + de 4 dagen ervoor (leesbaar van de sticker). */
  const dagOpties = Array.from({ length: 5 }, (_, offset) => {
    const d = new Date(`${datum}T12:00:00`);
    d.setDate(d.getDate() - offset);
    return { offset, iso: isoDatum(d) };
  });

  return (
    <div className="py-2">
      <Kop
        icoon={Soup}
        titel="Au bain-marie"
        uitleg="Noteer per product welke datum op de bak staat. Nieuwe bak vandaag? Tik “Vandaag”. Niets tikken = vandaag geen bak. Een bak gaat maximaal 5 dagen mee."
      />

      <div className="divide-y divide-border">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakVan(p.sleutel);
          return (
            <div key={p.sleutel} className="py-2.5">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold text-foreground">{p.naam}</span>
                {statusRegel(bak, datum)}
              </div>
              <div className="flex flex-wrap gap-2">
                {dagOpties.map(({ offset, iso }) => {
                  const gekozen = bak?.start_datum === iso;
                  return (
                    <button
                      key={offset}
                      type="button"
                      disabled={zetStart.isPending}
                      onClick={() =>
                        zetStart.mutate({
                          product: p.sleutel,
                          productNaam: p.naam,
                          startDatum: iso,
                          nieuw: offset === 0,
                          houdbaarheidDagen:
                            Number(bak?.houdbaarheid_dagen) || STANDAARD_HOUBAARHEID,
                        })
                      }
                      className={`rounded-[12px] border px-3 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                        gekozen
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                      style={{ minHeight: 44, minWidth: 44 }}
                    >
                      {offset === 0 ? 'Vandaag' : dagKort(iso)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Avondblok (Sluitlijst West, keuken): print de sticker voor de plastic
 * koelbak. De app zet de juiste startdatum erop — de afsluiter hoeft de
 * datum niet te weten, hij plakt hem alleen op de bak.
 */
export function BainMarieSluit({ vestiging, datum }: { vestiging: string; datum: string }) {
  const bakkenQuery = useBainMarieBakken(vestiging);
  const printSticker = useCreateStickerPrintJob();
  const bakken = bakkenQuery.data ?? [];

  const opslagSleutel = `bain-marie-geprint-${vestiging}-${datum}`;
  const [geprint, setGeprint] = useState<string[]>([]);
  useEffect(() => {
    try {
      const ruw = localStorage.getItem(opslagSleutel);
      if (ruw) setGeprint(JSON.parse(ruw));
    } catch {
      /* stille fallback */
    }
  }, [opslagSleutel]);

  const markeerGeprint = (product: string) => {
    setGeprint((g) => {
      const volgend = g.includes(product) ? g : [...g, product];
      try {
        localStorage.setItem(opslagSleutel, JSON.stringify(volgend));
      } catch {
        /* stille fallback */
      }
      return volgend;
    });
  };

  const print = (bak: BainMarieBak) => {
    const s = bakStatus(bak, datum);
    if (!s.startDatum || !s.houdbaarTot) return;
    printSticker.mutate(
      {
        type: 'bain',
        naam: bak.product_naam,
        datum1: stickerDatum(s.startDatum),
        datum2: stickerDatum(s.houdbaarTot),
        bron: 'bain_marie',
      },
      { onSuccess: () => markeerGeprint(bak.product) },
    );
  };

  return (
    <div className="py-2">
      <Kop
        icoon={Printer}
        titel="Au bain-marie — sticker printen"
        uitleg="Print per product een sticker en plak hem op de plastic bak in de koeling. De app zet de startdatum en houdbaar-tot er zelf op, zodat de volgende dienst weet van welke dag de bak is."
      />

      <div className="divide-y divide-border">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakken.find((b) => b.product === p.sleutel);
          const s = bakStatus(bak, datum);
          const kanPrinten = bak && s.startDatum && s.status !== 'te-oud';
          const klaar = geprint.includes(p.sleutel);
          return (
            <div key={p.sleutel} className="flex items-center gap-3 py-2.5" style={{ minHeight: 52 }}>
              {klaar && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check size={14} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground">{p.naam}</span>
                {statusRegel(bak, datum)}
              </span>
              {kanPrinten ? (
                <button
                  type="button"
                  disabled={printSticker.isPending}
                  onClick={() => print(bak!)}
                  className="shrink-0 rounded-[12px] border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  style={{ minHeight: 44 }}
                >
                  {klaar ? 'Opnieuw' : 'Sticker'}
                </button>
              ) : (
                <span className="shrink-0 text-[12px] text-muted-foreground">
                  {s.status === 'te-oud' ? 'weggooien' : 'geen sticker'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
