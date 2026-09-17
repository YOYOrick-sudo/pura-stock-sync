import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Snowflake, Check, ArrowRight, Minus, Plus } from 'lucide-react';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  useDrukteModus,
  vervolgactieVoorRegel,
  eindBestemming,
  doelAantal,
  BRON_LABEL,
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

const chip: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'hsl(var(--muted-foreground))',
  backgroundColor: 'hsl(var(--muted))',
  padding: '2px 8px',
  borderRadius: '999px',
  fontFamily: lettertype,
  whiteSpace: 'nowrap',
};

const basisKnop: React.CSSProperties = {
  minHeight: '44px',
  padding: '8px 14px',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: lettertype,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
};

/** Compact venstertje: hoeveel ligt er nog? Het systeem bestelt alleen het tekort. */
function TekortDialog({
  item,
  doel,
  onAnnuleer,
  onBevestig,
}: {
  item: KoelcelCheckItem;
  doel: number;
  onAnnuleer: () => void;
  onBevestig: (aanwezig: number) => void;
}) {
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

  return (
    <div
      onClick={onAnnuleer}
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
          maxWidth: '360px',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '24px',
          padding: '20px',
          fontFamily: lettertype,
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{item.naam}</div>
        <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
          Hoeveel ligt er nog? Standaard {doel} {item.eenheid}.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            margin: '18px 0 10px',
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
          Er wordt {tekort} {item.eenheid} doorgezet.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onAnnuleer}
            style={{
              ...basisKnop,
              flex: 1,
              justifyContent: 'center',
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              cursor: 'pointer',
            }}
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={() => onBevestig(aanwezig)}
            style={{
              ...basisKnop,
              flex: 1,
              justifyContent: 'center',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Doorzetten
          </button>
        </div>
      </div>
    </div>
  );
}

/** Eén opdracht, twee uitkomsten: gepakt, of het niveau eronder is ook leeg. */
function AanvulDialog({
  item,
  onderItem,
  aantal,
  onAnnuleer,
  onGedaan,
  onOokLeeg,
}: {
  item: KoelcelCheckItem;
  onderItem: KoelcelCheckItem;
  aantal: number;
  onAnnuleer: () => void;
  onGedaan: () => void;
  onOokLeeg: () => void;
}) {
  return (
    <div
      onClick={onAnnuleer}
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
          maxWidth: '360px',
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '24px',
          padding: '20px',
          fontFamily: lettertype,
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.35 }}>
          Pak {aantal} {item.eenheid} {item.naam.toLowerCase()} uit {HERKOMST_LABEL[onderItem.plek]} en leg het{' '}
          {BESTEMMING_LABEL[item.plek]}.
        </div>
        {onderItem.plek === 'vriezer' && (
          <div style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '6px' }}>
            De "Ontdooid"-sticker wordt meteen geprint.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
          <button
            type="button"
            onClick={onGedaan}
            style={{
              ...basisKnop,
              minHeight: '52px',
              justifyContent: 'center',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Check size={18} />
            Gedaan
          </button>
          <button
            type="button"
            onClick={onOokLeeg}
            style={{
              ...basisKnop,
              minHeight: '52px',
              justifyContent: 'center',
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              cursor: 'pointer',
            }}
          >
            {HERKOMST_LABEL[onderItem.plek].replace('de ', 'De ').replace('het ', 'Het ')} is ook leeg
          </button>
          <button
            type="button"
            onClick={onAnnuleer}
            style={{
              ...basisKnop,
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: 'hsl(var(--muted-foreground))',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}


interface RijProps {
  item: KoelcelCheckItem;
  alleItems: KoelcelCheckItem[];
  drukte: DrukteModus;
  check: KoelcelCheck | null;
  bezig: boolean;
  klaarLabel: string;
  klaarIcoon: 'check' | 'snowflake';
  /** Al besteld bij Midsland en nog niet geleverd. */
  onderweg?: number;
  onKlaar: () => void;
  onOp: () => void;
  onTeWeinig: () => void;
}

function ItemRij({
  item,
  alleItems,
  drukte,
  check,
  bezig,
  klaarLabel,
  klaarIcoon,
  onderweg = 0,
  onKlaar,
  onOp,
  onTeWeinig,
}: RijProps) {
  const status = check?.status ?? null;
  const isKlaar = status === 'aanwezig' || status === 'uit_vriezer';
  const isGemeld = status === 'gemeld' || status === 'naar_mep';
  const bestemming = vervolgactieVoorRegel(item, alleItems);
  const eind = eindBestemming(item, alleItems);
  const doorgezet = check?.aantal_doorgezet ?? null;

  // Ligt hetzelfde product een niveau lager? Dan is de knop een opdracht: pakken en terugleggen.
  const uitNiveau = bestemming.soort === 'niveau' ? bestemming.onderItem : null;
  const opLabel = uitNiveau
    ? uitNiveau.plek === 'vriezer'
      ? 'Halen uit de vriescel'
      : `Bijvullen uit ${HERKOMST_LABEL[uitNiveau.plek]}`
    : 'Op';
  const onderschrift = uitNiveau
    ? `Aanvullen uit ${HERKOMST_LABEL[uitNiveau.plek]} · daarna ${eind.label}`
    : `${BRON_LABEL[item.bron]} · als het op is naar ${eind.label}`;


  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 4px',
        borderBottom: '1px solid hsl(var(--border))',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: '140px' }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: 500,
            color: isKlaar ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
            textDecoration: isKlaar ? 'line-through' : 'none',
            fontFamily: lettertype,
          }}
        >
          {item.naam}
        </span>
        <span style={{ ...chip, marginLeft: '8px' }}>{aantalLabel(item, drukte)}</span>
        <div
          style={{
            marginTop: '2px',
            fontSize: '12px',
            color: 'hsl(var(--muted-foreground))',
            fontFamily: lettertype,
          }}
        >
          {onderschrift}
          {isGemeld
            ? doorgezet
              ? ` · ${doorgezet} ${item.eenheid} naar ${eind.label}`
              : ` · staat op ${eind.label}`
            : ''}
          {status === 'uit_vriezer' && item.plek === 'vriezer' ? ' · deze week uit gehaald' : ''}
          {onderweg > 0 && (
            <span style={{ color: 'hsl(var(--primary))' }}>
              {' · '}
              {onderweg} {item.eenheid} besteld, nog niet geleverd
            </span>
          )}
        </div>

      </div>

      <button
        type="button"
        disabled={bezig}
        onClick={onKlaar}
        aria-pressed={isKlaar}
        style={{
          ...basisKnop,
          cursor: bezig ? 'wait' : 'pointer',
          backgroundColor: isKlaar ? 'hsl(var(--primary))' : 'hsl(var(--card))',
          color: isKlaar ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          border: isKlaar ? 'none' : '1px solid hsl(var(--border))',
        }}
      >
        {klaarIcoon === 'snowflake' ? <Snowflake size={16} /> : <Check size={16} />}
        {klaarLabel}
      </button>

      <button
        type="button"
        disabled={bezig || isGemeld}
        onClick={onTeWeinig}
        style={{
          ...basisKnop,
          cursor: bezig ? 'wait' : 'pointer',
          opacity: isGemeld ? 0.4 : 1,
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--muted-foreground))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        Te weinig
      </button>

      <button
        type="button"
        disabled={bezig}
        onClick={onOp}
        aria-pressed={isGemeld}
        style={{
          ...basisKnop,
          cursor: bezig ? 'wait' : 'pointer',
          backgroundColor: isGemeld ? 'hsl(25 95% 53% / 0.15)' : 'hsl(var(--card))',
          color: isGemeld ? 'hsl(25 95% 40%)' : 'hsl(var(--muted-foreground))',
          border: isGemeld ? '1px solid hsl(25 95% 53% / 0.5)' : '1px solid hsl(var(--border))',
        }}
      >
        {uitNiveau ? <Snowflake size={16} /> : <ArrowRight size={16} />}
        {isGemeld ? 'Doorgezet' : opLabel}
      </button>
    </div>
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
  klaarLabel,
  klaarIcoon,
  onderwegMap,
  onKlaar,
  onOp,
  onTeWeinig,
}: {
  titel: string;
  uitleg: string;
  items: KoelcelCheckItem[];
  alleItems: KoelcelCheckItem[];
  drukte: DrukteModus;
  checks: Map<string, KoelcelCheck>;
  bezig: boolean;
  klaarLabel: string;
  klaarIcoon: 'check' | 'snowflake';
  onderwegMap: Record<string, number>;
  onKlaar: (item: KoelcelCheckItem) => void;

  onOp: (item: KoelcelCheckItem) => void;
  onTeWeinig: (item: KoelcelCheckItem) => void;
}) {
  if (items.length === 0) return null;
  const gedaan = items.filter((i) => checks.has(i.id)).length;
  const pct = items.length ? Math.round((gedaan / items.length) * 100) : 0;

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          backgroundColor: 'hsl(var(--muted))',
          borderRadius: '12px',
          marginBottom: '4px',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--foreground))', fontFamily: lettertype }}>
          {titel}
        </span>
        <div
          style={{
            flex: 1,
            height: '4px',
            borderRadius: '999px',
            backgroundColor: 'hsl(var(--border))',
            overflow: 'hidden',
            maxWidth: '140px',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: 'hsl(var(--primary))',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ ...chip, backgroundColor: 'hsl(var(--muted) / 0.6)', padding: '3px 10px' }}>
          {gedaan}/{items.length}
        </span>
      </div>

      <p
        style={{
          margin: '4px 4px 8px',
          fontSize: '12px',
          color: 'hsl(var(--muted-foreground))',
          fontFamily: lettertype,
        }}
      >
        {uitleg}
      </p>

      <div>
        {items.map((item) => (
          <ItemRij
            key={item.id}
            item={item}
            alleItems={alleItems}
            drukte={drukte}
            check={checks.get(item.id) ?? null}
            bezig={bezig}
            klaarLabel={klaarLabel}
            klaarIcoon={klaarIcoon}
            onderweg={onderwegMap[item.naam.trim().toLowerCase()] ?? 0}
            onKlaar={() => onKlaar(item)}
            onOp={() => onOp(item)}
            onTeWeinig={() => onTeWeinig(item)}
          />
        ))}

      </div>
    </div>
  );
}

