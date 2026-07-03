import { useMemo, useRef, useState } from 'react';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Snowflake, ChefHat, Tag, Minus, Plus, Printer, RotateCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StickerProductCombobox } from '@/components/kitchen/StickerProductCombobox';
import {
  useCreateStickerPrintJob,
  usePrintJobsToday,
  useReprintJob,
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

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'done') return 'secondary';
  if (s === 'error') return 'destructive';
  if (s === 'printing') return 'default';
  return 'outline';
}

function statusLabel(s: string): string {
  if (s === 'done') return 'Geprint';
  if (s === 'error') return 'Fout';
  if (s === 'printing') return 'Bezig';
  return 'Wacht';
}

export default function SnelPrinten() {
  const [type, setType] = useState<StickerType>('ontdooid');
  const [naam, setNaam] = useState('');
  const [thtDagen, setThtDagen] = useState<number>(DEFAULT_THT.ontdooid);
  const inputRef = useRef<HTMLDivElement>(null);
  const createJob = useCreateStickerPrintJob();
  const { data: jobsToday = [] } = usePrintJobsToday();
  const reprint = useReprintJob();

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

  const handleReprint = async (job: (typeof jobsToday)[number]) => {
    try {
      await reprint.mutateAsync({ zpl: job.zpl, label_omschrijving: job.label_omschrijving });
      toast.success('Opnieuw naar printer gestuurd');
    } catch (e: any) {
      toast.error(e?.message ?? 'Herprinten mislukt');
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustTht(-1)}
                        disabled={thtDagen <= THT_RANGE[type].min}
                        className="h-8 w-8 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 disabled:hover:bg-card flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="h-8 w-8 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 disabled:hover:bg-card flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <div className="space-y-1.5">
              <Button onClick={handlePrint} disabled={!canPrint} className="w-full h-11">
                <Printer className="h-4 w-4 mr-2" />
                {createJob.isPending ? 'Bezig…' : 'Print sticker'}
              </Button>
              {!canPrint && !createJob.isPending && (
                <p className="text-xs text-muted-foreground text-center">Typ eerst een productnaam</p>
              )}
            </div>
          </div>

          {/* Rechter kolom */}
          <div className="lg:sticky lg:top-4 h-fit space-y-3">
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
              </div>
            </Card>

            <Card className="p-4 bg-card shadow-sm">
              <SectionTitle label="Vandaag geprint" />
              {jobsToday.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nog niets vandaag.</p>
              ) : (
                <ul className="space-y-2">
                  {jobsToday.map((j) => {
                    const tijd = format(new Date(j.created_at), 'HH:mm');
                    return (
                      <li
                        key={j.id}
                        className="flex items-center gap-2 rounded-polar-md bg-muted/40 px-2.5 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-foreground truncate">
                            {j.label_omschrijving || '—'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground tabular-nums">{tijd}</span>
                            <Badge variant={statusVariant(j.status)} className="text-[10px] px-1.5 py-0 h-4">
                              {statusLabel(j.status)}
                            </Badge>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReprint(j)}
                          disabled={reprint.isPending}
                          className="h-8 w-8 shrink-0 rounded-polar-md border border-input bg-card hover:bg-muted disabled:opacity-40 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Opnieuw printen"
                          title="Opnieuw printen"
                        >
                          {reprint.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
