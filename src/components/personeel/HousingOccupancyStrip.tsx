import { useMemo } from "react";
import { eachDayOfInterval, format, isWithinInterval, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import type { Person, PersoneelHousing } from "@/types/personeel";
import { isActiveOn } from "@/lib/personeel-utils";

interface HousingOccupancyStripProps {
  housing: PersoneelHousing[];
  people: Person[];
  windowStart: Date;
  windowEnd: Date;
}

export function HousingOccupancyStrip({ housing, people, windowStart, windowEnd }: HousingOccupancyStripProps) {
  const today = useMemo(() => new Date(), []);

  const tiles = useMemo(() => {
    const days = eachDayOfInterval({ start: windowStart, end: windowEnd });
    return housing.map(h => {
      const residents = people.filter(p => p.housing_id === h.id);

      // count per day (over residents only)
      const counts: number[] = days.map(day => {
        let c = 0;
        for (const p of residents) {
          if (isWithinInterval(day, { start: parseISO(p.start_date), end: parseISO(p.end_date) })) {
            c++;
          }
        }
        return c;
      });

      const current = residents.filter(p => isActiveOn(p, today)).length;
      let peak = 0;
      let peakIdx = 0;
      for (let i = 0; i < counts.length; i++) {
        if (counts[i] > peak) {
          peak = counts[i];
          peakIdx = i;
        }
      }
      const peakDate = days[peakIdx];
      const cap = h.capacity ?? null;
      const overbookedCount = cap != null ? counts.filter(c => c > cap).length : 0;

      return { housing: h, counts, current, peak, peakDate, overbookedCount, cap };
    });
  }, [housing, people, windowStart, windowEnd, today]);

  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {tiles.map(t => {
        const { housing: h, counts, current, peak, peakDate, overbookedCount, cap } = t;
        const max = Math.max(peak, cap ?? 1, 1);
        const showPeakLine = peak > current || overbookedCount > 0;

        return (
          <div
            key={h.id}
            className="rounded-[14px] bg-card border border-border px-3 py-2.5 flex flex-col gap-1.5"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: h.color }}
                />
                <span className="text-sm font-medium truncate">{h.name}</span>
              </div>
              <div className="text-xs tabular-nums text-muted-foreground flex-shrink-0">
                <span className="text-foreground font-medium">{current}</span>
                <span className="mx-1">→</span>
                <span className="text-foreground font-medium">{peak}</span>
                {cap != null && <span> / {cap}</span>}
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-end gap-[1px] h-6 w-full" aria-hidden="true">
              {counts.map((c, i) => {
                const heightPct = c === 0 ? 6 : Math.max(10, (c / max) * 100);
                const isOver = cap != null && c > cap;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-[1px] transition-opacity"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: c === 0
                        ? "hsl(var(--muted))"
                        : isOver
                          ? "hsl(var(--destructive))"
                          : h.color,
                      opacity: c === 0 ? 0.5 : 1,
                    }}
                  />
                );
              })}
            </div>

            {/* Status line */}
            {showPeakLine && (
              <div className={`text-[11px] ${overbookedCount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                Piek: {peak} op {format(peakDate, "d MMM", { locale: nl })}
                {overbookedCount > 0 && (
                  <> · {overbookedCount} dag{overbookedCount === 1 ? "" : "en"} overboekt</>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
