import { useMemo } from "react";
import { eachDayOfInterval, format, isWithinInterval, parseISO, isAfter, isSameDay, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Info } from "lucide-react";
import type { Person, PersoneelHousing } from "@/types/personeel";
import { isActiveOn } from "@/lib/personeel-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HousingOccupancyStripProps {
  housing: PersoneelHousing[];
  people: Person[];
  windowStart: Date;
  windowEnd: Date;
}

type Status = "free" | "almost" | "full" | "overbooked" | "unknown";

const statusConfig: Record<Status, { label: string; cls: string }> = {
  free:       { label: "Ruimte",     cls: "bg-primary/10 text-primary" },
  almost:     { label: "Bijna vol",  cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400" },
  full:       { label: "Vol",        cls: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400" },
  overbooked: { label: "Overboekt",  cls: "bg-destructive/10 text-destructive" },
  unknown:    { label: "—",          cls: "bg-muted text-muted-foreground" },
};

/** Group consecutive day-indices into ranges. */
function groupRanges(indices: number[]): Array<[number, number]> {
  if (indices.length === 0) return [];
  const sorted = [...indices].sort((a, b) => a - b);
  const out: Array<[number, number]> = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      out.push([start, prev]);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  out.push([start, prev]);
  return out;
}

/** Format a date range in friendly Dutch. Picks month-name style for long ranges, day style for short. */
function formatRange(start: Date, end: Date): string {
  const days = differenceInDays(end, start) + 1;
  if (days >= 25) {
    // ~full month or more
    const startMonth = format(start, "LLLL", { locale: nl });
    const endMonth = format(end, "LLLL", { locale: nl });
    if (startMonth === endMonth) return startMonth;
    return `${startMonth} en ${endMonth}`;
  }
  if (days >= 8) {
    return `${format(start, "d MMM", { locale: nl })} t/m ${format(end, "d MMM", { locale: nl })}`;
  }
  // short stretch
  if (isSameDay(start, end)) {
    return format(start, "d MMM", { locale: nl });
  }
  return `${format(start, "d")} t/m ${format(end, "d MMM", { locale: nl })}`;
}

function joinRanges(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} en ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} en ${parts[parts.length - 1]}`;
}

export function HousingOccupancyStrip({ housing, people, windowStart, windowEnd }: HousingOccupancyStripProps) {
  const today = useMemo(() => new Date(), []);

  const tiles = useMemo(() => {
    const days = eachDayOfInterval({ start: windowStart, end: windowEnd });
    return housing.map(h => {
      const residents = people.filter(p => p.housing_id === h.id);
      const cap = h.capacity;

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

      // status now
      let status: Status = "unknown";
      if (cap == null) {
        status = "unknown";
      } else if (current > cap) {
        status = "overbooked";
      } else if (current === cap) {
        status = "full";
      } else if (current >= Math.ceil(cap * 0.8)) {
        status = "almost";
      } else {
        status = "free";
      }
      // any overbooked day in window upgrades status
      const overbookedIdx: number[] = cap != null ? counts.map((c, i) => c > cap ? i : -1).filter(i => i >= 0) : [];
      if (overbookedIdx.length > 0) status = "overbooked";

      // Drukke periodes: dagen waar count >= cap (vol of overboekt)
      const busyIdx: number[] = cap != null ? counts.map((c, i) => c >= cap ? i : -1).filter(i => i >= 0) : [];
      const busyRanges = groupRanges(busyIdx);
      const overbookedRanges = groupRanges(overbookedIdx);

      // Eerste vrije dag vanaf vandaag (alleen relevant als nu vol/overboekt)
      let firstFreeDate: Date | null = null;
      if (cap != null && current >= cap) {
        for (let i = 0; i < days.length; i++) {
          if (!isAfter(today, days[i]) && counts[i] < cap) {
            firstFreeDate = days[i];
            break;
          }
        }
      }

      // Format busy label
      let busyLabel: string | null = null;
      if (busyRanges.length > 0 && cap != null) {
        const formatted = busyRanges.slice(0, 3).map(([a, b]) => formatRange(days[a], days[b]));
        const overbookedInBusy = overbookedRanges.length > 0;
        busyLabel = `${joinRanges(formatted)}${overbookedInBusy ? " (overboekt)" : ""}`;
        if (busyRanges.length > 3) busyLabel += ` +${busyRanges.length - 3} meer`;
      }

      const freeLabel = firstFreeDate
        ? `vanaf ${format(firstFreeDate, "d MMMM", { locale: nl })}`
        : null;

      return { housing: h, counts, current, cap, status, busyLabel, freeLabel, overbookedIdx };
    });
  }, [housing, people, windowStart, windowEnd, today]);

  if (tiles.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map(t => {
          const { housing: h, counts, current, cap, status, busyLabel, freeLabel, overbookedIdx } = t;
          const cfg = statusConfig[status];
          const overbookedSet = new Set(overbookedIdx);

          return (
            <div
              key={h.id}
              className="rounded-[14px] bg-card border border-border px-4 py-3 space-y-2.5"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: h.color }}
                  />
                  <span className="text-sm font-semibold truncate">{h.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {cap != null && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Uitleg"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                      Bezetting in de periode die je in de tijdlijn ziet. Bewoners lossen elkaar af, dus het kan tijdelijk vol zijn en daarna weer ruimte hebben.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Info-regels */}
              <div className="space-y-1 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-10 flex-shrink-0">Nu</span>
                  <span>
                    {cap != null
                      ? <><span className="font-medium">{current}</span> van {cap} plekken bezet</>
                      : <><span className="font-medium">{current}</span> {current === 1 ? "bewoner" : "bewoners"}</>
                    }
                  </span>
                </div>
                {busyLabel && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-10 flex-shrink-0">Druk</span>
                    <span className={overbookedIdx.length > 0 ? "text-destructive" : ""}>{busyLabel}</span>
                  </div>
                )}
                {freeLabel && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-10 flex-shrink-0">Vrij</span>
                    <span>{freeLabel}</span>
                  </div>
                )}
              </div>

              {/* Subtiele tijdlijn-balk */}
              <div className="flex items-end gap-[1px] h-3 w-full opacity-70" aria-hidden="true">
                {counts.map((c, i) => {
                  const max = Math.max(cap ?? 1, ...counts, 1);
                  const heightPct = c === 0 ? 8 : Math.max(15, (c / max) * 100);
                  const isOver = overbookedSet.has(i);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-[1px]"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: c === 0
                          ? "hsl(var(--muted))"
                          : isOver
                            ? "hsl(var(--destructive))"
                            : h.color,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
