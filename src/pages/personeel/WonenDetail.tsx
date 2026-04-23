import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addDays, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHousing, usePeople } from "@/hooks/personeel";
import { isActiveOn } from "@/lib/personeel-utils";
import { HousingEditModal } from "@/components/personeel/HousingEditModal";

export default function WonenDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: housing = [], isLoading } = useHousing();
  const { data: people = [] } = usePeople();
  const [editing, setEditing] = useState(false);

  const item = useMemo(() => housing.find(h => h.id === id), [housing, id]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const horizon = useMemo(() => addDays(today, 90), [today]);

  const current = useMemo(
    () => people.filter(p => p.housing_id === id && isActiveOn(p, today))
                 .sort((a, b) => a.end_date.localeCompare(b.end_date)),
    [people, id, today]
  );

  const upcoming = useMemo(
    () => people.filter(p => {
      if (p.housing_id !== id) return false;
      const s = parseISO(p.start_date);
      return isAfter(s, today) && isBefore(s, horizon);
    }).sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [people, id, today, horizon]
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!item) {
    return (
      <div className="space-y-4">
        <Link to="/personeel/wonen" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Terug naar overzicht
        </Link>
        <p>Slaapplek niet gevonden.</p>
      </div>
    );
  }

  const fmtEur = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link to="/personeel/wonen" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Terug naar overzicht
          </Link>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            {item.name}
          </h1>
        </div>
        <Button onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4 mr-2" /> Bewerken
        </Button>
      </div>

      {/* Basisinfo */}
      <Card className="rounded-[20px]">
        <CardHeader><CardTitle className="text-lg">Basisinfo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <InfoRow label="Adres" value={item.address} />
          <InfoRow label="Contactpersoon" value={item.contact_name} />
          <InfoRow label="Kosten per maand" value={item.cost_per_month != null ? fmtEur(item.cost_per_month) : null} />
          <InfoRow label="Capaciteit" value={item.capacity != null ? `${item.capacity} personen` : null} />
          <InfoRow label="Aantal kamers" value={item.rooms != null ? `${item.rooms}` : null} />
          <InfoRow label="Kamergrootte" value={item.room_size_m2 != null ? `${item.room_size_m2} m²` : null} />
        </CardContent>
      </Card>

      {/* Facilities */}
      {item.facilities && item.facilities.length > 0 && (
        <Card className="rounded-[20px]">
          <CardHeader><CardTitle className="text-lg">Voorzieningen</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {item.facilities.map(f => (
              <Badge key={f} variant="secondary" className="capitalize">{f}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Beschrijving */}
      {item.description && (
        <Card className="rounded-[20px]">
          <CardHeader><CardTitle className="text-lg">Beschrijving</CardTitle></CardHeader>
          <CardContent className="text-sm text-foreground/90 whitespace-pre-wrap">
            {item.description}
          </CardContent>
        </Card>
      )}

      {/* Notities */}
      {item.notes && (
        <Card className="rounded-[20px] bg-muted/40">
          <CardHeader><CardTitle className="text-lg">Notities</CardTitle></CardHeader>
          <CardContent className="text-sm text-foreground/90 whitespace-pre-wrap">
            {item.notes}
          </CardContent>
        </Card>
      )}

      {/* Bewoners */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Huidige bewoners
              <Badge variant="secondary">{current.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {current.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Niemand op dit moment</p>
            ) : (
              <ul className="space-y-2">
                {current.map(p => (
                  <li key={p.id} className="text-sm flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      tot {format(parseISO(p.end_date), "d MMM yyyy", { locale: nl })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[20px]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Komende bewoners
              <Badge variant="secondary">{upcoming.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Geen aankomende bewoners (komende 90 dagen)</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map(p => (
                  <li key={p.id} className="text-sm flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      vanaf {format(parseISO(p.start_date), "d MMM yyyy", { locale: nl })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {editing && <HousingEditModal open={editing} onClose={() => setEditing(false)} housing={item} />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value || <span className="text-muted-foreground italic">—</span>}</span>
    </div>
  );
}
