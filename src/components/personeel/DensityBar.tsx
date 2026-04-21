import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Person } from "@/types/personeel";
import { getDensityPerDay } from "@/lib/personeel-utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DensityBarProps {
  people: Person[];
  windowStart: Date;
  totalDays: number;
  cellWidth: number;
  height: number;
  visibleStartIdx: number;
  visibleEndIdx: number;
}

export function DensityBar({ people, windowStart, totalDays, cellWidth, height, visibleStartIdx, visibleEndIdx }: DensityBarProps) {
  const density = useMemo(() => {
    return getDensityPerDay(people, windowStart, addDays(windowStart, totalDays - 1));
  }, [people, windowStart, totalDays]);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(windowStart, i));
  }, [windowStart, totalDays]);

  // Recalibrate the max over the currently visible window so bars stay readable in quiet periods
  const visibleMax = useMemo(() => {
    let max = 1;
    for (let i = visibleStartIdx; i <= visibleEndIdx && i < totalDays; i++) {
      const d = days[i];
      const v = density.get(format(d, "yyyy-MM-dd")) ?? 0;
      if (v > max) max = v;
    }
    return max;
  }, [density, days, visibleStartIdx, visibleEndIdx, totalDays]);

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="relative bg-card/50" style={{ height, width: totalDays * cellWidth }}>
      {days.map((d, i) => {
        const key = format(d, "yyyy-MM-dd");
        const v = density.get(key) ?? 0;
        const ratio = v / visibleMax;
        const barH = Math.max(2, Math.round(ratio * (height - 6)));
        const isOpen = openIdx === i;

        // Only render bars with activity to keep DOM lean
        if (v === 0) {
          return (
            <button
              key={key}
              type="button"
              aria-label={`0 collega's op ${format(d, "d MMMM", { locale: nl })}`}
              className="absolute bottom-0"
              style={{ left: i * cellWidth, width: cellWidth, height }}
              onClick={() => setOpenIdx(isOpen ? null : i)}
            />
          );
        }

        return (
          <Popover key={key} open={isOpen} onOpenChange={(o) => setOpenIdx(o ? i : null)}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`${v} ${v === 1 ? "collega" : "collega's"} op ${format(d, "d MMMM", { locale: nl })}`}
                className="absolute bottom-1 bg-primary/70 hover:bg-primary rounded-sm transition-colors"
                style={{
                  left: i * cellWidth + 2,
                  width: cellWidth - 4,
                  height: barH,
                }}
              />
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="text-sm font-medium">{format(d, "EEEE d MMMM", { locale: nl })}</div>
              <div className="text-2xl font-bold mt-1">{v}</div>
              <div className="text-xs text-muted-foreground">{v === 1 ? "collega aanwezig" : "collega's aanwezig"}</div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
