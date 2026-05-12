import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useLocations, useTeams, useHousing, useRoomsByHousing, useCreatePerson, useUpdatePerson } from "@/hooks/personeel";
import type { Person, PersonAssignment } from "@/types/personeel";

interface PersonModalProps {
  open: boolean;
  onClose: () => void;
  person?: Person | null;
}

interface AssignmentDraft {
  location_id: string;
  team_id: string;
}

export function PersonModal({ open, onClose, person }: PersonModalProps) {
  const { data: locations = [] } = useLocations();
  const { data: teams = [] } = useTeams();
  const { data: housing = [] } = useHousing();
  const createMut = useCreatePerson();
  const updateMut = useUpdatePerson();

  const [name, setName] = useState("");
  const [assignments, setAssignments] = useState<AssignmentDraft[]>([{ location_id: "", team_id: "" }]);
  const [housingId, setHousingId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [competence, setCompetence] = useState<string>("");
  const [pay, setPay] = useState("");
  const [housingNotNeeded, setHousingNotNeeded] = useState(false);

  const { data: rooms = [] } = useRoomsByHousing(housingId || null);

  useEffect(() => {
    if (person) {
      setName(person.name);
      const initialAssignments: AssignmentDraft[] =
        person.assignments && person.assignments.length > 0
          ? person.assignments.map((a) => ({ location_id: a.location_id, team_id: a.team_id }))
          : [{ location_id: person.location_id, team_id: person.team_id }];
      setAssignments(initialAssignments);
      setHousingId(person.housing_id ?? "");
      setRoomId(person.room_id ?? "");
      setStart(parseISO(person.start_date));
      setEnd(parseISO(person.end_date));
      setDaysPerWeek(person.days_per_week?.toString() ?? "");
      setNotes(person.notes ?? "");
      setCompetence(person.competence ?? "");
      setPay(person.pay ?? "");
      setHousingNotNeeded(person.housing_not_needed ?? false);
    } else {
      setName("");
      setAssignments([{ location_id: "", team_id: "" }]);
      setHousingId("");
      setRoomId("");
      setStart(undefined);
      setEnd(undefined);
      setDaysPerWeek("");
      setNotes("");
      setCompetence("");
      setPay("");
      setHousingNotNeeded(false);
    }
    setShowDetails(false);
  }, [person, open]);

  const updateAssignment = (idx: number, patch: Partial<AssignmentDraft>) => {
    setAssignments((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const handleLocationChange = (idx: number, locId: string) => {
    updateAssignment(idx, { location_id: locId, team_id: "" });
  };

  const addAssignment = () => {
    setAssignments((prev) => [...prev, { location_id: "", team_id: "" }]);
  };

  const removeAssignment = (idx: number) => {
    setAssignments((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  // Locations already used (om dubbel toewijzen te voorkomen)
  const usedLocationIds = (currentIdx: number) =>
    new Set(assignments.filter((_, i) => i !== currentIdx).map((a) => a.location_id).filter(Boolean));

  const validAssignments = assignments.filter((a) => a.location_id && a.team_id);
  const canSubmit =
    name.trim().length > 1 && validAssignments.length === assignments.length && validAssignments.length > 0 && start && end;

  const handleSubmit = async () => {
    if (!canSubmit || !start || !end) return;
    const payload = {
      name: name.trim(),
      assignments: validAssignments as PersonAssignment[],
      housing_id: housingNotNeeded ? null : (housingId || null),
      room_id: !housingNotNeeded && housingId && roomId ? roomId : null,
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(end, "yyyy-MM-dd"),
      days_per_week: daysPerWeek ? parseInt(daysPerWeek, 10) : null,
      notes: notes.trim() || null,
      competence: (competence || null) as "sterk" | "gemiddeld" | "zwak" | null,
      pay: pay.trim() || null,
      housing_not_needed: housingNotNeeded,
    };

    try {
      if (person) {
        await updateMut.mutateAsync({ id: person.id, ...payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      onClose();
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{person ? "Collega bewerken" : "Nieuwe collega"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Naam</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Voornaam Achternaam" />
          </div>

          {/* Assignments — multi-locatie */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Vestiging & team</Label>
              {assignments.length < locations.length && (
                <Button type="button" variant="ghost" size="sm" onClick={addAssignment} className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Locatie toevoegen
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Eén persoon kan op meerdere vestigingen actief zijn. Per vestiging kies je een team.
            </p>

            <div className="space-y-2">
              {assignments.map((a, idx) => {
                const used = usedLocationIds(idx);
                const teamsForLoc = teams.filter((t) => t.location_id === a.location_id);
                return (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <Select value={a.location_id} onValueChange={(v) => handleLocationChange(idx, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies vestiging" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id} disabled={used.has(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={a.team_id}
                      onValueChange={(v) => updateAssignment(idx, { team_id: v })}
                      disabled={!a.location_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={a.location_id ? "Kies team" : "Kies eerst vestiging"} />
                      </SelectTrigger>
                      <SelectContent>
                        {teamsForLoc.length === 0 && a.location_id && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">Geen teams</div>
                        )}
                        {teamsForLoc.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAssignment(idx)}
                      disabled={assignments.length === 1}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      aria-label="Locatie verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slaapplek</Label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={housingNotNeeded}
                onChange={(e) => {
                  setHousingNotNeeded(e.target.checked);
                  if (e.target.checked) {
                    setHousingId("");
                    setRoomId("");
                  }
                }}
                className="h-4 w-4 rounded border-input"
              />
              <span>Heeft geen woonruimte nodig (woont thuis)</span>
            </label>
            <Select
              value={housingId || "__none"}
              onValueChange={(v) => {
                const next = v === "__none" ? "" : v;
                setHousingId(next);
                setRoomId("");
              }}
              disabled={housingNotNeeded}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kies slaapplek" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen slaapplek</SelectItem>
                {housing.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
                      {h.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {housingId && rooms.length > 0 && (
            <div className="space-y-2">
              <Label>Kamer</Label>
              <Select value={roomId || "__none"} onValueChange={(v) => setRoomId(v === "__none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kies kamer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Geen specifieke kamer</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.capacity > 1 && ` · ${r.capacity} bedden`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {housingId && rooms.length === 0 && (
            <p className="text-xs text-muted-foreground -mt-2">Deze slaapplek heeft geen kamers gedefinieerd.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {start ? format(start, "d MMM yyyy", { locale: nl }) : "Kies datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={start} onSelect={setStart} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Einddatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {end ? format(end, "d MMM yyyy", { locale: nl }) : "Kies datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={end} onSelect={setEnd} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            Meer details
          </button>

          {showDetails && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Dagen per week</Label>
                  <Select value={daysPerWeek} onValueChange={setDaysPerWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Competentie</Label>
                  <Select value={competence} onValueChange={setCompetence}>
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sterk">Sterk</SelectItem>
                      <SelectItem value="gemiddeld">Gemiddeld</SelectItem>
                      <SelectItem value="zwak">Zwak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Betaling</Label>
                <Input value={pay} onChange={(e) => setPay(e.target.value)} placeholder="bv. €14/uur" />
              </div>
              <div className="space-y-2">
                <Label>Notities</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button disabled={!canSubmit || createMut.isPending || updateMut.isPending} onClick={handleSubmit}>
            {person ? "Opslaan" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
