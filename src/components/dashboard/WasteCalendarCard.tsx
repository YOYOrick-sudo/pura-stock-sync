import { useMemo } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useWastePickups, type WastePickup } from '@/hooks/useWastePickups';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FRACTION_COLOR: Record<string, string> = {
  restafval: 'bg-muted-foreground/30 text-foreground',
  gft: 'bg-primary/20 text-primary',
  papier: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
};
const FRACTION_LABEL = { restafval: 'Restafval', gft: 'GFT', papier: 'Papier' } as const;
const SOURCE_LABEL = { tst: 'TST (grote container)', gemeente: 'Gemeente (kleine container)' } as const;

const DAY_NAMES = ['Zon', 'Maa', 'Din', 'Woe', 'Don', 'Vri', 'Zat'];

function nlDateStr(offset = 0) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date(Date.now() + offset * 86400000));
}

export function WasteCalendarCard() {
  const { userLocation } = useUserLocation();
  const { data: pickups, isLoading } = useWastePickups(userLocation, 7);

  const days = useMemo(() => {
    const arr: { date: string; label: string; dayName: string; pickups: WastePickup[] }[] = [];
    const today = nlDateStr(0);
    for (let i = 0; i < 7; i++) {
      const dateStr = nlDateStr(i);
      const d = new Date(dateStr + 'T12:00:00');
      arr.push({
        date: dateStr,
        label: i === 0 ? 'Vandaag' : i === 1 ? 'Morgen' : `${d.getDate()}/${d.getMonth() + 1}`,
        dayName: DAY_NAMES[d.getDay()],
        pickups: (pickups ?? []).filter((p) => p.pickup_date === dateStr),
      });
    }
    return arr;
  }, [pickups]);

  if (userLocation !== 'Midsland') return null;

  return (
    <div className="bg-card rounded-[20px] p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trash2 size={20} className="text-primary" />
          <h3 className="font-semibold text-foreground">Afvalkalender</h3>
        </div>
        <span className="text-xs text-muted-foreground">7 dagen</span>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Laden…</div>
      ) : (
        <TooltipProvider>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, idx) => {
              const isToday = idx === 0;
              const hasMissed = d.pickups.some((p) => !p.sluit_completed && !p.acknowledged_at && p.pickup_date < nlDateStr(0));
              return (
                <div
                  key={d.date}
                  className={`flex flex-col items-center p-2 rounded-[14px] border min-h-[88px] ${
                    isToday ? 'ring-2 ring-primary border-transparent' : 'border-border'
                  } ${hasMissed ? 'border-destructive border-2' : ''}`}
                >
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">{d.dayName}</span>
                  <span className="text-xs font-semibold text-foreground mb-1.5">{d.label}</span>
                  <div className="flex flex-wrap gap-1 justify-center items-center flex-1">
                    {d.pickups.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
                    {d.pickups.map((p) => {
                      const sizeClass = p.source === 'tst' ? 'w-6 h-6' : 'w-4 h-4';
                      return (
                        <Tooltip key={p.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`relative ${sizeClass} rounded-md flex items-center justify-center ${FRACTION_COLOR[p.fraction]}`}
                              aria-label={`${SOURCE_LABEL[p.source]} ${FRACTION_LABEL[p.fraction]}`}
                            >
                              <Trash2 size={p.source === 'tst' ? 14 : 10} />
                              {hasMissed && !p.sluit_completed && !p.acknowledged_at && (
                                <AlertTriangle size={10} className="absolute -top-1 -right-1 text-destructive bg-background rounded-full" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              <strong>{SOURCE_LABEL[p.source]}</strong>
                              <br />
                              {FRACTION_LABEL[p.fraction]}
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

          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted-foreground/30" /> Restafval</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/20" /> GFT</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/20" /> Papier</div>
            <div className="flex items-center gap-1.5"><Trash2 size={14} /> TST groot · <Trash2 size={10} /> Gemeente klein</div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
