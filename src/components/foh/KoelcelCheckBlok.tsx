import { useMemo } from 'react';
import { toast } from 'sonner';
import { Snowflake, Check, ArrowRight } from 'lucide-react';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  type KoelcelCheckItem,
  type KoelcelCheckStatus,
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
  return `${n}x`;
}

interface RijProps {
  item: KoelcelCheckItem;
  status: KoelcelCheckStatus | null;
  onAanwezig: () => void;
  onNaarMep: () => void;
  bezig: boolean;
}

function KoelcelRij({ item, status, onAanwezig, onNaarMep, bezig }: RijProps) {
  const isAanwezig = status === 'aanwezig';
  const isNaarMep = status === 'naar_mep';

  const basisKnop: React.CSSProperties = {
    minHeight: '44px',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: lettertype,
    cursor: bezig ? 'wait' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

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
            color: isAanwezig ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
            textDecoration: isAanwezig ? 'line-through' : 'none',
            fontFamily: lettertype,
          }}
        >
          {item.naam}
        </span>
        <span
          style={{
            marginLeft: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'hsl(var(--muted-foreground))',
            backgroundColor: 'hsl(var(--muted))',
            padding: '2px 8px',
            borderRadius: '999px',
          }}
        >
          {aantalLabel(item)}
        </span>
      </div>

      <button
        type="button"
        disabled={bezig}
        onClick={onAanwezig}
        aria-pressed={isAanwezig}
        style={{
          ...basisKnop,
          backgroundColor: isAanwezig ? 'hsl(var(--primary))' : 'hsl(var(--card))',
          color: isAanwezig ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          border: isAanwezig ? 'none' : '1px solid hsl(var(--border))',
        }}
      >
        <Check size={16} />
        {isAanwezig ? 'Aanwezig' : 'Aanwezig'}
      </button>

      <button
        type="button"
        disabled={bezig}
        onClick={onNaarMep}
        aria-pressed={isNaarMep}
        style={{
          ...basisKnop,
          backgroundColor: isNaarMep ? 'hsl(25 95% 53% / 0.15)' : 'hsl(var(--card))',
          color: isNaarMep ? 'hsl(25 95% 40%)' : 'hsl(var(--muted-foreground))',
          border: isNaarMep ? '1px solid hsl(25 95% 53% / 0.5)' : '1px solid hsl(var(--border))',
        }}
      >
        <ArrowRight size={16} />
        {isNaarMep ? 'Staat op MEP' : 'Naar MEP'}
      </button>
    </div>
  );
}

function VriezerRij({ item, status, onGehaald, onNaarMep, bezig }: RijProps & { onGehaald: () => void }) {
  const isGehaald = status === 'uit_vriezer';
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
            color: isGehaald ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
            textDecoration: isGehaald ? 'line-through' : 'none',
            fontFamily: lettertype,
          }}
        >
          {item.naam}
        </span>
        <span
          style={{
            marginLeft: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'hsl(var(--muted-foreground))',
            backgroundColor: 'hsl(var(--muted))',
            padding: '2px 8px',
            borderRadius: '999px',
          }}
        >
          {aantalLabel(item)}
        </span>
      </div>

      <button
        type="button"
        disabled={bezig}
        onClick={onGehaald}
        aria-pressed={isGehaald}
        style={{
          minHeight: '44px',
          padding: '8px 14px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: lettertype,
          cursor: bezig ? 'wait' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          backgroundColor: isGehaald ? 'hsl(var(--primary))' : 'hsl(var(--card))',
          color: isGehaald ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          border: isGehaald ? 'none' : '1px solid hsl(var(--border))',
        }}
      >
        <Snowflake size={16} />
        {isGehaald ? 'Ligt in koelcel' : 'Uit vriezer gehaald'}
      </button>

      {!isGehaald && (
        <button
          type="button"
          disabled={bezig}
          onClick={onNaarMep}
          style={{
            minHeight: '44px',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: lettertype,
            cursor: bezig ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            backgroundColor: 'transparent',
            color: 'hsl(var(--muted-foreground))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <ArrowRight size={14} />
          Naar MEP
        </button>
      )}
    </div>
  );
}

