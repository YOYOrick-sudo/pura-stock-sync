import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { addDays, format, getDay, isSameMonth, startOfDay, differenceInCalendarDays, subYears } from "date-fns";
import { nl } from "date-fns/locale";
import { usePeople, useHousing, useLocations, useHistory, usePersoneelFilters, useTeams } from "@/hooks/personeel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlanningBlock } from "@/components/personeel/PlanningBlock";
import { DensityBar } from "@/components/personeel/DensityBar";
import { PersonModal } from "@/components/personeel/PersonModal";
import { HousingOccupancyStrip } from "@/components/personeel/HousingOccupancyStrip";
import { ChefHat, Utensils, Home, AlertCircle } from "lucide-react";
import type { Person, FunctionGroup } from "@/types/personeel";

const DAYS_BEFORE = 0;
const DAYS_AFTER = 365;
const TOTAL_DAYS = DAYS_BEFORE + DAYS_AFTER + 1;

type Row =
  | { kind: "spacer"; locId: string }
  | { kind: "header"; locId: string; locName: string }
  | { kind: "history"; locId: string }
  | { kind: "function"; locId: string; group: FunctionGroup }
  | { kind: "subheader"; locId: string; group: FunctionGroup }
  | { kind: "person"; person: Person; locId: string; group: FunctionGroup };

const SPACER_HEIGHT = 20;
const SUBHEADER_HEIGHT = 24;
const FUNCTION_HEIGHT = 30;
const HISTORY_ROW_HEIGHT = 24;

