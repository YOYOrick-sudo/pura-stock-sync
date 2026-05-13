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
              const hasMissed = d.pickups.some(
                (p) => !p.sluit_completed && !p.acknowledged_at && p.date_in_past_check_today_str_lt(),
              );
              return null as any;
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
