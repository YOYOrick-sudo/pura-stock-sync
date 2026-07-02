import { useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Snowflake, ChefHat, Tag, Minus, Plus, Printer, Eye, Info } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

const TYPES: {
  key: StickerType;
  label: string;
  icon: typeof Snowflake;
  hint: string;
}[] = [
  { key: 'ontdooid', label: 'Ontdooid', icon: Snowflake, hint: 'Uit de vriezer • standaard +2 dagen' },
  { key: 'bereid', label: 'Bereid', icon: ChefHat, hint: 'Vers bereid • standaard +3 dagen' },
  { key: 'vrij', label: 'Vrij', icon: Tag, hint: 'Alleen datum, geen houdbaarheid' },
];

function fmt(d: Date) {
  return format(d, 'EEE dd-MM', { locale: nl });
}

function StepHeader({
  step,
  label,
  meta,
}: {
  step?: number;
  label: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {step !== undefined ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            {step}
          </span>
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Eye className="h-3 w-3" />
          </span>
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
    </div>
  );
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
      setThtDagen(p.laatst_tht_dagen ?? DEFAULT_THT[p.laatst_type]);
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
  const dateLabel = type === 'ontdooid' ? 'Uit vriezer' : type === 'bereid' ? 'Bereid op' : 'Datum';

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-4">


        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Linker kolom — stappen */}
          <div className="space-y-3">
            {/* Stap 1 — Type */}
            <Card className="p-4 sm:p-5 bg-card shadow-sm">
              <StepHeader step={1} label="Type sticker" meta={activeType.hint} />
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(({ key, label, icon: Icon }) => {
                  const active = type === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleTypeChange(key)}
                      className={cn(
                        'h-16 rounded-polar-md flex flex-col items-center justify-center gap-1 transition-colors',
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

            {/* Stap 2 — Product */}
            <Card className="p-4 sm:p-5 bg-card shadow-sm">
              <StepHeader step={2} label="Product" />
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
              <StepHeader
                step={3}
                label="Datums"
                meta={type === 'vrij' ? 'Geen houdbaarheid' : `Standaard +${DEFAULT_THT[type]} dagen`}
              />

              {type === 'vrij' ? (
                <div className="rounded-polar-md bg-muted/40 px-3 py-2.5">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{dateLabel}</div>
                  <div className="text-sm font-semibold text-foreground capitalize">
                    {datum1}
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-polar-md bg-muted/40 px-3 py-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{dateLabel}</div>
                    <div className="text-sm font-semibold text-foreground capitalize">
                      {datum1}
                    </div>
                  </div>

                  <div className="rounded-polar-md bg-muted/40 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gebruiken t/m</div>
                      <div className="text-sm font-semibold text-foreground capitalize truncate">
                        {datum2}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustTht(-1)}
                        disabled={thtDagen <= THT_RANGE[type].min}
                        className="h-8 w-8 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 disabled:hover:bg-card flex items-center justify-center transition-colors"
                        aria-label="Minder dagen"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-8 text-center text-sm font-semibold tabular-nums">
                        {thtDagen}
                        <span className="text-[10px] font-normal text-muted-foreground">d</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustTht(+1)}
                        disabled={thtDagen >= THT_RANGE[type].max}
                        className="h-8 w-8 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 disabled:hover:bg-card flex items-center justify-center transition-colors"
                        aria-label="Meer dagen"
                      >
                        <Plus className="h-3.5 w-3.5" />
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
              className="w-full h-11"
            >
              <Printer className="h-4 w-4 mr-2" />
              {createJob.isPending ? 'Bezig…' : 'Print sticker'}
            </Button>
          </div>


          {/* Rechter kolom — voorbeeld */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="p-4 bg-card shadow-sm">
              <StepHeader label="Voorbeeld" />

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
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
                <Printer className="h-3.5 w-3.5" />
                <span>57 × 32 mm • Zebra ZD411d</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
