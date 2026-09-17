import { useMemo } from 'react';
import { toast } from 'sonner';
import { Snowflake, Check, ArrowRight } from 'lucide-react';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  bestemmingVoorBron,
  BRON_LABEL,
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

function aantalLabel(item: KoelcelCheckItem): string {
  const n = Number(item.doel_aantal);
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

interface RijProps {
  item: KoelcelCheckItem;
  status: KoelcelCheckStatus | null;
  bezig: boolean;
  klaarLabel: string;
  klaarIcoon: 'check' | 'snowflake';
  onKlaar: () => void;
  onOp: () => void;
}

function ItemRij({ item, status, bezig, klaarLabel, klaarIcoon, onKlaar, onOp }: RijProps) {
  const isKlaar = status === 'aanwezig' || status === 'uit_vriezer';
  const isGemeld = status === 'gemeld' || status === 'naar_mep';
  const bestemming = bestemmingVoorBron(item.bron);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 4px',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
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
        <span style={{ ...chip, marginLeft: '8px' }}>{aantalLabel(item)}</span>
        <div
          style={{
            marginTop: '2px',
            fontSize: '12px',
            color: 'hsl(var(--muted-foreground))',
            fontFamily: lettertype,
          }}
        >
          {BRON_LABEL[item.bron]}
          {isGemeld ? ` · staat op ${bestemming.label}` : ''}
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
        <ArrowRight size={16} />
        {isGemeld ? 'Doorgezet' : 'Op'}
      </button>
    </div>
  );
}

function CheckBlok({
  titel,
  uitleg,
  items,
  checks,
  bezig,
  klaarLabel,
  klaarIcoon,
  onKlaar,
  onOp,
}: {
  titel: string;
  uitleg: string;
  items: KoelcelCheckItem[];
  checks: Map<string, KoelcelCheckStatus>;
  bezig: boolean;
  klaarLabel: string;
  klaarIcoon: 'check' | 'snowflake';
  onKlaar: (item: KoelcelCheckItem) => void;
  onOp: (item: KoelcelCheckItem) => void;
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
            status={checks.get(item.id) ?? null}
            bezig={bezig}
            klaarLabel={klaarLabel}
            klaarIcoon={klaarIcoon}
            onKlaar={() => onKlaar(item)}
            onOp={() => onOp(item)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Aanvulketen op de sluitlijst (West): vriezer → koelcel → werkbank/werkblad.
 * Wat op is gaat met één tik naar de mise-en-place, het bestelbord of de
 * bestellijst voor Midsland — afhankelijk van waar het product vandaan komt.
 */
export function KoelcelCheckBlok({ vestiging, datum }: { vestiging: string; datum: string }) {
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const checksQuery = useKoelcelChecks(vestiging, datum);
  const { zetStatus, meldOp } = useKoelcelCheckMutaties(vestiging, datum);
  const printSticker = useCreateStickerPrintJob();

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const checks = useMemo(() => {
    const map = new Map<string, KoelcelCheckStatus>();
    for (const c of checksQuery.data ?? []) map.set(c.item_id, c.status);
    return map;
  }, [checksQuery.data]);

  if (itemsQuery.isLoading || items.length === 0) return null;

  const bezig = zetStatus.isPending || meldOp.isPending;

  const perPlek = (plek: VoorraadPlek) =>
    items.filter((i) => (i.plek ?? (i.type === 'vriezer' ? 'vriezer' : 'koelcel')) === plek);

  const handleKlaar = (item: KoelcelCheckItem, status: KoelcelCheckStatus) => {
    const uit = checks.get(item.id) === status;
    zetStatus.mutate({ item, status, uit }, { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') });
    return uit;
  };

  const handleOp = async (item: KoelcelCheckItem) => {
    // Ongedaan maken: alleen de check weghalen; de melding zelf blijft staan.
    if (checks.has(item.id)) {
      zetStatus.mutate(
        { item, status: checks.get(item.id)!, uit: true },
        { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') },
      );
      return;
    }
    try {
      const res = await meldOp.mutateAsync(item);
      if (res.dubbel) toast.info(`"${item.naam}" staat al op ${res.bestemming.label}`);
      else toast.success(`"${item.naam}" staat op ${res.bestemming.label}`);
    } catch (e: any) {
      toast.error('Doorzetten mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const handleUitVriezer = (item: KoelcelCheckItem) => {
    const ongedaan = handleKlaar(item, 'uit_vriezer');
    if (ongedaan) return;
    // Meteen een "Ontdooid"-sticker printen voor op de bak in de koelcel.
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

  return (
    <div style={{ marginTop: '8px' }}>
      <CheckBlok
        titel="Uit de vriezer (ontdooien)"
        uitleg='Haal uit de vriezer wat morgen nodig is. Bij "Uit vriezer gehaald" print er meteen een Ontdooid-sticker. Is de vriezer leeg? Tik op "Op".'
        items={perPlek('vriezer')}
        checks={checks}
        bezig={bezig}
        klaarLabel="Uit vriezer gehaald"
        klaarIcoon="snowflake"
        onKlaar={handleUitVriezer}
        onOp={handleOp}
      />
      <CheckBlok
        titel="Koelcel op peil"
        uitleg='Dit moet standaard in de koelcel liggen. Ontbreekt het? Tik op "Op" — het gaat vanzelf naar de juiste lijst.'
        items={perPlek('koelcel')}
        checks={checks}
        bezig={bezig}
        klaarLabel="Aanwezig"
        klaarIcoon="check"
        onKlaar={(i) => handleKlaar(i, 'aanwezig')}
        onOp={handleOp}
      />
      <CheckBlok
        titel="Werkbank bijvullen"
        uitleg="Vul de koelwerkbank aan vanuit de koelcel. Lukt dat niet omdat de koelcel leeg is? Tik op &quot;Op&quot;."
        items={perPlek('werkbank')}
        checks={checks}
        bezig={bezig}
        klaarLabel="Bijgevuld"
        klaarIcoon="check"
        onKlaar={(i) => handleKlaar(i, 'aanwezig')}
        onOp={handleOp}
      />
      <CheckBlok
        titel="Werkblad bijvullen"
        uitleg="Droogwaren uit het magazijn, geroosterd en aangevuld op het werkblad."
        items={perPlek('werkblad')}
        checks={checks}
        bezig={bezig}
        klaarLabel="Bijgevuld"
        klaarIcoon="check"
        onKlaar={(i) => handleKlaar(i, 'aanwezig')}
        onOp={handleOp}
      />
    </div>
  );
}
