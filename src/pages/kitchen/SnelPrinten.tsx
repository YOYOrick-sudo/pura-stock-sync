import { useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Snowflake, ChefHat, Tag, Minus, Plus, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StickerProductCombobox } from '@/components/kitchen/StickerProductCombobox';
import {
  useCreateStickerPrintJob,
  type StickerProduct,
} from '@/hooks/useStickerProducten';
import {
  buildStickerZpl,
  labelaryPreviewUrl,
  type StickerType,
} from '@/lib/labelZpl';

const DEFAULT_THT: Record<StickerType, number> = {
  ontdooid: 2,
  bereid: 3,
  vrij: 0,
};
const THT_RANGE: Record<StickerType, { min: number; max: number }> = {
  ontdooid: { min: 1, max: 7 },
  bereid: { min: 1, max: 14 },
  vrij: { min: 0, max: 0 },
};

const TYPES: { key: StickerType; label: string; icon: typeof Snowflake }[] = [
  { key: 'ontdooid', label: 'Ontdooid', icon: Snowflake },
  { key: 'bereid', label: 'Bereid', icon: ChefHat },
  { key: 'vrij', label: 'Vrij', icon: Tag },
];

function fmt(d: Date) {
  return format(d, 'EEE dd-MM', { locale: nl });
}

export default function SnelPrinten() {
  const [type, setType] = useState<StickerType>('ontdooid');
  const [naam, setNaam] = useState('');
  const [thtDagen, setThtDagen] = useState<number>(DEFAULT_THT.ontdooid);
  const inputRef = useRef<HTMLDivElement>(null);
  const createJob = useCreateStickerPrintJob();

  const today = useMemo(() => new Date(), []);
  const datum1 = fmt(today);
  const datum2 = type === 'vrij' ? undefined : fmt(addDays(today, thtDagen));

  const zpl = useMemo(
    () =>
      buildStickerZpl({
        type,
        naam: naam.trim() || 'Voorbeeld',
        datum1,
        datum2,
      }),
    [type, naam, datum1, datum2],
  );
  const previewUrl = labelaryPreviewUrl(zpl);

  const handleTypeChange = (t: StickerType) => {
    setType(t);
    setThtDagen(DEFAULT_THT[t]);
  };

  const handlePickSuggestion = (p: StickerProduct) => {
    setNaam(p.naam);
    if (p.laatst_type) {
      setType(p.laatst_type);
      setThtDagen(
        p.laatst_tht_dagen ??
          DEFAULT_THT[p.laatst_type],
      );
    }
  };

  const adjustTht = (delta: number) => {
    const { min, max } = THT_RANGE[type];
    setThtDagen((n) => Math.max(min, Math.min(max, n + delta)));
  };

  const handlePrint = async () => {
    const cleanNaam = naam.trim();
    if (cleanNaam.length < 2) {
      toast.error('Vul een productnaam in');
      return;
    }
    try {
      await createJob.mutateAsync({
        type,
        naam: cleanNaam,
        datum1,
        datum2,
        tht_dagen: type === 'vrij' ? null : thtDagen,
      });
      toast.success('Sticker verzonden naar printer');
      setNaam('');
      // Type + THT blijven staan voor herhaal-flow
      requestAnimationFrame(() => {
        const el = inputRef.current?.querySelector('input');
        el?.focus();
      });
    } catch (e: any) {
      toast.error(e?.message ?? 'Printen mislukt');
    }
  };

  const canPrint = naam.trim().length >= 2 && !createJob.isPending;

  return (
    <KitchenLayout title="Snel printen" subtitle="Ontdooi-, bereid- en vrije stickers">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Stap 1 — Type */}
          <Card className="p-4 sm:p-5 bg-card shadow-sm">
            <div className="text-caption mb-3">1. Type sticker</div>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(({ key, label, icon: Icon }) => {
                const active = type === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleTypeChange(key)}
                    className={cn(
                      'min-h-[64px] rounded-polar-lg border-1.5 flex flex-col items-center justify-center gap-1 transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-input hover:border-primary/40',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Stap 2 — Product */}
          <Card className="p-4 sm:p-5 bg-card shadow-sm">
            <div className="text-caption mb-3">2. Product</div>
            <div ref={inputRef}>
              <StickerProductCombobox
                value={naam}
                onChange={setNaam}
                onPickSuggestion={handlePickSuggestion}
                placeholder="Typ productnaam…"
                autoFocus
              />
            </div>
          </Card>

          {/* Stap 3 — Datums */}
          <Card className="p-4 sm:p-5 bg-card shadow-sm">
            <div className="text-caption mb-3">3. Datums</div>

            {type === 'vrij' ? (
              <div className="rounded-polar-lg bg-muted/50 px-4 py-3">
                <div className="text-xs text-muted-foreground">Datum</div>
                <div className="text-lg font-semibold text-foreground capitalize">{datum1}</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-polar-lg bg-muted/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">
                    {type === 'ontdooid' ? 'Uit vriezer' : 'Bereid op'}
                  </div>
                  <div className="text-lg font-semibold text-foreground capitalize">{datum1}</div>
                </div>

                <div className="rounded-polar-lg border-1.5 border-input px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground">Gebruiken t/m</div>
                    <div className="text-lg font-semibold text-foreground capitalize">
                      {datum2} <span className="text-sm font-normal text-muted-foreground">(+{thtDagen}d)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustTht(-1)}
                      className="h-11 w-11 rounded-polar-md border-1.5 border-input hover:bg-muted flex items-center justify-center"
                      aria-label="Minder dagen"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="w-12 text-center text-lg font-semibold">{thtDagen}</div>
                    <button
                      type="button"
                      onClick={() => adjustTht(+1)}
                      className="h-11 w-11 rounded-polar-md border-1.5 border-input hover:bg-muted flex items-center justify-center"
                      aria-label="Meer dagen"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Print */}
          <Button
            onClick={handlePrint}
            disabled={!canPrint}
            className="w-full min-h-[56px] text-base"
          >
            <Printer className="h-5 w-5 mr-2" />
            {createJob.isPending ? 'Bezig…' : 'Print sticker'}
          </Button>
        </div>

        {/* Voorbeeld */}
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="p-4 bg-card shadow-sm">
            <div className="text-caption mb-3">Voorbeeld</div>
            <div className="bg-white rounded-polar-md border border-border p-2 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Sticker voorbeeld"
                className="max-w-full h-auto"
                loading="lazy"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              57 × 32 mm • Zebra ZD411d
            </p>
          </Card>
        </div>
      </div>
    </KitchenLayout>
  );
}
