import { useEffect, useState } from 'react';
import { Soup, Printer, Check, AlertTriangle } from 'lucide-react';
import {
  BAIN_MARIE_PRODUCTEN,
  bakStatus,
  dagKort,
  dagNaam,
  isoDatum,
  useBainMarieBakken,
  useZetBainMarieStart,
  type BainMarieBak,
  type BainMarieSleutel,
} from '@/hooks/useBainMarie';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';

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

function statusRegel(bak: BainMarieBak | undefined, vandaagIso: string) {
  const s = bakStatus(bak, vandaagIso);
  if (s.status === 'geen') {
    return <span className="text-[12px] italic text-muted-foreground">nog niets genoteerd</span>;
  }
  const max = Math.max(Number(bak?.houdbaarheid_dagen) || STANDAARD_HOUBAARHEID, 1);
  const basis = `bak van ${dagNaam(s.startDatum!)} · dag ${s.dagNr} van ${max} · houdbaar t/m ${dagNaam(s.houdbaarTot!)}`;
  if (s.status === 'te-oud') {
    return (
      <span className="flex items-center gap-1 text-[12px] font-semibold text-red-600">
        <AlertTriangle size={14} /> {basis} — te oud, weggooien
      </span>
    );
  }
  if (s.status === 'laatste-dag') {
    return (
      <span className="flex items-center gap-1 text-[12px] font-semibold text-amber-600">
        <AlertTriangle size={14} /> {basis} — vandaag laatste dag
      </span>
    );
  }
  return <span className="text-[12px] text-muted-foreground">{basis}</span>;
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
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <Soup size={20} className="text-primary" />
        <h3 className="text-[17px] font-bold text-foreground">
          Au bain-marie — welke datum staat op de bak?
        </h3>
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Eén tik per product. Vandaag een nieuwe zak? Dan “Vandaag (nieuw)”.
        Niets tikken = vandaag geen bak.
      </p>

      <div className="space-y-3">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakVan(p.sleutel);
          return (
            <div key={p.sleutel} className="rounded-[14px] border border-border bg-muted/40 p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-bold text-foreground">{p.naam}</span>
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
                          : offset === 0
                            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                      style={{ minHeight: 44, minWidth: 44 }}
                    >
                      {offset === 0 ? 'Vandaag (nieuw)' : dagKort(iso)}
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
    <div className="rounded-[18px] border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2">
        <Printer size={20} className="text-primary" />
        <h3 className="text-[17px] font-bold text-foreground">Au bain-marie — sticker printen</h3>
      </div>
      <p className="mb-3 text-[12px] text-muted-foreground">
        Sticker op de plastic bak plakken (koeling). De datum zet de app er zelf op.
      </p>

      <div className="space-y-2">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakken.find((b) => b.product === p.sleutel);
          const s = bakStatus(bak, datum);
          const kanPrinten = bak && s.startDatum && s.status !== 'te-oud';
          const klaar = geprint.includes(p.sleutel);
          return (
            <div
              key={p.sleutel}
              className={`flex items-center gap-3 rounded-[14px] border px-3 py-2.5 ${
                klaar ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40'
              }`}
              style={{ minHeight: 56 }}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  klaar ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
                }`}
              >
                {klaar ? <Check size={16} /> : <Soup size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-foreground">{p.naam}</span>
                {statusRegel(bak, datum)}
              </span>
              {kanPrinten ? (
                <button
                  type="button"
                  disabled={printSticker.isPending}
                  onClick={() => print(bak!)}
                  className="shrink-0 rounded-[12px] border border-primary/40 bg-primary/10 px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                  style={{ minHeight: 44 }}
                >
                  {klaar ? 'Opnieuw printen' : 'Sticker printen'}
                </button>
              ) : (
                <span className="shrink-0 text-[12px] italic text-muted-foreground">
                  {s.status === 'te-oud' ? 'eerst weggooien' : 'geen sticker'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
