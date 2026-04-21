import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { addDays, format, getDay, isSameMonth, startOfDay, subDays, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { usePeople, useHousing, useLocations } from "@/hooks/personeel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlanningBlock } from "@/components/personeel/PlanningBlock";
import { DensityBar } from "@/components/personeel/DensityBar";

const DAYS_BEFORE = 182;
const DAYS_AFTER = 182;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1;

export default function Tijdlijn() {
  const { data: people = [], isLoading } = usePeople();
  const { data: housing = [] } = useHousing();
  const { data: locations = [] } = useLocations();

  const [isLg, setIsLg] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  useEffect(() => {
    const onResize = () => setIsLg(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cellWidth = isLg ? 28 : 32;
  const rowHeight = isLg ? 36 : 40;

  const today = useMemo(() => startOfDay(new Date()), []);
  const windowStart = useMemo(() => subDays(today, DAYS_BEFORE), [today]);
  const days = useMemo(
    () => Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(windowStart, i)),
    [windowStart]
  );

  const totalWidth = TOTAL_DAYS * cellWidth;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, TOTAL_DAYS - 1]);

  const scrollToToday = useCallback((smooth: boolean) => {
    const c = scrollRef.current;
    if (!c) return;
    const target = Math.max(0, DAYS_BEFORE * cellWidth - c.clientWidth * 0.4);
    c.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  }, [cellWidth]);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    requestAnimationFrame(() => scrollToToday(false));
  }, [scrollToToday]);

  // Track visible range for density bar recalibration
  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    let frame: number;
    const update = () => {
      const startIdx = Math.floor(c.scrollLeft / cellWidth);
      const endIdx = Math.min(TOTAL_DAYS - 1, Math.ceil((c.scrollLeft + c.clientWidth) / cellWidth));
      setVisibleRange([startIdx, endIdx]);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    c.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      c.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame);
    };
  }, [cellWidth]);

  // Group people by location for tracks
  const locById = useMemo(() => {
    const m = new Map(locations.map(l => [l.id, l.name]));
    return m;
  }, [locations]);

  const sortedPeople = useMemo(
    () => [...people].sort((a, b) => {
      const la = locById.get(a.location_id) ?? "";
      const lb = locById.get(b.location_id) ?? "";
      if (la !== lb) return la.localeCompare(lb);
      return a.name.localeCompare(b.name);
    }),
    [people, locById]
  );

  // Compute month segments for sticky labels
  const monthSegments = useMemo(() => {
    const segments: { startIdx: number; endIdx: number; label: string }[] = [];
    let currentStart = 0;
    for (let i = 1; i <= days.length; i++) {
      if (i === days.length || !isSameMonth(days[i], days[currentStart])) {
        segments.push({
          startIdx: currentStart,
          endIdx: i - 1,
          label: format(days[currentStart], "MMMM yyyy", { locale: nl }),
        });
        currentStart = i;
      }
    }
    return segments;
  }, [days]);

  // Weekend stripe offsets
  const weekendOffsets = useMemo(() => {
    const offs: number[] = [];
    days.forEach((d, i) => {
      const dow = getDay(d);
      if (dow === 0 || dow === 6) offs.push(i);
    });
    return offs;
  }, [days]);

  const todayOffset = DAYS_BEFORE * cellWidth;

  const NAME_COL_WIDTH = 180;

  if (isLoading) return <Skeleton className="h-[600px] w-full" />;

  return (
    <div
      className="relative rounded-[20px] border border-border bg-card overflow-hidden"
      style={{
        ["--timeline-date-h" as string]: "40px",
        ["--timeline-density-h" as string]: "32px",
        ["--timeline-header-h" as string]: "calc(var(--timeline-date-h) + var(--timeline-density-h))",
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="text-sm text-muted-foreground">
          {format(windowStart, "d MMM yyyy", { locale: nl })} – {format(addDays(windowStart, TOTAL_DAYS - 1), "d MMM yyyy", { locale: nl })}
        </div>
        <Button size="sm" onClick={() => scrollToToday(true)}>Vandaag</Button>
      </div>

      <div className="flex" style={{ maxHeight: "70vh" }}>
        {/* Names column */}
        <div
          className="sticky left-0 z-30 bg-card border-r border-border overflow-y-auto"
          style={{ width: NAME_COL_WIDTH, maxHeight: "70vh" }}
        >
          <div style={{ height: "var(--timeline-header-h)" }} className="border-b border-border bg-card sticky top-0 z-10" />
          {sortedPeople.map(p => (
            <div
              key={p.id}
              className="px-3 flex items-center text-sm border-b border-border/50 truncate"
              style={{ height: rowHeight }}
              title={p.name}
            >
              {p.name}
            </div>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto"
          style={{ maxHeight: "70vh", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="relative" style={{ width: totalWidth, minWidth: totalWidth }}>
            {/* Sticky header (months + days) */}
            <div className="sticky top-0 z-20 bg-card border-b border-border" style={{ height: "var(--timeline-date-h)", width: totalWidth }}>
              {/* Month labels row */}
              <div className="relative h-5 border-b border-border/50" style={{ width: totalWidth }}>
                {monthSegments.map(seg => (
                  <div
                    key={seg.startIdx}
                    className="absolute top-0 h-full text-xs font-medium text-muted-foreground flex items-center"
                    style={{
                      left: seg.startIdx * cellWidth,
                      width: (seg.endIdx - seg.startIdx + 1) * cellWidth,
                    }}
                  >
                    <span className="sticky left-2 px-1 bg-card whitespace-nowrap">
                      {seg.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Day numbers row */}
              <div className="relative h-5" style={{ width: totalWidth }}>
                {days.map((d, i) => {
                  const dow = getDay(d);
                  const isWeekend = dow === 0 || dow === 6;
                  const isToday = i === DAYS_BEFORE;
                  return (
                    <div
                      key={i}
                      className={`absolute text-[10px] flex items-center justify-center ${isWeekend ? "bg-muted/40" : ""} ${isToday ? "text-destructive font-bold" : "text-muted-foreground"}`}
                      style={{ left: i * cellWidth, width: cellWidth, height: "100%" }}
                    >
                      {format(d, "d")}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Density bar */}
            <div
              className="sticky z-10 border-b border-border"
              style={{ top: "var(--timeline-date-h)", height: "var(--timeline-density-h)", width: totalWidth }}
            >
              <DensityBar
                people={people}
                windowStart={windowStart}
                totalDays={TOTAL_DAYS}
                cellWidth={cellWidth}
                height={32}
                visibleStartIdx={visibleRange[0]}
                visibleEndIdx={visibleRange[1]}
              />
            </div>

            {/* Tracks */}
            <div className="relative" style={{ width: totalWidth }}>
              {/* Weekend stripes */}
              {weekendOffsets.map(i => (
                <div
                  key={`w-${i}`}
                  className="absolute top-0 bottom-0 bg-muted/30 pointer-events-none"
                  style={{ left: i * cellWidth, width: cellWidth }}
                />
              ))}
              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-destructive z-10 pointer-events-none"
                style={{ left: todayOffset }}
              />
              {/* Person rows */}
              {sortedPeople.map((p, idx) => {
                const h = housing.find(x => x.id === p.housing_id);
                return (
                  <div
                    key={p.id}
                    className="relative border-b border-border/50"
                    style={{ height: rowHeight }}
                  >
                    {/* Only render block if it intersects window */}
                    {(() => {
                      const startIdx = differenceInCalendarDays(new Date(p.start_date), windowStart);
                      const endIdx = differenceInCalendarDays(new Date(p.end_date), windowStart);
                      if (endIdx < 0 || startIdx >= TOTAL_DAYS) return null;
                      return (
                        <PlanningBlock
                          person={p}
                          housing={h}
                          windowStart={windowStart}
                          cellWidth={cellWidth}
                          rowHeight={rowHeight}
                          locationName={locById.get(p.location_id)}
                        />
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
