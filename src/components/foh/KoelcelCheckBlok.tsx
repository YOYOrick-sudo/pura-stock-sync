import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Minus, Plus, Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  useDrukteModus,
  useOpenstaandeBestellingen,
  useProbleemFrequentie,
  vervolgactieVoorRegel,
  eindBestemming,
  doelAantal,
  HERKOMST_LABEL,
  BESTEMMING_LABEL,
  type DrukteModus,
  type KoelcelCheck,
  type KoelcelCheckItem,
  type KoelcelCheckStatus,
  type VoorraadPlek,
} from '@/hooks/useKoelcelCheck';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';

const lettertype = 'Inter, sans-serif';

function stickerDatum(d: Date): string {
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '');
}

/** De vriescelcheck draait alleen op maandag: de laatste open dag voor de dinsdagsluiting. */
function isMaandag(datum: string): boolean {
  const d = new Date(`${datum}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.getDay() === 1;
}

function aantalLabel(item: KoelcelCheckItem, drukte: DrukteModus): string {
  const n = doelAantal(item, drukte);
  return item.bak_maat ? `${n}x ${item.bak_maat}` : `${n}x`;
}

const knop: React.CSSProperties = {
  minHeight: '48px',
  padding: '10px 16px',
  borderRadius: '14px',
  fontSize: '15px',
  fontWeight: 600,
  fontFamily: lettertype,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

/**
 * Eén venster per product dat niet klopt. Drie uitkomsten: bijgevuld vanuit het
 * niveau eronder, er ligt nog een deel, of het is echt helemaal op.
 */
function ActieDialog({
  item,
  onderItem,
  doel,
  onSluit,
  onAangevuld,
  onOp,
}: {
  item: KoelcelCheckItem;
  onderItem: KoelcelCheckItem | null;
  doel: number;
  onSluit: () => void;
  /** aantal = hoeveel er uit het niveau eronder gehaald is. */
  onAangevuld: (aantal: number) => void;
  /** aanwezig = wat er nog ligt (0 = helemaal op). */
  onOp: (aanwezig: number) => void;
}) {
  const [stap, setStap] = useState<'keuze' | 'aantal' | 'aanvullen'>('keuze');
  const [aanwezig, setAanwezig] = useState(Math.max(doel - 1, 0));
  const tekort = Math.max(doel - aanwezig, 1);

  const stapKnop: React.CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--card))',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const bronNaam = onderItem ? HERKOMST_LABEL[onderItem.plek] : null;


  return (
    <div
      onClick={onSluit}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'hsl(0 0% 0% / 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '24px',
          padding: '20px',
          fontFamily: lettertype,
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.35 }}>
          {item.naam}
        </div>

        {stap === 'keuze' ? (
          <>
            <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              {onderItem
                ? `Pak ${doel} ${item.eenheid} uit ${bronNaam} en leg het ${BESTEMMING_LABEL[item.plek]}.`
                : `Er hoort ${doel} ${item.eenheid} te liggen.`}
              {onderItem?.plek === 'vriezer' ? ' De "Ontdooid"-sticker wordt meteen geprint.' : ''}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
              {onderItem && (
                <button
                  type="button"
                  onClick={() => onAangevuld(doel)}
                  style={{
                    ...knop,
                    minHeight: '54px',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                >
                  <Check size={18} /> Gedaan, bijgevuld
                </button>
              )}
              <button
                type="button"
                onClick={() => setStap('aantal')}
                style={{
                  ...knop,
                  minHeight: '54px',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                Er ligt nog een deel
              </button>
              <button
                type="button"
                onClick={() => onOp(0)}
                style={{
                  ...knop,
                  minHeight: '54px',
                  backgroundColor: 'hsl(25 95% 53% / 0.12)',
                  color: 'hsl(25 95% 35%)',
                  border: '1px solid hsl(25 95% 53% / 0.4)',
                }}
              >
                {onderItem ? `${bronNaam} is ook leeg` : 'Helemaal op'}
              </button>
              <button
                type="button"
                onClick={onSluit}
                style={{ ...knop, backgroundColor: 'transparent', color: 'hsl(var(--muted-foreground))' }}
              >
                Annuleren
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Hoeveel ligt er nog? Standaard {doel} {item.eenheid}.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                margin: '18px 0 8px',
              }}
            >
              <button type="button" style={stapKnop} onClick={() => setAanwezig((n) => Math.max(n - 1, 0))}>
                <Minus size={22} />
              </button>
              <div style={{ minWidth: '64px', textAlign: 'center' }}>
                <div style={{ fontSize: '30px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{aanwezig}</div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{item.eenheid}</div>
              </div>
              <button type="button" style={stapKnop} onClick={() => setAanwezig((n) => Math.min(n + 1, doel))}>
                <Plus size={22} />
              </button>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: '13px',
                color: 'hsl(var(--muted-foreground))',
                marginBottom: '14px',
              }}
            >
              Er wordt {Math.max(doel - aanwezig, 1)} {item.eenheid} doorgezet.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStap('keuze')}
                style={{
                  ...knop,
                  flex: 1,
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                Terug
              </button>
              <button
                type="button"
                onClick={() => onOp(aanwezig)}
                style={{
                  ...knop,
                  flex: 1,
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                Doorzetten
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Eén productnaam in het raster: tik erop als het niet klopt. */
function NaamKnop({
  item,
  drukte,
  gemarkeerd,
  onderweg,
  onTik,
}: {
  item: KoelcelCheckItem;
  drukte: DrukteModus;
  gemarkeerd: boolean;
  onderweg: number;
  onTik: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTik}
      aria-pressed={gemarkeerd}
      style={{
        minHeight: '52px',
        padding: '8px 12px',
        borderRadius: '14px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: lettertype,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: gemarkeerd ? 'hsl(25 95% 53% / 0.12)' : 'hsl(var(--card))',
        border: gemarkeerd ? '1px solid hsl(25 95% 53% / 0.5)' : '1px solid hsl(var(--border))',
        transition: 'all 0.15s ease',
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: '15px',
          fontWeight: 500,
          color: gemarkeerd ? 'hsl(25 95% 32%)' : 'hsl(var(--foreground))',
        }}
      >
        {item.naam}
      </span>
      {onderweg > 0 && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            borderRadius: '999px',
            padding: '2px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {onderweg} besteld
        </span>
      )}
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'hsl(var(--muted-foreground))',
          whiteSpace: 'nowrap',
        }}
      >
        {aantalLabel(item, drukte)}
      </span>
    </button>
  );
}

function CheckBlok({
  titel,
  uitleg,
  items,
  alleItems,
  drukte,
  checks,
  bezig,
  onderwegMap,
  frequentie,
  onAllesOpPeil,
  onOpen,
}: {
  titel: string;
  uitleg: string;
  items: KoelcelCheckItem[];
  alleItems: KoelcelCheckItem[];
  drukte: DrukteModus;
  checks: Map<string, KoelcelCheck>;
  bezig: boolean;
  onderwegMap: Record<string, number>;
  frequentie: Record<string, number>;
  onAllesOpPeil: (items: KoelcelCheckItem[]) => void;
  onOpen: (item: KoelcelCheckItem) => void;
}) {
  const [gemarkeerd, setGemarkeerd] = useState<Set<string>>(new Set());
  const [zoek, setZoek] = useState('');
  const [openKlaar, setOpenKlaar] = useState(false);

  const gesorteerd = useMemo(
    () =>
      [...items].sort((a, b) => {
        const fa = frequentie[a.id] ?? 0;
        const fb = frequentie[b.id] ?? 0;
        if (fa !== fb) return fb - fa;
        return a.volgorde - b.volgorde;
      }),
    [items, frequentie],
  );

  if (items.length === 0) return null;

  const open = gesorteerd.filter((i) => !checks.has(i.id));
  const afgehandeld = gesorteerd.filter((i) => checks.has(i.id));
  const teTonen = zoek.trim()
    ? open.filter((i) => i.naam.toLowerCase().includes(zoek.trim().toLowerCase()))
    : open;
  const problemen = open.filter((i) => gemarkeerd.has(i.id));
  const okItems = open.filter((i) => !gemarkeerd.has(i.id));
  const allesGedaan = open.length === 0;

  const toggle = (id: string) =>
    setGemarkeerd((vorig) => {
      const nieuw = new Set(vorig);
      if (nieuw.has(id)) nieuw.delete(id);
      else nieuw.add(id);
      return nieuw;
    });

  return (
    <div style={{ marginBottom: '28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          backgroundColor: 'hsl(var(--muted))',
          borderRadius: '14px',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: lettertype }}>
          {titel}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: lettertype,
            color: allesGedaan ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {allesGedaan ? `Klaar · ${items.length} nagelopen` : `${afgehandeld.length}/${items.length}`}
        </span>
      </div>

      {!allesGedaan && (
        <>
          <p
            style={{
              margin: '10px 4px 10px',
              fontSize: '13px',
              color: 'hsl(var(--muted-foreground))',
              fontFamily: lettertype,
            }}
          >
            {uitleg} Tik alleen aan wat níét klopt.
          </p>

          {problemen.length > 0 && (
            <div
              style={{
                border: '1px solid hsl(25 95% 53% / 0.4)',
                backgroundColor: 'hsl(25 95% 53% / 0.07)',
                borderRadius: '16px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'hsl(25 95% 32%)',
                  fontFamily: lettertype,
                  marginBottom: '8px',
                }}
              >
                <AlertTriangle size={16} /> Klopt niet ({problemen.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {problemen.map((item) => {
                  const vervolg = vervolgactieVoorRegel(item, alleItems);
                  const eind = eindBestemming(item, alleItems);
                  const actie =
                    vervolg.soort === 'niveau'
                      ? `Halen uit ${HERKOMST_LABEL[vervolg.onderItem.plek]}`
                      : `Naar ${eind.label}`;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={bezig}
                      onClick={() => onOpen(item)}
                      style={{
                        ...knop,
                        justifyContent: 'space-between',
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        textAlign: 'left',
                      }}
                    >
                      <span>{item.naam}</span>
                      <span style={{ fontSize: '13px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{actie}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {open.length > 20 && (
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-foreground))',
                }}
              />
              <input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek een product"
                style={{
                  width: '100%',
                  minHeight: '48px',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  borderRadius: '14px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  fontSize: '15px',
                  fontFamily: lettertype,
                  color: 'hsl(var(--foreground))',
                }}
              />
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '8px',
            }}
          >
            {teTonen.map((item) => (
              <NaamKnop
                key={item.id}
                item={item}
                drukte={drukte}
                gemarkeerd={gemarkeerd.has(item.id)}
                onderweg={onderwegMap[item.naam.trim().toLowerCase()] ?? 0}
                onTik={() => toggle(item.id)}
              />
            ))}
          </div>

          {okItems.length > 0 && (
            <button
              type="button"
              disabled={bezig}
              onClick={() => onAllesOpPeil(okItems)}
              style={{
                ...knop,
                width: '100%',
                minHeight: '56px',
                marginTop: '12px',
                fontSize: '16px',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                cursor: bezig ? 'wait' : 'pointer',
              }}
            >
              <Check size={20} />
              {problemen.length > 0
                ? `De rest ligt er (${okItems.length})`
                : `Alles ligt er (${okItems.length})`}
            </button>
          )}
        </>
      )}

      {afgehandeld.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => setOpenKlaar((v) => !v)}
            style={{
              ...knop,
              width: '100%',
              minHeight: '44px',
              justifyContent: 'space-between',
              backgroundColor: 'transparent',
              color: 'hsl(var(--muted-foreground))',
              fontSize: '13px',
              padding: '8px 4px',
            }}
          >
            <span>{afgehandeld.length} afgehandeld</span>
            {openKlaar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {openKlaar && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px' }}>
              {afgehandeld.map((item) => {
                const status = checks.get(item.id)?.status;
                const gemeld = status === 'gemeld' || status === 'naar_mep';
                return (
                  <span
                    key={item.id}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      fontFamily: lettertype,
                      borderRadius: '999px',
                      padding: '4px 10px',
                      color: gemeld ? 'hsl(25 95% 32%)' : 'hsl(var(--muted-foreground))',
                      backgroundColor: gemeld ? 'hsl(25 95% 53% / 0.12)' : 'hsl(var(--muted))',
                    }}
                  >
                    {item.naam}
                    {gemeld ? ' · doorgezet' : ''}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Aanvulketen op de sluitlijst (West): vriescel → koelcel → werkbank/werkblad.
 * Je meldt alleen wat níét klopt; de rest gaat met één tik op aanwezig.
 * De vriescelvoorraad wordt alleen op maandag nagelopen.
 */
export function KoelcelCheckBlok({ vestiging, datum }: { vestiging: string; datum: string }) {
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const checksQuery = useKoelcelChecks(vestiging, datum);
  const onderwegQuery = useOpenstaandeBestellingen(vestiging);
  const frequentieQuery = useProbleemFrequentie(vestiging);
  const onderwegMap = onderwegQuery.data ?? {};
  const frequentie = frequentieQuery.data ?? {};
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const { zetStatus, meldOp, vulAanUitNiveau, zetAllesAanwezig } = useKoelcelCheckMutaties(vestiging, datum, items);
  const drukteQuery = useDrukteModus(vestiging);
  const drukte: DrukteModus = drukteQuery.data ?? 'rustig';
  const printSticker = useCreateStickerPrintJob();
  const [actieItem, setActieItem] = useState<KoelcelCheckItem | null>(null);

  const checks = useMemo(() => {
    const map = new Map<string, KoelcelCheck>();
    for (const c of checksQuery.data ?? []) map.set(c.item_id, c);
    return map;
  }, [checksQuery.data]);

  if (itemsQuery.isLoading || items.length === 0) return null;

  const bezig =
    zetStatus.isPending || meldOp.isPending || vulAanUitNiveau.isPending || zetAllesAanwezig.isPending;
  const maandag = isMaandag(datum);

  const perPlek = (plek: VoorraadPlek) =>
    items.filter((i) => (i.plek ?? (i.type === 'vriezer' ? 'vriezer' : 'koelcel')) === plek);

  /** Ontdooisticker voor op de bak die net uit de vriescel kwam. */
  const printOntdooid = (item: KoelcelCheckItem) => {
    const vandaag = new Date();
    const tm = new Date(vandaag);
    tm.setDate(tm.getDate() + 2);
    printSticker.mutate(
      {
        type: 'ontdooid',
        naam: item.naam,
        datum1: stickerDatum(vandaag),
        datum2: stickerDatum(tm),
        aantal: 1,
        bron: 'koelcel_check',
      },
      {
        onSuccess: () => toast.success(`Sticker "Ontdooid · ${item.naam}" wordt geprint`),
        onError: (e: any) => toast.error('Sticker niet geprint: ' + (e?.message ?? 'onbekende fout')),
      },
    );
  };

  const doorzetten = async (item: KoelcelCheckItem, aanwezig: number) => {
    try {
      const res = await meldOp.mutateAsync({ item, doel: doelAantal(item, drukte), aanwezig });
      if (res.bestemming.soort === 'niveau')
        toast.success(`"${item.naam}" staat nu open bij ${res.bestemming.label}`);
      else if (res.geplaatst <= 0)
        toast.info(`"${item.naam}" is al besteld (${res.onderweg} ${item.eenheid} onderweg)`);
      else if (res.dubbel)
        toast.success(`"${item.naam}" bijgewerkt naar ${res.geplaatst} ${item.eenheid} op ${res.bestemming.label}`);
      else toast.success(`${res.geplaatst} ${item.eenheid} "${item.naam}" naar ${res.bestemming.label}`);
    } catch (e: any) {
      toast.error('Doorzetten mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const handleAllesOpPeil = (teZetten: KoelcelCheckItem[]) => {
    zetAllesAanwezig.mutate(teZetten, {
      onSuccess: (r) => toast.success(`${r.aantal} regels op peil gezet`),
      onError: () => toast.error('Niet opgeslagen — probeer opnieuw'),
    });
  };

  /** "Gedaan": aangevuld vanuit het niveau eronder. */
  const handleAangevuld = async (item: KoelcelCheckItem, onderItem: KoelcelCheckItem) => {
    try {
      await vulAanUitNiveau.mutateAsync({ item, onderItem });
      if (onderItem.plek === 'vriezer') printOntdooid(item);
      else toast.success(`${item.naam} bijgevuld uit ${HERKOMST_LABEL[onderItem.plek]}`);
    } catch (e: any) {
      toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const actieVervolg = actieItem ? vervolgactieVoorRegel(actieItem, items) : null;
  const actieOnderItem = actieVervolg && actieVervolg.soort === 'niveau' ? actieVervolg.onderItem : null;

  const blokProps = {
    alleItems: items,
    drukte,
    checks,
    bezig,
    onderwegMap,
    frequentie,
    onAllesOpPeil: handleAllesOpPeil,
    onOpen: setActieItem,
  };

  return (
    <div style={{ marginTop: '8px' }}>
      {maandag && (
        <CheckBlok
          titel="Vriescel op peil (maandag)"
          uitleg="Weekcheck: ligt de standaardvoorraad er nog?"
          items={perPlek('vriezer')}
          {...blokProps}
        />
      )}
      <CheckBlok
        titel="Koelcel op peil"
        uitleg="Dit hoort standaard in de koelcel te liggen."
        items={perPlek('koelcel')}
        {...blokProps}
      />
      <CheckBlok
        titel="Koelwerkbank bijvullen"
        uitleg="Vul de koelwerkbank aan vanuit de koelcel."
        items={perPlek('werkbank')}
        {...blokProps}
      />
      <CheckBlok
        titel="Toppings bijvullen"
        uitleg="Droogwaren uit het magazijn, geroosterd en aangevuld op het werkblad."
        items={perPlek('werkblad')}
        {...blokProps}
      />

      {actieItem && (
        <ActieDialog
          item={actieItem}
          onderItem={actieOnderItem}
          doel={doelAantal(actieItem, drukte)}
          onSluit={() => setActieItem(null)}
          onAangevuld={() => {
            const item = actieItem;
            const onder = actieOnderItem;
            setActieItem(null);
            if (item && onder) void handleAangevuld(item, onder);
          }}
          onOp={(aanwezig) => {
            const item = actieItem;
            const onder = actieOnderItem;
            setActieItem(null);
            void (async () => {
              if (onder && aanwezig <= 0) {
                // Het niveau eronder is ook leeg: die regel schuift door naar de
                // volgende bron (vriescel, bestelbord, mise-en-place of Midsland).
                await doorzetten(onder, 0);
                zetStatus.mutate({ item, status: 'gemeld' as KoelcelCheckStatus, uit: false });
              } else {
                await doorzetten(item, aanwezig);
              }
            })();
          }}
        />
      )}
    </div>
  );
}