function CheckBlok({
  titel,
  items,
  checks,
  kind,
  bezig,
  onAanwezig,
  onNaarMep,
  onGehaald,
}: {
  titel: string;
  items: KoelcelCheckItem[];
  checks: Map<string, KoelcelCheckStatus>;
  kind: 'koelcel' | 'vriezer';
  bezig: boolean;
  onAanwezig: (item: KoelcelCheckItem) => void;
  onNaarMep: (item: KoelcelCheckItem) => void;
  onGehaald: (item: KoelcelCheckItem) => void;
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
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'hsl(var(--muted-foreground))',
            backgroundColor: 'hsl(var(--muted) / 0.6)',
            padding: '3px 10px',
            borderRadius: '999px',
            fontFamily: lettertype,
          }}
        >
          {gedaan}/{items.length}
        </span>
      </div>

      {kind === 'koelcel' && (
        <p
          style={{
            margin: '4px 4px 8px',
            fontSize: '12px',
            color: 'hsl(var(--muted-foreground))',
            fontFamily: lettertype,
          }}
        >
          Dit moet standaard in de koelcel liggen. Ontbreekt het? Tik op "Naar MEP" — dan komt het vanzelf op de lijst.
        </p>
      )}

      <div>
        {items.map((item) =>
          kind === 'koelcel' ? (
            <KoelcelRij
              key={item.id}
              item={item}
              status={checks.get(item.id) ?? null}
              bezig={bezig}
              onAanwezig={() => onAanwezig(item)}
              onNaarMep={() => onNaarMep(item)}
            />
          ) : (
            <VriezerRij
              key={item.id}
              item={item}
              status={checks.get(item.id) ?? null}
              bezig={bezig}
              onAanwezig={() => undefined}
              onGehaald={() => onGehaald(item)}
              onNaarMep={() => onNaarMep(item)}
            />
          ),
        )}
      </div>
    </div>
  );
}

/**
 * Voorraad-check op de sluitlijst (West). Koelcel-backup controleren; wat
 * ontbreekt gaat met één tik naar de MEP. Vriezer-items printen bij het
 * overzetten meteen een "Ontdooid"-sticker.
 */
export function KoelcelCheckBlok({ vestiging, datum }: { vestiging: string; datum: string }) {
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const checksQuery = useKoelcelChecks(vestiging, datum);
  const { zetStatus, naarMep } = useKoelcelCheckMutaties(vestiging, datum);
  const printSticker = useCreateStickerPrintJob();

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const checks = useMemo(() => {
    const map = new Map<string, KoelcelCheckStatus>();
    for (const c of checksQuery.data ?? []) map.set(c.item_id, c.status);
    return map;
  }, [checksQuery.data]);

  if (itemsQuery.isLoading || items.length === 0) return null;

  const bezig = zetStatus.isPending || naarMep.isPending;

  const handleAanwezig = (item: KoelcelCheckItem) => {
    const uit = checks.get(item.id) === 'aanwezig';
    zetStatus.mutate(
      { item, status: 'aanwezig', uit },
      { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') },
    );
  };

  const handleNaarMep = async (item: KoelcelCheckItem) => {
    // Ongedaan maken: alleen de check weghalen; de MEP-taak blijft bewust staan.
    if (checks.has(item.id)) {
      zetStatus.mutate(
        { item, status: checks.get(item.id)!, uit: true },
        { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') },
      );
      return;
    }
    try {
      const res = await naarMep.mutateAsync(item);
      if (res.dubbel) {
        toast.info(`"${item.naam}" staat al op de MEP-lijst`);
      } else {
        toast.success(`"${item.naam}" staat op de MEP-lijst`);
      }
    } catch (e: any) {
      toast.error('Naar MEP mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const handleGehaald = async (item: KoelcelCheckItem) => {
    const uit = checks.get(item.id) === 'uit_vriezer';
    if (uit) {
      zetStatus.mutate(
        { item, status: 'uit_vriezer', uit: true },
        { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') },
      );
      return;
    }
    zetStatus.mutate(
      { item, status: 'uit_vriezer', uit: false },
      { onError: () => toast.error('Niet opgeslagen — probeer opnieuw') },
    );
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

  const koelcelItems = items.filter((i) => i.type === 'koelcel');
  const vriezerItems = items.filter((i) => i.type === 'vriezer');

  return (
    <div style={{ marginTop: '8px' }}>
      <CheckBlok
        titel="Voorraad koelcel"
        items={koelcelItems}
        checks={checks}
        kind="koelcel"
        bezig={bezig}
        onAanwezig={handleAanwezig}
        onNaarMep={handleNaarMep}
        onGehaald={handleGehaald}
      />
      <CheckBlok
        titel="Uit de vriezer (ontdooien)"
        items={vriezerItems}
        checks={checks}
        kind="vriezer"
        bezig={bezig}
        onAanwezig={handleAanwezig}
        onNaarMep={handleNaarMep}
        onGehaald={handleGehaald}
      />
    </div>
  );
}
