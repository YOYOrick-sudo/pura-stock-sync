import { useEffect, useState } from 'react';
import { nl } from 'date-fns/locale';
import {
  Soup,
  Printer,
  Check,
  AlertTriangle,
  Trash2,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  BAIN_MARIE_PRODUCTEN,
  bakStatus,
  dagKort,
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
import { InfoKnop } from './InfoKnop';

/** Datum op de sticker, zelfde formaat als de bestaande keukenstickers: "do 17/09". */
function stickerDatum(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '');
}

/** Korte status als rustig chipje: "ma · dag 5/6". Alleen laatste dag en te oud springen eruit. */
function statusRegel(bak: BainMarieBak | undefined, vandaagIso: string) {
  const s = bakStatus(bak, vandaagIso);
  if (s.status === 'geen') {
    return <span className="text-[12px] text-muted-foreground/70">—</span>;
  }
  const max = Math.max(Number(bak?.houdbaarheid_dagen) || houdbaarheidVan(bak!.product), 1);
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

/** Sectiebalk in dezelfde vorm als de voorraadronde: icoonbol, titel, stand, pijltje. */
function SectieBalk({
  icoon: Icoon,
  titel,
  stand,
  afgerond,
  open,
  onToggle,
}: {
  icoon: typeof Soup;
  titel: string;
  stand: string;
  afgerond: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors ${
        afgerond ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted'
      }`}
      style={{ minHeight: 52 }}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          afgerond ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
        }`}
      >
        {afgerond ? <Check size={16} /> : <Icoon size={16} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-foreground">{titel}</span>
        <span className="block text-[12px] text-muted-foreground">{stand}</span>
      </span>
      <ChevronDown
        size={20}
        className={`ml-auto shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

/** Info-icoon boven de lijst, zodat de balk zelf rustig blijft. */
function Uitleg({ titel, tekst }: { titel: string; tekst: string }) {
  return (
    <div className="mb-1 mt-2 flex items-center gap-2">
      <span className="text-[12px] text-muted-foreground">Hoe werkt dit?</span>
      <InfoKnop tekst={tekst} label={`Uitleg ${titel}`} />
    </div>
  );
}

const dagKnopBasis =
  'rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60';
const dagKnopStijl = (gekozen: boolean) =>
  gekozen
    ? `${dagKnopBasis} bg-primary text-primary-foreground shadow-sm`
    : `${dagKnopBasis} bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground`;

/**
 * Ochtendblok (Open-lijst West, keuken): noteer per product welke datum op de
 * bak staat. Eén tik, geen typen. Niets tikken = vandaag geen bak.
 * Bij "Vandaag (nieuw)" op een zak-product volgt één extra vraag: de datum
 * op de ontdooi-sticker van de zak.
 */
export function BainMarieOpen({ vestiging, datum }: { vestiging: string; datum: string }) {
  const bakkenQuery = useBainMarieBakken(vestiging);
  const weggegooidQuery = useBainMarieWeggegooid(vestiging);
  const zetStart = useZetBainMarieStart(vestiging);
  const bakken = bakkenQuery.data ?? [];
  const weggegooid = weggegooidQuery.data ?? new Map<string, BainMarieBak>();

  /** Product waarvan de zak-datum nog gevraagd moet worden (na tik op "Vandaag"). */
  const [zakVraag, setZakVraag] = useState<BainMarieSleutel | null>(null);
  /** Product waarvan de kalender openstaat. */
  const [kalenderVoor, setKalenderVoor] = useState<BainMarieSleutel | null>(null);

  const bakVan = (sleutel: BainMarieSleutel) => bakken.find((b) => b.product === sleutel);

  /** Dagnaam-knoppen: vandaag + de 4 dagen ervoor (leesbaar van de sticker). */
  const dagOpties = Array.from({ length: 5 }, (_, offset) => {
    const d = new Date(`${datum}T12:00:00`);
    d.setDate(d.getDate() - offset);
    return { offset, iso: isoDatum(d) };
  });

  /** Snelknoppen voor de zak: de drie gevallen die het vaakst voorkomen. */
  const zakOpties = [
    { offset: 0, label: 'Vandaag' },
    { offset: 1, label: 'Gisteren' },
    { offset: 2, label: 'Eergisteren' },
  ].map(({ offset, label }) => {
    const d = new Date(`${datum}T12:00:00`);
    d.setDate(d.getDate() - offset);
    return { offset, label, iso: isoDatum(d) };
  });


  const startNieuw = (p: (typeof BAIN_MARIE_PRODUCTEN)[number], ontdooidDatum: string | null) => {
    zetStart.mutate(
      {
        product: p.sleutel,
        productNaam: p.naam,
        startDatum: datum,
        nieuw: true,
        houdbaarheidDagen: p.houdbaarheid,
        ontdooidDatum,
      },
      { onSettled: () => setZakVraag(null) },
    );
  };

  const totaal = BAIN_MARIE_PRODUCTEN.length;
  const genoteerd = BAIN_MARIE_PRODUCTEN.filter(
    (p) => bakVan(p.sleutel) || weggegooid.has(p.sleutel),
  ).length;
  const afgerond = genoteerd === totaal;
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (afgerond) setOpen(false);
  }, [afgerond]);

  return (
    <div className="py-2">
      <SectieBalk
        icoon={Soup}
        titel="Au bain-marie"
        stand={afgerond ? 'Afgerond — alle bakken genoteerd' : `${genoteerd}/${totaal} bakken genoteerd`}
        afgerond={afgerond}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />

      {open && (
        <>
          <Uitleg
            titel="Au bain-marie"
            tekst="Tik per product de dag die op de bak staat, zoals op de sticker van de vorige dienst. Is de bak vandaag vers gemaakt? Tik “Vandaag” — bij Kip vragen we daarna de datum van de zak. Gaat de bak vandaag niet mee of is hij op? Tik dan niets. Nieuwe zak tussendoor? Tik opnieuw “Vandaag”."
          />

          <div className="divide-y divide-border">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakVan(p.sleutel);
          const isWeggegooid = !bak && weggegooid.has(p.sleutel);
          const toonZakVraag = zakVraag === p.sleutel;
          return (
            <div key={p.sleutel} className="py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[15px] font-semibold text-foreground">{p.naam}</span>
                {bak ? (
                  statusRegel(bak, datum)
                ) : isWeggegooid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">
                    <Trash2 size={12} /> weggegooid
                  </span>
                ) : (
                  statusRegel(bak, datum)
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dagOpties.map(({ offset, iso }) => {
                  const gekozen = bak?.start_datum === iso;
                  return (
                    <button
                      key={offset}
                      type="button"
                      disabled={zetStart.isPending}
                      onClick={() => {
                        if (offset === 0 && p.heeftVriesZak) {
                          // Nieuwe bak = nieuwe zak: eerst de zak-datum vragen.
                          setZakVraag(toonZakVraag ? null : p.sleutel);
                          return;
                        }
                        setZakVraag(null);
                        zetStart.mutate({
                          product: p.sleutel,
                          productNaam: p.naam,
                          startDatum: iso,
                          nieuw: offset === 0,
                          houdbaarheidDagen: p.houdbaarheid,
                        });
                      }}
                      className={dagKnopStijl(gekozen)}
                      style={{ minHeight: 44, minWidth: 44 }}
                    >
                      {offset === 0 ? 'Vandaag' : dagKort(iso)}
                    </button>
                  );
                })}
              </div>

              {toonZakVraag && (
                <div className="mt-2 rounded-[14px] bg-primary/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-foreground">
                      Datum op de zak? <span className="font-normal text-muted-foreground">(ontdooi-sticker)</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Annuleren"
                      onClick={() => setZakVraag(null)}
                      className="flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                      style={{ minHeight: 44, minWidth: 44 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {zakOpties.map(({ offset, iso, label }) => (
                      <button
                        key={offset}
                        type="button"
                        disabled={zetStart.isPending}
                        onClick={() => startNieuw(p, iso)}
                        className={dagKnopStijl(false)}
                        style={{ minHeight: 44, minWidth: 44 }}
                      >
                        {label}
                      </button>
                    ))}
                    <Popover
                      open={kalenderVoor === p.sleutel}
                      onOpenChange={(open) => setKalenderVoor(open ? p.sleutel : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={zetStart.isPending}
                          className={`${dagKnopStijl(false)} flex items-center gap-1.5`}
                          style={{ minHeight: 44, minWidth: 44 }}
                        >
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
                            setKalenderVoor(null);
                            startNieuw(p, isoDatum(d));
                          }}
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                </div>
              )}
            </div>
          );
        })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Avondblok (Sluitlijst West, keuken): print de sticker voor de plastic
 * koelbak. De app zet de juiste startdatum erop — de afsluiter hoeft de
 * datum niet te weten, hij plakt hem alleen op de bak.
 * Op de laatste dag (of over de datum) is er géén sticker meer: dan staat
 * er een rode "Weggooien"-knop die de bak afsluit.
 */
export function BainMarieSluit({ vestiging, datum }: { vestiging: string; datum: string }) {
  const bakkenQuery = useBainMarieBakken(vestiging);
  const printSticker = useCreateStickerPrintJob();
  const gooiWeg = useGooiBainMarieWeg(vestiging);
  const bakken = bakkenQuery.data ?? [];

  /** Product dat op de tweede tik van de weggooi-bevestiging wacht. */
  const [bevestigWeg, setBevestigWeg] = useState<BainMarieSleutel | null>(null);

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

  /** Welk product nu aan het printen is (of net geprint heeft): blokkeert dubbeltikken. */
  const [bezig, setBezig] = useState<BainMarieSleutel | null>(null);

  const print = (bak: BainMarieBak) => {
    const s = bakStatus(bak, datum);
    if (!s.startDatum || !s.houdbaarTot) return;
    // Eén tik = één sticker: een tweede tik binnen de opdracht wordt genegeerd.
    if (bezig) return;
    setBezig(bak.product as BainMarieSleutel);
    printSticker.mutate(
      {
        type: 'bain',
        naam: bak.product_naam,
        datum1: stickerDatum(s.startDatum),
        datum2: stickerDatum(s.houdbaarTot),
        ontdooidDatum: bak.ontdooid_datum ? stickerDatum(bak.ontdooid_datum) : undefined,
        bron: 'bain_marie',
      },
      {
        onSuccess: () => markeerGeprint(bak.product),
        // Korte nablokkade zodat een na-tik van de iPad niet alsnog doorkomt.
        onSettled: () => window.setTimeout(() => setBezig(null), 1200),
      },
    );
  };


  return (
    <div className="py-2">
      <Kop
        icoon={Printer}
        titel="Au bain-marie — sticker printen"
        uitleg="Print per product een sticker en plak hem op de plastic bak in de koeling. De app zet de startdatum en houdbaar-tot er zelf op. Is de bak vandaag voor het laatst (of over de datum)? Dan staat er geen sticker-knop maar Weggooien — de bak gaat niet meer de koeling in."
      />

      <div className="divide-y divide-border">
        {BAIN_MARIE_PRODUCTEN.map((p) => {
          const bak = bakken.find((b) => b.product === p.sleutel);
          const s = bakStatus(bak, datum);
          const kanPrinten = bak && s.status === 'ok';
          const moetWeg = bak && (s.status === 'laatste-dag' || s.status === 'te-oud');
          const klaar = geprint.includes(p.sleutel);
          const bevestigt = bevestigWeg === p.sleutel;
          return (
            <div key={p.sleutel} className="flex items-center gap-3 py-3" style={{ minHeight: 52 }}>
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
                  disabled={bezig === p.sleutel}
                  onClick={() => print(bak!)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                    klaar
                      ? 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      : 'bg-primary/10 text-primary hover:bg-primary/15'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  <Printer size={15} />
                  {bezig === p.sleutel ? 'Bezig…' : klaar ? 'Opnieuw' : 'Sticker'}
                </button>

              ) : moetWeg ? (
                <button
                  type="button"
                  disabled={gooiWeg.isPending}
                  onClick={() => {
                    if (!bevestigt) {
                      setBevestigWeg(p.sleutel);
                      return;
                    }
                    setBevestigWeg(null);
                    gooiWeg.mutate({ bak: bak! });
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                    bevestigt
                      ? 'bg-destructive text-destructive-foreground shadow-sm'
                      : 'bg-destructive/10 text-destructive hover:bg-destructive/15'
                  }`}
                  style={{ minHeight: 44 }}
                >
                  <Trash2 size={15} />
                  {bevestigt ? 'Zeker?' : 'Weggooien'}
                </button>
              ) : (
                <span className="shrink-0 text-[12px] text-muted-foreground">geen sticker</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
