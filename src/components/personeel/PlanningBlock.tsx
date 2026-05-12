import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Person, PersoneelHousing } from "@/types/personeel";
import { getPersonColor } from "@/lib/personeel-utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPeriod } from "@/lib/personeel-utils";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface PlanningBlockProps {
  person: Person;
  housing: PersoneelHousing | undefined;
  windowStart: Date; // first day of the timeline (e.g. today - 182d)
  cellWidth: number;
  rowHeight: number;
  locationName?: string;
  onEdit?: (person: Person) => void;
}

export function PlanningBlock({ person, housing, windowStart, cellWidth, rowHeight, locationName, onEdit }: PlanningBlockProps) {
  const start = parseISO(person.start_date);
  const end = parseISO(person.end_date);
  const offsetDays = Math.max(0, differenceInCalendarDays(start, windowStart));
  const lengthDays = differenceInCalendarDays(end, start) + 1;

  const { bg, fg: textColor } = getPersonColor(person.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute rounded-[10px] px-2 text-xs font-medium truncate transition-all hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            left: offsetDays * cellWidth + 2,
            width: lengthDays * cellWidth - 4,
            top: 4,
            height: rowHeight - 8,
            backgroundColor: bg,
            color: textColor,
            lineHeight: `${rowHeight - 8}px`,
          }}
        >
          {person.name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-2">
          <div className="font-semibold">{person.name}</div>
          <div className="text-sm text-muted-foreground">{formatPeriod(person.start_date, person.end_date)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: housing?.color ?? "#9CA3AF" }} />
            <span>{housing?.name ?? "Geen slaapplek"}</span>
          </div>
          {locationName && <div className="text-sm">{locationName}</div>}
          {person.days_per_week && (
            <div className="text-sm">{person.days_per_week} dagen per week</div>
          )}
          {person.notes && (
            <div className="text-sm text-muted-foreground border-t pt-2 mt-2">{person.notes}</div>
          )}
          {onEdit && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onEdit(person)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Bewerken
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
