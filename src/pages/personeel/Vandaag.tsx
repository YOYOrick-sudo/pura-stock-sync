import { useMemo } from "react";
import { usePeople, useLocations, useHousing } from "@/hooks/personeel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActiveOn } from "@/lib/personeel-utils";
import { copy } from "@/lib/personeel-copy";

export default function Vandaag() {
  const { data: people = [], isLoading } = usePeople();
  const { data: locations = [] } = useLocations();
  const { data: housing = [] } = useHousing();

  const today = new Date();
  const active = useMemo(() => people.filter(p => isActiveOn(p, today)), [people]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof people>();
    for (const loc of locations) map.set(loc.id, []);
    for (const p of active) {
      const arr = map.get(p.location_id) ?? [];
      arr.push(p);
      map.set(p.location_id, arr);
    }
    return map;
  }, [active, locations]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (active.length === 0) {
    return (
      <Card className="rounded-[20px]">
        <CardContent className="py-12 text-center text-muted-foreground">
          {copy.geen_actief_planning}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map(loc => {
        const list = grouped.get(loc.id) ?? [];
        if (list.length === 0) return null;
        return (
          <Card key={loc.id} className="rounded-[20px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{loc.name}</span>
                <span className="text-sm font-normal text-muted-foreground">{list.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {list.map(p => {
                  const h = housing.find(x => x.id === p.housing_id);
                  return (
                    <li key={p.id} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: h?.color ?? "#9CA3AF" }} />
                      <span className="text-sm">{p.name}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
