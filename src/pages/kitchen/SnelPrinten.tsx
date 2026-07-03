import { useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Snowflake, ChefHat, Tag, Minus, Plus, Printer, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StickerProductCombobox } from '@/components/kitchen/StickerProductCombobox';
import {
  useCreateStickerPrintJob,
  useTopStickerProducten,
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
  ontdooid: { min: 1, max: 30 },
  bereid: { min: 1, max: 30 },
  vrij: { min: 0, max: 0 },
};
const AANTAL_RANGE = { min: 1, max: 20 };

const TYPES: {
  key: StickerType;
  label: string;
  icon: typeof Snowflake;
}[] = [
  { key: 'ontdooid', label: 'Ontdooid', icon: Snowflake },
  { key: 'bereid', label: 'Bereid', icon: ChefHat },
  { key: 'vrij', label: 'Vrij', icon: Tag },
];

function fmt(d: Date) {
  return format(d, 'EEE dd-MM', { locale: nl });
}

function SectionTitle({ label, meta }: { label: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  suffix?: string;
  ariaLabel: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-center gap-1" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className="h-8 w-8 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 disabled:hover:bg-card flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Minder"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="w-10 text-center text-sm font-semibold tabular-nums">
        {value}
        {suffix && <span className="text-[10px] font-normal text-muted-foreground">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className="h-8 w-8 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 disabled:hover:bg-card flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Meer"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function SnelPrinten() {
  const [type, setType] = useState<StickerType>('ontdooid');
  const [naam, setNaam] = useState('');
  const [thtDagen, setThtDagen] = useState<number>(DEFAULT_THT.ontdooid);
  const [aantal, setAantal] = useState<number>(1);
  const inputRef = useRef<HTMLDivElement>(null);
  const createJob = useCreateStickerPrintJob();
  const { data: topProducten = [] } = useTopStickerProducten(9);

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
      setThtDagen(p.laatst_tht_dagen ?? DEFAULT_THT[p.laatst_type]);
    }
  };

  const handlePrint = async () => {
    const cleanNaam = naam.trim();
    if (cleanNaam.length < 2) {
      toast.error('Vul een productnaam in');
      return;
    }
    try {
      const res = await createJob.mutateAsync({
        type,
        naam: cleanNaam,
        datum1,
        datum2,
        tht_dagen: type === 'vrij' ? null : thtDagen,
        aantal,
      });
      toast.success(
        res.count > 1 ? `${res.count} stickers verzonden naar printer` : 'Sticker verzonden naar printer',
      );
      setNaam('');
      setAantal(1);
      requestAnimationFrame(() => {
        const el = inputRef.current?.querySelector('input');
        el?.focus();
      });
    } catch (e: any) {
      toast.error(e?.message ?? 'Printen mislukt');
    }
  };

  const canPrint = naam.trim().length >= 2 && !createJob.isPending;
  const activeType = TYPES.find((t) => t.key === type)!;

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Linker kolom */}
          <div className="space-y-3">
            {/* Snelkeuzes */}
            {topProducten.length > 0 && (
              <Card className="p-4 sm:p-5 bg-card shadow-sm">
                <SectionTitle
                  label="Snelkeuzes"
                  meta={<span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />meest geprint</span>}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {topProducten.map((p) => {
                    const isActive = naam.trim().toLowerCase() === p.naam.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePickSuggestion(p)}
                        className={cn(
                          'min-h-[52px] rounded-polar-md px-3 py-2 text-left transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-primary/10 border border-primary/40'
                            : 'bg-muted/40 hover:bg-muted border border-transparent',
                        )}
                      >
                        <div className="text-sm font-semibold text-foreground truncate">{p.naam}</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                          {p.laatst_type ?? 'nieuw'} · {p.keer_geprint}×
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Type */}
            <Card className="p-4 sm:p-5 bg-card shadow-sm">
              <SectionTitle label="Type sticker" />
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(({ key, label, icon: Icon }) => {
                  const active = type === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleTypeChange(key)}
                      className={cn(
                        'h-16 rounded-polar-md flex flex-col items-center justify-center gap-1 transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/40 hover:bg-muted text-foreground border border-transparent',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Product */}
            <Card className="p-4 sm:p-5 bg-card shadow-sm">
              <SectionTitle label="Product" />
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

            {/* Datums */}
            <Card className="p-4 sm:p-5 bg-card shadow-sm">
              <SectionTitle label="Datums" />

              {type === 'vrij' ? (
                <div className="rounded-polar-md bg-muted/40 px-3 py-2.5">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Datum</div>
                  <div className="text-sm font-semibold text-foreground capitalize">{datum1}</div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-polar-md bg-muted/40 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {type === 'ontdooid' ? 'Uit vriezer' : 'Bereid op'}
                    </div>
                    <div className="text-sm font-semibold text-foreground capitalize">{datum1}</div>
                  </div>

                  <div className="rounded-polar-md bg-muted/40 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gebruiken t/m</div>
                      <div className="text-sm font-semibold text-foreground capitalize truncate">{datum2}</div>
                    </div>
                    <Stepper
                      value={thtDagen}
                      min={THT_RANGE[type].min}
                      max={THT_RANGE[type].max}
                      onChange={setThtDagen}
                      suffix="d"
                      ariaLabel="Aantal dagen houdbaarheid"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* Print + aantal inline */}
            <div className="space-y-1.5">
              <div className="flex items-stretch gap-2">
                <div className="flex items-center gap-1 rounded-polar-lg border border-border bg-card px-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setAantal((n) => Math.max(AANTAL_RANGE.min, n - 1))}
                    disabled={aantal <= AANTAL_RANGE.min}
                    className="h-9 w-9 rounded-polar-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Minder stickers"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="w-8 text-center text-sm font-semibold tabular-nums">
                    {aantal}
                    <span className="text-[10px] font-normal text-muted-foreground">×</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAantal((n) => Math.min(AANTAL_RANGE.max, n + 1))}
                    disabled={aantal >= AANTAL_RANGE.max}
                    className="h-9 w-9 rounded-polar-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Meer stickers"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button onClick={handlePrint} disabled={!canPrint} className="flex-1 h-11">
                  <Printer className="h-4 w-4 mr-2" />
                  {createJob.isPending
                    ? 'Bezig…'
                    : aantal > 1
                      ? `Print ${aantal} stickers`
                      : 'Print sticker'}
                </Button>
              </div>
              {!canPrint && !createJob.isPending && (
                <p className="text-xs text-muted-foreground text-center">Typ eerst een productnaam</p>
              )}
            </div>
          </div>

          {/* Rechter kolom */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="p-4 bg-card shadow-sm">
              <SectionTitle label="Voorbeeld" />
              <div className="aspect-[57/32] bg-white rounded-polar-md border border-border flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Sticker voorbeeld"
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Badge variant="secondary" className="text-xs capitalize">
                  {activeType.label}
                </Badge>
                {naam.trim() && (
                  <Badge variant="secondary" className="text-xs max-w-[180px] truncate">
                    {naam.trim()}
                  </Badge>
                )}
                {datum2 && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    t/m {datum2}
                  </Badge>
                )}
                {aantal > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {aantal}×
                  </Badge>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