/**
 * Aanvulketen op de sluitlijst (West): vriescel → koelcel → werkbank/werkblad.
 * Wat op is gaat met één tik naar de mise-en-place, het bestelbord of de
 * bestellijst voor Midsland — afhankelijk van waar het product vandaan komt.
 * De vriescelvoorraad wordt alleen op maandag nagelopen.
 */
export function KoelcelCheckBlok({ vestiging, datum }: { vestiging: string; datum: string }) {
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const checksQuery = useKoelcelChecks(vestiging, datum);
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const { zetStatus, meldOp, vulAanUitNiveau } = useKoelcelCheckMutaties(vestiging, datum, items);
  const drukteQuery = useDrukteModus(vestiging);
  const drukte: DrukteModus = drukteQuery.data ?? 'rustig';
  const printSticker = useCreateStickerPrintJob();
  const [tekortItem, setTekortItem] = useState<KoelcelCheckItem | null>(null);
  const [aanvulItem, setAanvulItem] = useState<{ item: KoelcelCheckItem; onderItem: KoelcelCheckItem } | null>(
    null,
  );

  const checks = useMemo(() => {
    const map = new Map<string, KoelcelCheck>();
    for (const c of checksQuery.data ?? []) map.set(c.item_id, c);
    return map;
  }, [checksQuery.data]);

  if (itemsQuery.isLoading || items.length === 0) return null;

  const bezig = zetStatus.isPending || meldOp.isPending || vulAanUitNiveau.isPending;
  const maandag = isMaandag(datum);

  const perPlek = (plek: VoorraadPlek) =>
    items.filter((i) => (i.plek ?? (i.type === 'vriezer' ? 'vriezer' : 'koelcel')) === plek);

  const handleKlaar = (item: KoelcelCheckItem, status: KoelcelCheckStatus) => {
    const uit = checks.get(item.id)?.status === status;
    zetStatus.mutate({ item, status, uit }, { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') });
    return uit;
  };

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

  const handleOp = async (item: KoelcelCheckItem) => {
    // Ongedaan maken: alleen de check weghalen; een eerdere melding blijft staan.
    if (checks.has(item.id)) {
      zetStatus.mutate(
        { item, status: checks.get(item.id)!.status, uit: true },
        { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') },
      );
      return;
    }
    const vervolg = vervolgactieVoorRegel(item, items);
    if (vervolg.soort === 'niveau') {
      // Concrete opdracht: haal het een niveau lager vandaan.
      setAanvulItem({ item, onderItem: vervolg.onderItem });
      return;
    }
    await doorzetten(item, 0);
  };

  /** "Gedaan": aangevuld vanuit het niveau eronder. */
  const handleAangevuld = async ({
    item,
    onderItem,
  }: {
    item: KoelcelCheckItem;
    onderItem: KoelcelCheckItem;
  }) => {
    try {
      await vulAanUitNiveau.mutateAsync({ item, onderItem });
      if (onderItem.plek === 'vriezer') {
        printOntdooid(item);
      } else {
        toast.success(`${item.naam} bijgevuld uit ${HERKOMST_LABEL[onderItem.plek]}`);
      }
    } catch (e: any) {
      toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      {maandag && (
        <CheckBlok
          titel="Vriescel op peil (maandag)"
          uitleg="Weekcheck: ligt de standaardvoorraad er nog? Wat ontbreekt gaat automatisch naar de bestellijst voor Midsland."
          items={perPlek('vriezer')}
          alleItems={items}
          drukte={drukte}
          checks={checks}
          bezig={bezig}
          klaarLabel="Aanwezig"
          klaarIcoon="check"
          onKlaar={(i) => handleKlaar(i, 'aanwezig')}
          onOp={handleOp}
          onTeWeinig={setTekortItem}
        />
      )}
      <CheckBlok
        titel="Koelcel op peil"
        uitleg="Dit moet standaard in de koelcel liggen. Ontbreekt er iets? De knop vertelt je waar je het vandaan haalt."
        items={perPlek('koelcel')}
        alleItems={items}
        drukte={drukte}
        checks={checks}
        bezig={bezig}
        klaarLabel="Aanwezig"
        klaarIcoon="check"
        onKlaar={(i) => handleKlaar(i, 'aanwezig')}
        onOp={handleOp}
        onTeWeinig={setTekortItem}
      />
      <CheckBlok
        titel="Koelwerkbank bijvullen"
        uitleg="Vul de koelwerkbank aan vanuit de koelcel. Is de koelcel leeg, dan wijst de app je door naar de vriescel."
        items={perPlek('werkbank')}
        alleItems={items}
        drukte={drukte}
        checks={checks}
        bezig={bezig}
        klaarLabel="Bijgevuld"
        klaarIcoon="check"
        onKlaar={(i) => handleKlaar(i, 'aanwezig')}
        onOp={handleOp}
        onTeWeinig={setTekortItem}
      />
      <CheckBlok
        titel="Toppings bijvullen"
        uitleg="Droogwaren uit het magazijn, geroosterd en aangevuld op het werkblad."
        items={perPlek('werkblad')}
        alleItems={items}
        drukte={drukte}
        checks={checks}
        bezig={bezig}
        klaarLabel="Bijgevuld"
        klaarIcoon="check"
        onKlaar={(i) => handleKlaar(i, 'aanwezig')}
        onOp={handleOp}
        onTeWeinig={setTekortItem}
      />

      {aanvulItem && (
        <AanvulDialog
          item={aanvulItem.item}
          onderItem={aanvulItem.onderItem}
          aantal={doelAantal(aanvulItem.item, drukte)}
          onAnnuleer={() => setAanvulItem(null)}
          onGedaan={() => {
            const paar = aanvulItem;
            setAanvulItem(null);
            void handleAangevuld(paar);
          }}
          onOokLeeg={() => {
            const paar = aanvulItem;
            setAanvulItem(null);
            void (async () => {
              // Het niveau eronder is ook leeg: die regel schuift door naar de
              // volgende bron (vriescel, bestelbord, mise-en-place of Midsland).
              await doorzetten(paar.onderItem, 0);
              zetStatus.mutate({ item: paar.item, status: 'gemeld', uit: false });
            })();
          }}
        />
      )}

      {tekortItem && (
        <TekortDialog
          item={tekortItem}
          doel={doelAantal(tekortItem, drukte)}
          onAnnuleer={() => setTekortItem(null)}
          onBevestig={(aanwezig) => {
            const item = tekortItem;
            setTekortItem(null);
            void doorzetten(item, aanwezig);
          }}
        />
      )}
    </div>
  );
}

