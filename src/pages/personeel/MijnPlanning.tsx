import { useMemo } from "react";
import { useMyPlanning, useHousing, useLocations, usePeople } from "@/hooks/personeel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { categorizeByDate, formatPeriod, isActiveOn } from "@/lib/personeel-utils";
import { parseISO } from "date-fns";
import { copy } from "@/lib/personeel-copy";

export default function MijnPlanning() {
  const { data: my = [], isLoading } = useMyPlanning();
  const { data: housing = [] } = useHousing();
  const { data: locations = [] } = useLocations();
  const { data: allPeople = [] } = usePeople();

  const { current, future, past } = useMemo(() => categorizeByDate(my), [my]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (my.length === 0) {
    return (
      <Card className="rounded-[20px]">
        <CardContent className="py-12 text-center text-muted-foreground">
          {copy.geenPlanning}
        </CardContent>
      </Card>
    );
  }

  const renderCard = (p: typeof my[0], variant: "current" | "future" | "past") => {
    const h = housing.find(x => x.id === p.housing_id);
    const loc = locations.find(x => x.id === p.location_id);
    const housemates = h
      ? allPeople.filter(o =>
          o.id !== p.id && o.housing_id === h.id && isActiveOn(o, parseISO(p.start_date))
        )
      : [];

    return (
      <Card key={p.id} className={`rounded-[20px] ${variant === "current" ? "border-2 border-primary" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{loc?.name ?? "—"}</span>
            {variant === "current" && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{copy.huidig}</span>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">{formatPeriod(p.start_date, p.end_date)}</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h?.color ?? "#9CA3AF" }} />
            <span className="font-medium">{h?.name ?? "Geen slaapplek"}</span>
          </div>
          {housemates.length > 0 && (
            <div className="text-sm">
              <div className="text-muted-foreground mb-1">Huisgenoten:</div>
              <ul className="space-y-1">
                {housemates.map(hm => <li key={hm.id}>• {hm.name}</li>)}
              </ul>
            </div>
          )}
          {p.notes && <div className="text-sm text-muted-foreground border-t pt-2">{p.notes}</div>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {current.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.huidig}</h2>
          <div className="grid gap-3">{current.map(p => renderCard(p, "current"))}</div>
        </section>
      )}
      {future.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.toekomstig}</h2>
          <div className="grid gap-3">{future.map(p => renderCard(p, "future"))}</div>
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">{copy.verleden}</h2>
          <div className="grid gap-3 opacity-70">{past.map(p => renderCard(p, "past"))}</div>
        </section>
      )}
    </div>
  );
}
