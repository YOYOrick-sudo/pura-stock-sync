import { useMemo } from "react";
import { addDays, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Person, PersoneelHousing } from "@/types/personeel";
import { getOverbookedDays, isActiveOn } from "@/lib/personeel-utils";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface HousingCardProps {
  housing: PersoneelHousing;
  people: Person[];
}

export function HousingCard({ housing, people }: HousingCardProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const currentResidents = useMemo(
    () => people.filter(p => p.housing_id === housing.id && isActiveOn(p, today)),
    [people, housing.id]
  );

  const overbooked = useMemo(
    () => getOverbookedDays(housing, people, weekStart, weekEnd),
    [housing, people, weekStart, weekEnd]
  );

  const isOverbooked = overbooked.length > 0;

  return (
    <Card
      className={`rounded-[20px] transition-all ${isOverbooked ? "border-2 border-destructive" : "border-l-[6px]"}`}
      style={!isOverbooked ? { borderLeftColor: housing.color } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: housing.color }} />
            {housing.name}
          </CardTitle>
          <Badge variant={isOverbooked ? "destructive" : "secondary"}>
            {currentResidents.length}{housing.capacity != null ? ` / ${housing.capacity}` : ""}
          </Badge>
        </div>
        {isOverbooked && (
          <div className="text-xs text-destructive font-medium mt-1">
            Overboekt op {format(overbooked[0], "d MMMM", { locale: nl })}
            {overbooked.length > 1 && ` (+${overbooked.length - 1} dag${overbooked.length > 2 ? "en" : ""})`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {currentResidents.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">Niemand op dit moment</div>
        ) : (
          <ul className="space-y-1">
            {currentResidents.map(r => (
              <li key={r.id} className="text-sm flex items-center justify-between">
                <span>{r.name}</span>
                <span className="text-xs text-muted-foreground">tot {format(new Date(r.end_date), "d MMM", { locale: nl })}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
