import { useMemo, useState } from 'react';
import { Trash2, AlertTriangle, Leaf, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWastePickups, type WastePickup, type WasteFraction } from '@/hooks/useWastePickups';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DAY_NAMES = ['Zon', 'Maa', 'Din', 'Woe', 'Don', 'Vri', 'Zat'];
const MONTH_NAMES = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const FRACTION_META: Record<WasteFraction, {
  label: string;
  Icon: typeof Trash2;
  bg: string;
  border: string;
  text: string;
  swatch: string;
}> = {
  restafval: {
    label: 'Restafval',
    Icon: Trash2,
    bg: 'bg-muted-foreground/15',
    border: 'border-muted-foreground/40',
    text: 'text-foreground',
    swatch: 'bg-muted-foreground/40',
  },
  gft: {
    label: 'GFT',
    Icon: Leaf,
    bg: 'bg-primary/15',
    border: 'border-primary/50',
    text: 'text-primary',
    swatch: 'bg-primary/60',
  },
  papier: {
    label: 'Papier',
    Icon: Newspaper,
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/50',
    text: 'text-blue-700 dark:text-blue-300',
    swatch: 'bg-blue-500/60',
  },
};

const SOURCE_LABEL = { tst: 'TST', gemeente: 'Gemeente' } as const;

// Format YYYY-MM-DD in Europe/Amsterdam from a Date
function fmtNl(d: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function todayNl() {
  return fmtNl(new Date());
}

// Monday of the week containing date d (in local terms — sufficient for display)
function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  const dow = x.getDay(); // 0=Sun..6=Sat
  const diff = (dow + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

export function WasteCalendarCard() {
  const { userLocation } = useUserLocation();
  const { data: pickups, isLoading } = useWastePickups(userLocation);
  const [weekOffset, setWeekOffset] = useState(0);

  const { days, weekLabel } = useMemo(() => {
    const today = todayNl();
    const baseMonday = startOfWeekMonday(new Date());
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

    const arr: { date: string; dayNum: number; dayName: string; isToday: boolean; pickups: WastePickup[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(d.getDate() + i);
      const dateStr = fmtNl(d);
      arr.push({
        date: dateStr,
        dayNum: d.getDate(),
        dayName: DAY_NAMES[d.getDay()],
        isToday: dateStr === today,
        pickups: (pickups ?? []).filter((p) => p.pickup_date === dateStr),
      });
    }

    const first = new Date(baseMonday);
    const last = new Date(baseMonday);
    last.setDate(last.getDate() + 6);
    const sameMonth = first.getMonth() === last.getMonth();
    const label = sameMonth
      ? `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[first.getMonth()]}`
      : `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]}`;

    return { days: arr, weekLabel: label };
  }, [pickups, weekOffset]);

  if (userLocation !== 'Midsland') return null;

  const today = todayNl();

  return (
    <div className="bg-card rounded-[20px] p-5 shadow-sm border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Trash2 size={20} className="text-primary" />
          <h3 className="font-semibold text-foreground">Afvalkalender</h3>
        </div>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Vandaag
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[10px]"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Vorige week"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-xs font-medium text-foreground min-w-[110px] text-center px-1">
            {weekLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-[10px]"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Volgende week"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Laden…</div>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const isPast = d.date < today;
              const hasMissed = d.pickups.some(
                (p) => !p.sluit_completed && !p.acknowledged_at && isPast,
              );
              // Sort: TST first (large), then Gemeente
              const sorted = [...d.pickups].sort((a, b) =>
                a.source === b.source ? 0 : a.source === 'tst' ? -1 : 1,
              );
              return (
                <div
                  key={d.date}
                  className={[
                    'flex flex-col rounded-[14px] border min-h-[124px] p-1.5 transition-colors',
                    d.isToday ? 'ring-2 ring-primary border-transparent bg-primary/[0.03]' : 'border-border',
                    hasMissed ? 'border-destructive border-2' : '',
                  ].join(' ')}
                >
                  {/* Day header */}
                  <div className="flex items-baseline justify-between px-1 mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {d.dayName}
                    </span>
                    <span className={`text-xs font-bold ${d.isToday ? 'text-primary' : 'text-foreground'}`}>
                      {d.dayNum}
                    </span>
                  </div>

                  {/* Pickup chips */}
                  <div className="flex flex-col gap-1 flex-1">
                    {sorted.length === 0 && (
                      <div className="flex items-center justify-center flex-1">
                        <span className="text-[10px] text-muted-foreground">—</span>
                      </div>
                    )}
                    {sorted.map((p) => {
                      const meta = FRACTION_META[p.fraction];
                      const Icon = meta.Icon;
                      const isTst = p.source === 'tst';
                      const missed = !p.sluit_completed && !p.acknowledged_at && isPast;
                      return (
                        <Tooltip key={p.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={[
                                'relative rounded-[8px] border flex items-center gap-1 px-1.5 py-1',
                                meta.bg, meta.border, meta.text,
                                isTst ? 'font-semibold' : '',
                              ].join(' ')}
                              aria-label={`${SOURCE_LABEL[p.source]} ${meta.label}`}
                            >
                              <Icon size={isTst ? 14 : 11} className="shrink-0" />
                              <div className="flex flex-col leading-tight min-w-0">
                                <span className={`${isTst ? 'text-[10px]' : 'text-[9px]'} truncate`}>
                                  {meta.label}
                                </span>
                                <span className={`text-[8px] opacity-70 ${isTst ? '' : 'hidden'}`}>
                                  TST
                                </span>
                              </div>
                              {missed && (
                                <AlertTriangle
                                  size={10}
                                  className="absolute -top-1 -right-1 text-destructive bg-background rounded-full"
                                />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              <strong>{SOURCE_LABEL[p.source]}</strong> — {meta.label}
                              <br />
                              {isTst ? 'Grote container' : 'Kleine container'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-primary/15 border border-primary/50 text-primary">
                <Leaf size={11} /><span className="text-[9px] font-semibold">GFT</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-blue-500/15 border border-blue-500/50 text-blue-700 dark:text-blue-300">
                <Newspaper size={11} /><span className="text-[9px] font-semibold">Papier</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-muted-foreground/15 border border-muted-foreground/40">
                <Trash2 size={11} /><span className="text-[9px] font-semibold">Restafval</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span><strong className="text-foreground">TST</strong> = grote container · <strong className="text-foreground">Gemeente</strong> = kleine</span>
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

