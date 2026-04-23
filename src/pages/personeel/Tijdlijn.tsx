import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { addDays, format, getDay, isSameMonth, startOfDay, differenceInCalendarDays } from "date-fns";
import { nl } from "date-fns/locale";
import { usePeople, useHousing, useLocations } from "@/hooks/personeel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlanningBlock } from "@/components/personeel/PlanningBlock";
import { DensityBar } from "@/components/personeel/DensityBar";
import type { Person } from "@/types/personeel";

const DAYS_BEFORE = 0;
const DAYS_AFTER = 365;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1;

type Row =
  | { kind: "header"; locId: string; locName: string }
  | { kind: "subheader"; locId: string }
  | { kind: "person"; person: Person };

const SUBHEADER_HEIGHT = 24;

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
  const headerHeight = Math.round(rowHeight * 0.8);

  const today = useMemo(() => startOfDay(new Date()), []);
  // Window starts today (DAYS_BEFORE = 0)
  const windowStart = today;
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
    c.scrollTo({ left: 0, behavior: smooth ? "smooth" : "auto" });
  }, []);

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

  // Build flattened rows: [header, person, person, header, person, ...]
  const rows: Row[] = useMemo(() => {
    const byLoc = new Map<string, Person[]>();
    people.forEach(p => {
      const arr = byLoc.get(p.location_id) ?? [];
      arr.push(p);
      byLoc.set(p.location_id, arr);
    });
    const sortedLocs = [...locations].sort((a, b) => a.sort_order - b.sort_order);
    const out: Row[] = [];
    sortedLocs.forEach(loc => {
      const ppl = (byLoc.get(loc.id) ?? []).sort((a, b) => a.name.localeCompare(b.name));
      if (ppl.length === 0) return;
      out.push({ kind: "header", locId: loc.id, locName: loc.name });
      out.push({ kind: "subheader", locId: loc.id });
      ppl.forEach(p => out.push({ kind: "person", person: p }));
    });
    return out;
  }, [people, locations]);

  // Pre-compute Y offsets per row so name-col and tracks-col stay in sync
  const { offsets, totalRowsHeight } = useMemo(() => {
    const offs: number[] = [];
    let acc = 0;
    rows.forEach(r => {
      offs.push(acc);
      if (r.kind === "header") acc += headerHeight;
      else if (r.kind === "subheader") acc += SUBHEADER_HEIGHT;
      else acc += rowHeight;
    });
    return { offsets: offs, totalRowsHeight: acc };
  }, [rows, headerHeight, rowHeight]);

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

  const todayOffset = 0;

  // Responsive: laptop = name 160 + slaapplek 120 = 280; tablet/mobile: name 140 + slaapplek 40 (dot only) = 180
  const NAME_WIDTH = isLg ? 160 : 140;
  const HOUSING_WIDTH = isLg ? 120 : 40;
  const NAME_COL_WIDTH = NAME_WIDTH + HOUSING_WIDTH;

  if (isLoading) return <Skeleton className="h-[600px] w-full" />;

  return (
    <div
      className="relative rounded-[20px] border border-border bg-card overflow-hidden w-full max-w-full min-w-0"
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
        {/* Names + slaapplek column */}
        <div
          className="sticky left-0 z-30 bg-card border-r border-border overflow-y-auto"
          style={{ width: NAME_COL_WIDTH, maxHeight: "70vh" }}
        >
          <div style={{ height: "var(--timeline-header-h)" }} className="border-b border-border bg-card sticky top-0 z-10" />
          <div className="relative" style={{ height: totalRowsHeight }}>
            {rows.map((r, i) => {
              const top = offsets[i];
              if (r.kind === "header") {
                return (
                  <div
                    key={`h-${r.locId}`}
                    className="absolute left-0 right-0 px-3 flex items-center bg-muted/60 font-semibold text-sm text-foreground border-b border-border/50"
                    style={{ top, height: headerHeight }}
                  >
                    {r.locName}
                  </div>
                );
              }
              if (r.kind === "subheader") {
                return (
                  <div
                    key={`sh-${r.locId}`}
                    className="absolute left-0 right-0 flex items-center bg-muted/20 border-b border-border text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    style={{ top, height: SUBHEADER_HEIGHT }}
                  >
                    <div className="px-3 truncate" style={{ width: NAME_WIDTH }}>Naam</div>
                    <div className="px-2 truncate" style={{ width: HOUSING_WIDTH }}>
                      <span className="hidden md:inline">Woonruimte</span>
                    </div>
                  </div>
                );
              }
              const p = r.person;
              const h = housing.find(x => x.id === p.housing_id);
              return (
                <div
                  key={p.id}
                  className="absolute left-0 right-0 flex items-center border-b border-border/50"
                  style={{ top, height: rowHeight }}
                >
                  <div
                    className="px-3 text-sm truncate"
                    style={{ width: NAME_WIDTH }}
                    title={p.name}
                  >
                    {p.name}
                  </div>
                  <div
                    className="px-2 text-sm"
                    style={{ width: HOUSING_WIDTH }}
                    title={h?.name ?? ""}
                  >
                    {h ? (
                      <Link
                        to={`/personeel/wonen/${h.id}`}
                        className="flex items-center gap-2 truncate min-h-[40px] hover:underline underline-offset-2"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: h.color }}
                        />
                        <span className="truncate hidden md:inline">{h.name}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs hidden md:inline">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                  const isToday = i === 0;
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

            {/* Tracks area — same height as left column rows for sync */}
            <div className="relative" style={{ width: totalWidth, height: totalRowsHeight }}>
              {/* Weekend stripes (full tracks height) */}
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
              {/* Per-row content: header rows render a subtle band; person rows render the planning block */}
              {rows.map((r, i) => {
                const top = offsets[i];
                if (r.kind === "header") {
                  return (
                    <div
                      key={`th-${r.locId}`}
                      className="absolute left-0 right-0 bg-muted/30 border-b border-border/50 pointer-events-none"
                      style={{ top, height: headerHeight }}
                    />
                  );
                }
                const p = r.person;
                const h = housing.find(x => x.id === p.housing_id);
                const startIdx = differenceInCalendarDays(new Date(p.start_date), windowStart);
                const endIdx = differenceInCalendarDays(new Date(p.end_date), windowStart);
                if (endIdx < 0 || startIdx >= TOTAL_DAYS) {
                  return (
                    <div
                      key={p.id}
                      className="absolute left-0 right-0 border-b border-border/50"
                      style={{ top, height: rowHeight }}
                    />
                  );
                }
                return (
                  <div
                    key={p.id}
                    className="absolute left-0 right-0 border-b border-border/50"
                    style={{ top, height: rowHeight }}
                  >
                    <PlanningBlock
                      person={p}
                      housing={h}
                      windowStart={windowStart}
                      cellWidth={cellWidth}
                      rowHeight={rowHeight}
                      locationName={locations.find(l => l.id === p.location_id)?.name}
                    />
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
