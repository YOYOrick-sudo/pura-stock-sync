import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addDays, format, isAfter, isBefore, parseISO, startOfDay, eachDayOfInterval, isWithinInterval, max as dateMax } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Pencil, Plus, Trash2, ChevronDown, BedDouble } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useHousing, usePeople, useRoomsByHousing, useDeleteRoom } from "@/hooks/personeel";
import { isActiveOn } from "@/lib/personeel-utils";
import { HousingEditModal } from "@/components/personeel/HousingEditModal";
import { RoomEditModal } from "@/components/personeel/RoomEditModal";
import type { Person, PersoneelRoom } from "@/types/personeel";

export default function WonenDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: housing = [], isLoading } = useHousing();
  const { data: people = [] } = usePeople();
  const { data: rooms = [] } = useRoomsByHousing(id ?? null);
  const deleteRoom = useDeleteRoom();

  const [editing, setEditing] = useState(false);
  const [roomModal, setRoomModal] = useState<{ open: boolean; room: PersoneelRoom | null }>({ open: false, room: null });
  const [manageOpen, setManageOpen] = useState(false);

  const item = useMemo(() => housing.find(h => h.id === id), [housing, id]);
  const today = useMemo(() => startOfDay(new Date()), []);
  const horizon = useMemo(() => addDays(today, 90), [today]);

  // Personen in deze woonruimte (alle, ongeacht kamer)
  const peopleInHousing = useMemo(
    () => people.filter(p => p.housing_id === id),
    [people, id],
  );

  // Fallback (geen kamers): huidige + komende bewoners
  const current = useMemo(
    () => peopleInHousing
      .filter(p => isActiveOn(p, today))
      .sort((a, b) => a.end_date.localeCompare(b.end_date)),
    [peopleInHousing, today],
  );
  const upcoming = useMemo(
    () => peopleInHousing
      .filter(p => {
        const s = parseISO(p.start_date);
        return isAfter(s, today) && isBefore(s, horizon);
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [peopleInHousing, today, horizon],
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
  const nextSortOrder = rooms.length > 0 ? Math.max(...rooms.map(r => r.sort_order)) + 1 : 0;

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

      {/* Bewoners — kamer-grid OF fallback */}
      {rooms.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              Kamers ({rooms.length})
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[...rooms].sort((a, b) => a.sort_order - b.sort_order).map(room => (
              <RoomCard
                key={room.id}
                room={room}
                people={peopleInHousing}
                today={today}
                onEdit={() => setRoomModal({ open: true, room })}
              />
            ))}
          </div>

          {/* Bewoners zonder specifieke kamer */}
          <ResidentsWithoutRoom people={peopleInHousing} today={today} horizon={horizon} />
        </div>
      ) : (
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
      )}

      {/* Kamers beheren — collapsible */}
      <Collapsible open={manageOpen} onOpenChange={setManageOpen}>
        <Card className="rounded-[20px]">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition rounded-t-[20px]"
            >
              <span className="text-base font-medium">Kamers beheren</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${manageOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {rooms.length === 0 && (
                <p className="text-sm text-muted-foreground italic py-2">
                  Geen kamers gedefinieerd. Voeg er één toe om bewoners per kamer te plannen.
                </p>
              )}
              {[...rooms].sort((a, b) => a.sort_order - b.sort_order).map(room => {
                const occupants = peopleInHousing.filter(p => p.room_id === room.id);
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-[14px] border border-border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{room.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {room.size_m2 != null && <>{room.size_m2} m² · </>}
                        {room.capacity} {room.capacity === 1 ? "bed" : "bedden"}
                        {occupants.length > 0 && <> · {occupants.length} bewoner(s) gekoppeld</>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setRoomModal({ open: true, room })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Kamer "${room.name}" verwijderen?\n\nBewoners blijven bestaan, alleen hun kamer-koppeling wordt losgelaten.`)) {
                          deleteRoom.mutate(room.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setRoomModal({ open: true, room: null })}
              >
                <Plus className="h-4 w-4 mr-2" /> Kamer toevoegen
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {editing && <HousingEditModal open={editing} onClose={() => setEditing(false)} housing={item} />}
      {roomModal.open && (
        <RoomEditModal
          open={roomModal.open}
          onClose={() => setRoomModal({ open: false, room: null })}
          housingId={item.id}
          room={roomModal.room}
          defaultSortOrder={nextSortOrder}
        />
      )}
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

interface RoomCardProps {
  room: PersoneelRoom;
  people: Person[]; // alle personen in deze housing
  today: Date;
  onEdit: () => void;
}

function RoomCard({ room, people, today, onEdit }: RoomCardProps) {
  const occupants = useMemo(
    () => people.filter(p => p.room_id === room.id),
    [people, room.id],
  );

  const currentNow = useMemo(
    () => occupants
      .filter(p => isActiveOn(p, today))
      .sort((a, b) => a.end_date.localeCompare(b.end_date)),
    [occupants, today],
  );

  const future = useMemo(
    () => occupants
      .filter(p => isAfter(parseISO(p.start_date), today))
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [occupants, today],
  );

  // Overboeking-check: scan alle dagen vanaf vandaag tot verste end_date in deze kamer
  const isOverbooked = useMemo(() => {
    if (occupants.length === 0) return false;
    const futureOccupants = occupants.filter(p => parseISO(p.end_date) >= today);
    if (futureOccupants.length === 0) return false;
    const farthest = dateMax(futureOccupants.map(p => parseISO(p.end_date)));
    const days = eachDayOfInterval({ start: today, end: farthest });
    return days.some(day => {
      const count = futureOccupants.filter(p =>
        isWithinInterval(day, { start: parseISO(p.start_date), end: parseISO(p.end_date) }),
      ).length;
      return count > room.capacity;
    });
  }, [occupants, today, room.capacity]);

  const visibleFuture = future.slice(0, 3);
  const extraFuture = future.length - visibleFuture.length;
  const freeSlots = room.capacity - currentNow.length;

  const fmtPrice = (n: number) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  let priceLine: string | null = null;
  if (room.cost_per_person != null && room.cost_private != null) {
    priceLine = `${fmtPrice(room.cost_per_person)}/p.p. gedeeld · ${fmtPrice(room.cost_private)} privé`;
  } else if (room.cost_per_person != null) {
    priceLine = `${fmtPrice(room.cost_per_person)} per maand`;
  }

  return (
    <Card className={`rounded-[20px] ${isOverbooked ? "border-destructive border-2" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="truncate">{room.name}</span>
          {isOverbooked && (
            <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">Overboekt</Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {room.size_m2 != null && <>{room.size_m2} m² · </>}
          {room.capacity} {room.capacity === 1 ? "bed" : "bedden"}
        </p>
        {priceLine && (
          <p className="text-xs font-medium text-foreground/80">{priceLine}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Nu</div>
          {currentNow.length === 0 ? (
            <p className="text-muted-foreground italic text-xs">Leeg</p>
          ) : (
            <ul className="space-y-1">
              {currentNow.map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="font-medium truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    tot {format(parseISO(p.end_date), "d MMM yyyy", { locale: nl })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Daarna</div>
          {visibleFuture.length === 0 ? (
            <p className="text-muted-foreground italic text-xs">Geen opvolger gepland</p>
          ) : (
            <ul className="space-y-1">
              {visibleFuture.map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="font-medium truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    vanaf {format(parseISO(p.start_date), "d MMM yyyy", { locale: nl })}
                  </span>
                </li>
              ))}
              {extraFuture > 0 && (
                <li className="text-xs text-muted-foreground italic">+ {extraFuture} meer</li>
              )}
            </ul>
          )}
        </div>

        {!isOverbooked && freeSlots > 0 && currentNow.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            {freeSlots} {freeSlots === 1 ? "plek" : "plekken"} vrij
          </p>
        )}
      </CardContent>
    </Card>
  );
}