export default function Tijdlijn() {
  const { data: people = [], isLoading } = usePeople();
  const { data: housing = [] } = useHousing();
  const { data: locations = [] } = useLocations();
  const { data: history = [] } = useHistory();
  const { filters } = usePersoneelFilters();

  const [isLg, setIsLg] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
  useEffect(() => {
    const onResize = () => setIsLg(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cellWidth = isLg ? 28 : 32;
  const rowHeight = isLg ? 36 : 40;
  const headerHeight = Math.round(rowHeight * 0.8);

  const [showHistory, setShowHistory] = useState(true);
  const [editing, setEditing] = useState<Person | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
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

  useEffect(() => {
    if (!scrollRef.current) return;
    requestAnimationFrame(() => scrollToToday(false));
  }, [scrollToToday]);

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

  const { data: teams = [] } = useTeams();
  const teamGroupMap = useMemo(() => {
    const m = new Map<string, FunctionGroup>();
    teams.forEach(t => {
      m.set(t.id, (t.function_group as FunctionGroup) ?? "bediening");
    });
    return m;
  }, [teams]);

  // Build flattened rows — per vestiging gesplitst in keuken / bediening, gesorteerd op startdatum
  const rows: Row[] = useMemo(() => {
    type Entry = { person: Person; group: FunctionGroup };
    const byLoc = new Map<string, Entry[]>();
    people.forEach(p => {
      const assigns = (p.assignments && p.assignments.length > 0)
        ? p.assignments
        : [{ location_id: p.location_id, team_id: p.team_id }];
      const seen = new Set<string>();
      assigns.forEach(a => {
        if (!a.location_id || seen.has(a.location_id)) return;
        seen.add(a.location_id);
        const group: FunctionGroup = teamGroupMap.get(a.team_id) ?? "bediening";
        const arr = byLoc.get(a.location_id) ?? [];
        arr.push({ person: p, group });
        byLoc.set(a.location_id, arr);
      });
    });
    const sortedLocs = [...locations].sort((a, b) => a.sort_order - b.sort_order);
    const out: Row[] = [];
    let firstLoc = true;
    const sortByStart = (a: Entry, b: Entry) => {
      if (a.person.start_date !== b.person.start_date) {
        return a.person.start_date < b.person.start_date ? -1 : 1;
      }
      return a.person.name.localeCompare(b.person.name);
    };
    sortedLocs.forEach(loc => {
      const entries = byLoc.get(loc.id) ?? [];
      if (entries.length === 0) return;
      if (!firstLoc) out.push({ kind: "spacer", locId: loc.id });
      firstLoc = false;
      out.push({ kind: "header", locId: loc.id, locName: loc.name });
      if (showHistory) out.push({ kind: "history", locId: loc.id });
      const groups: FunctionGroup[] = ["keuken", "bediening"];
      groups.forEach(g => {
        const inGroup = entries.filter(e => e.group === g).sort(sortByStart);
        if (inGroup.length === 0) return;
        out.push({ kind: "function", locId: loc.id, group: g });
        out.push({ kind: "subheader", locId: loc.id, group: g });
        inGroup.forEach(e => out.push({ kind: "person", person: e.person, locId: loc.id, group: g }));
      });
    });
    return out;
  }, [people, locations, showHistory, teamGroupMap]);

  const { offsets, totalRowsHeight } = useMemo(() => {
    const offs: number[] = [];
    let acc = 0;
    rows.forEach(r => {
      offs.push(acc);
      if (r.kind === "spacer") acc += SPACER_HEIGHT;
      else if (r.kind === "header") acc += headerHeight;
      else if (r.kind === "history") acc += HISTORY_ROW_HEIGHT;
      else if (r.kind === "function") acc += FUNCTION_HEIGHT;
      else if (r.kind === "subheader") acc += SUBHEADER_HEIGHT;
      else acc += rowHeight;
    });
    return { offsets: offs, totalRowsHeight: acc };
  }, [rows, headerHeight, rowHeight]);

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

  const weekendOffsets = useMemo(() => {
    const offs: number[] = [];
    days.forEach((d, i) => {
      const dow = getDay(d);
      if (dow === 0 || dow === 6) offs.push(i);
    });
    return offs;
  }, [days]);

  const todayOffset = 0;

  // ============ HISTORY DATA ============
  // Filter history by selected locations (empty filter = all locations)
  const filteredHistory = useMemo(() => {
    if (filters.locations.length === 0) return history;
    const locSet = new Set(filters.locations);
    return history.filter(h => h.location_id && locSet.has(h.location_id));
  }, [history, filters.locations]);

  // Index by date for fast lookup: date -> [{team_name, count, location_id}]
  const historyByDate = useMemo(() => {
    const m = new Map<string, HistoryRow[]>();
    for (const h of filteredHistory) {
      const arr = m.get(h.date) ?? [];
      arr.push(h);
      m.set(h.date, arr);
    }
    return m;
  }, [filteredHistory]);

  // Min/max date in history (raw, before filter — to determine "in-range" universally)
  const historyDateRange = useMemo(() => {
    if (history.length === 0) return null;
    let min = history[0].date;
    let max = history[0].date;
    for (const h of history) {
      if (h.date < min) min = h.date;
      if (h.date > max) max = h.date;
    }
    return { min, max };
  }, [history]);

  // Pre-compute totals per current-day index for the visible window (GLOBAL — all locations together)
  // Used only for opacity-scaling normalization so that Midsland/West remain visually comparable.
  const historyTotalsPerDay = useMemo(() => {
    const totals = new Array<number>(TOTAL_DAYS).fill(0);
    if (!historyDateRange) return totals;
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const target = subYears(days[i], 1);
      const targetStr = format(target, "yyyy-MM-dd");
      if (targetStr < historyDateRange.min || targetStr > historyDateRange.max) continue;
      const rows = historyByDate.get(targetStr);
      if (!rows) continue;
      let sum = 0;
      for (const r of rows) sum += r.count;
      totals[i] = sum;
    }
    return totals;
  }, [days, historyByDate, historyDateRange]);

  // Max in visible window for opacity scaling (global)
  const maxInWindow = useMemo(() => {
    let mx = 0;
    for (let i = visibleRange[0]; i <= visibleRange[1]; i++) {
      if (historyTotalsPerDay[i] > mx) mx = historyTotalsPerDay[i];
    }
    return mx || 1;
  }, [historyTotalsPerDay, visibleRange]);

  // Per-location, per-day helper. Returns total + sorted teams for popover content.
  const getHistoryForLocationAndDay = useCallback(
    (locId: string, dayIdx: number) => {
      const target = subYears(days[dayIdx], 1);
      const targetStr = format(target, "yyyy-MM-dd");
      if (!historyDateRange || targetStr < historyDateRange.min || targetStr > historyDateRange.max) {
        return { total: 0, teams: [] as [string, number][], target };
      }
      const rows = (historyByDate.get(targetStr) ?? []).filter(r => r.location_id === locId);
      const teamMap = new Map<string, number>();
      for (const r of rows) teamMap.set(r.team_name, (teamMap.get(r.team_name) ?? 0) + r.count);
      const total = [...teamMap.values()].reduce((a, b) => a + b, 0);
      const teams = [...teamMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      return { total, teams, target };
    },
    [days, historyByDate, historyDateRange]
  );

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
      <div className="flex items-center justify-between p-3 border-b border-border bg-card gap-3">
        <div className="text-sm text-muted-foreground truncate">
          {format(windowStart, "d MMM yyyy", { locale: nl })} – {format(addDays(windowStart, TOTAL_DAYS - 1), "d MMM yyyy", { locale: nl })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="show-history" checked={showHistory} onCheckedChange={setShowHistory} />
            <Label htmlFor="show-history" className="text-xs cursor-pointer select-none">Vorig jaar</Label>
          </div>
          <Button size="sm" onClick={() => scrollToToday(true)}>Vandaag</Button>
        </div>
      </div>

      <div className="flex overflow-y-auto" style={{ maxHeight: "70vh" }}>
        {/* Names + slaapplek column */}
        <div
          className="sticky left-0 z-30 bg-card border-r border-border"
          style={{ width: NAME_COL_WIDTH }}
        >
          <div style={{ height: "var(--timeline-header-h)" }} className="border-b border-border bg-card sticky top-0 z-20 flex flex-col">
            <div style={{ height: "var(--timeline-date-h)" }} />
            <div style={{ height: "var(--timeline-density-h)" }} />
          </div>
          <div className="relative" style={{ height: totalRowsHeight }}>
            {rows.map((r, i) => {
              const top = offsets[i];
              if (r.kind === "spacer") {
                return (
                  <div
                    key={`sp-${r.locId}-${i}`}
                    className="absolute left-0 right-0 bg-muted/10 border-t-2 border-border"
                    style={{ top, height: SPACER_HEIGHT }}
                  />
                );
              }
              if (r.kind === "header") {
                return (
                  <div
                    key={`h-${r.locId}`}
                    className="absolute left-0 right-0 px-3 flex items-center bg-primary/10 font-bold text-base text-primary border-b border-border border-l-4 border-l-primary"
                    style={{ top, height: headerHeight }}
                  >
                    {r.locName}
                  </div>
                );
              }
              if (r.kind === "function") {
                const Icon = r.group === "keuken" ? ChefHat : Utensils;
                return (
                  <div
                    key={`fn-${r.locId}-${r.group}`}
                    className="absolute left-0 right-0 flex items-center gap-1.5 px-3 bg-muted/40 border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-foreground/80"
                    style={{ top, height: FUNCTION_HEIGHT }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {r.group === "keuken" ? "Keuken" : "Bediening"}
                  </div>
                );
              }
              if (r.kind === "subheader") {
                return (
                  <div
                    key={`sh-${r.locId}-${r.group}`}
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
              if (r.kind === "history") {
                return (
                  <div
                    key={`hist-name-${r.locId}`}
                    className="absolute left-0 right-0 px-3 flex items-center text-xs text-muted-foreground bg-muted/10 border-b border-border/50"
                    style={{ top, height: HISTORY_ROW_HEIGHT }}
                  >
                    Vorig jaar
                  </div>
                );
              }
              const p = r.person;
              const h = housing.find(x => x.id === p.housing_id);
              const multi = (p.assignments?.length ?? 0) > 1;
              return (
                <div
                  key={`${p.id}-${r.locId}`}
                  className="absolute left-0 right-0 flex items-center border-b border-border/50"
                  style={{ top, height: rowHeight }}
                >
                  <div className="px-3 text-sm truncate flex items-center gap-1.5" style={{ width: NAME_WIDTH }} title={multi ? `${p.name} · actief op meerdere vestigingen` : p.name}>
                    <span className="truncate">{p.name}</span>
                    {multi && (
                      <span
                        className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary"
                        title="Actief op meerdere vestigingen"
                        aria-label="Multi-locatie"
                      />
                    )}
                  </div>
                  <div className="px-2 text-sm" style={{ width: HOUSING_WIDTH }} title={h?.name ?? (p.housing_not_needed ? "Geen woonruimte nodig" : "Nog geen slaapplek toegewezen")}>
                    {h ? (
                      <Link
                        to={`/personeel/wonen/${h.id}`}
                        className="flex items-center gap-2 truncate min-h-[40px] hover:underline underline-offset-2"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                        <span className="truncate hidden md:inline">{h.name}</span>
                      </Link>
                    ) : p.housing_not_needed ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Home className="h-3.5 w-3.5 opacity-60" />
                        <span className="truncate hidden md:inline">woont thuis</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="flex items-center gap-1.5 text-amber-600 text-xs hover:underline"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="truncate hidden md:inline">toewijzen</span>
                      </button>
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
          className="flex-1 overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="relative" style={{ width: totalWidth, minWidth: totalWidth }}>
            {/* Sticky header (months + days) */}
            <div className="sticky top-0 z-20 bg-card border-b border-border" style={{ height: "var(--timeline-date-h)", width: totalWidth }}>
              <div className="relative h-5 border-b border-border/50" style={{ width: totalWidth }}>
                {monthSegments.map(seg => (
                  <div
                    key={seg.startIdx}
                    className="absolute top-0 h-full text-xs font-medium text-muted-foreground flex items-center"
                    style={{ left: seg.startIdx * cellWidth, width: (seg.endIdx - seg.startIdx + 1) * cellWidth }}
                  >
                    <span className="sticky left-2 px-1 bg-card whitespace-nowrap">{seg.label}</span>
                  </div>
                ))}
              </div>
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

            {/* (Globale "Vorig jaar"-rij verwijderd — nu per vestiging-groep, zie tracks-area) */}

            {/* Density bar */}
            <div
              className="sticky z-10 border-b border-border"
              style={{
                top: "var(--timeline-date-h)",
                height: "var(--timeline-density-h)",
                width: totalWidth,
              }}
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

            {/* Tracks area */}
            <div className="relative" style={{ width: totalWidth, height: totalRowsHeight }}>
              {weekendOffsets.map(i => (
                <div
                  key={`w-${i}`}
                  className="absolute top-0 bottom-0 bg-muted/30 pointer-events-none"
                  style={{ left: i * cellWidth, width: cellWidth }}
                />
              ))}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-destructive z-10 pointer-events-none"
                style={{ left: todayOffset }}
              />
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
                if (r.kind === "subheader") {
                  return (
                    <div
                      key={`tsh-${r.locId}`}
                      className="absolute left-0 right-0 bg-muted/20 border-b border-border pointer-events-none"
                      style={{ top, height: SUBHEADER_HEIGHT }}
                    />
                  );
                }
                if (r.kind === "history") {
                  return (
                    <div
                      key={`thist-${r.locId}`}
                      className="absolute left-0 right-0 bg-muted/10 border-b border-border/50"
                      style={{ top, height: HISTORY_ROW_HEIGHT }}
                    >
                      {days.map((_, dayIdx) => {
                        const { total, teams, target } = getHistoryForLocationAndDay(r.locId, dayIdx);
                        if (total === 0) return null;
                        const opacity = Math.min(1, total / maxInWindow);
                        return (
                          <Popover key={`hist-${r.locId}-${dayIdx}`}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="absolute top-0 h-full flex items-center justify-center hover:bg-accent/40 transition-colors cursor-pointer"
                                style={{ left: dayIdx * cellWidth, width: cellWidth }}
                              >
                                <span
                                  className="text-[10px] text-muted-foreground tabular-nums font-medium"
                                  style={{ opacity: 0.4 + opacity * 0.6 }}
                                >
                                  {total}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3" align="center">
                              <div className="text-sm font-semibold mb-2">
                                {format(target, "d MMMM yyyy", { locale: nl })}
                              </div>
                              <div className="border-t border-border/50 pt-2 space-y-1">
                                {teams.map(([team, cnt]) => (
                                  <div key={team} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{team}</span>
                                    <span className="tabular-nums font-medium">{cnt}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-border mt-2 pt-2 flex justify-between text-xs font-semibold">
                                <span>Totaal</span>
                                <span className="tabular-nums">{total}</span>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                    </div>
                  );
                }
                const p = r.person;
                const h = housing.find(x => x.id === p.housing_id);
                const startIdx = differenceInCalendarDays(new Date(p.start_date), windowStart);
                const endIdx = differenceInCalendarDays(new Date(p.end_date), windowStart);
                if (endIdx < 0 || startIdx >= TOTAL_DAYS) {
                  return (
                    <div
                      key={`${p.id}-${r.locId}`}
                      className="absolute left-0 right-0 border-b border-border/50"
                      style={{ top, height: rowHeight }}
                    />
                  );
                }
                return (
                  <div
                    key={`${p.id}-${r.locId}`}
                    className="absolute left-0 right-0 border-b border-border/50"
                    style={{ top, height: rowHeight }}
                  >
                    <PlanningBlock
                      person={p}
                      housing={h}
                      windowStart={windowStart}
                      cellWidth={cellWidth}
                      rowHeight={rowHeight}
                      locationName={locations.find(l => l.id === r.locId)?.name}
                      onEdit={setEditing}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Woonruimte-bezetting in het zichtbare venster */}
      {housing.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            Woonruimte in zichtbaar venster
          </div>
          <HousingOccupancyStrip
            housing={housing}
            people={people}
            windowStart={windowStart}
            windowEnd={days[days.length - 1]}
          />
        </div>
      )}
      {editing && (
        <PersonModal
          open={!!editing}
          onClose={() => setEditing(null)}
          person={editing}
        />
      )}
    </div>
  );
}

// Local type re-import for the historyByDate generic
type HistoryRow = import("@/hooks/personeel/useHistory").HistoryRow;
