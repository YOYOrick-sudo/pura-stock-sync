import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useLocations, useTeamsByLocation, useHousing, useRoomsByHousing, useCreatePerson, useUpdatePerson } from "@/hooks/personeel";
import type { Person } from "@/types/personeel";

interface PersonModalProps {
  open: boolean;
  onClose: () => void;
  person?: Person | null;
}

export function PersonModal({ open, onClose, person }: PersonModalProps) {
  const { data: locations = [] } = useLocations();
  const { data: housing = [] } = useHousing();
  const createMut = useCreatePerson();
  const updateMut = useUpdatePerson();

  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [housingId, setHousingId] = useState<string>("");
  const [start, setStart] = useState<Date | undefined>();
  const [end, setEnd] = useState<Date | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [competence, setCompetence] = useState<string>("");
  const [pay, setPay] = useState("");

  const { data: teams = [] } = useTeamsByLocation(locationId || null);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setLocationId(person.location_id);
      setTeamId(person.team_id);
      setHousingId(person.housing_id ?? "");
      setStart(parseISO(person.start_date));
      setEnd(parseISO(person.end_date));
      setDaysPerWeek(person.days_per_week?.toString() ?? "");
      setNotes(person.notes ?? "");
      setCompetence(person.competence ?? "");
      setPay(person.pay ?? "");
    } else {
      setName(""); setLocationId(""); setTeamId(""); setHousingId("");
      setStart(undefined); setEnd(undefined); setDaysPerWeek("");
      setNotes(""); setCompetence(""); setPay("");
    }
    setShowDetails(false);
  }, [person, open]);

  // Wanneer vestiging wijzigt en het gekozen team niet meer past → reset team
  const handleLocationChange = (newLoc: string) => {
    setLocationId(newLoc);
    setTeamId("");
  };

  const canSubmit = name.trim().length > 1 && locationId && teamId && start && end;

  const handleSubmit = async () => {
    if (!canSubmit || !start || !end) return;
    const payload = {
      name: name.trim(),
      location_id: locationId,
      team_id: teamId,
      housing_id: housingId || null,
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(end, "yyyy-MM-dd"),
      days_per_week: daysPerWeek ? parseInt(daysPerWeek, 10) : null,
      notes: notes.trim() || null,
      competence: (competence || null) as "sterk" | "gemiddeld" | "zwak" | null,
      pay: pay.trim() || null,
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
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{person ? "Collega bewerken" : "Nieuwe collega"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Naam</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Voornaam Achternaam" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vestiging</Label>
              <Select value={locationId} onValueChange={handleLocationChange}>
                <SelectTrigger><SelectValue placeholder="Kies vestiging" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId} disabled={!locationId}>
                <SelectTrigger>
                  <SelectValue placeholder={locationId ? "Kies team" : "Kies eerst vestiging"} />
                </SelectTrigger>
                <SelectContent>
                  {teams.length === 0 && locationId && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Geen teams in deze vestiging</div>
                  )}
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Slaapplek</Label>
            <Select value={housingId || "__none"} onValueChange={(v) => setHousingId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Kies slaapplek" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Geen slaapplek</SelectItem>
                {housing.map(h => (
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
            onClick={() => setShowDetails(s => !s)}
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
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Competentie</Label>
                  <Select value={competence} onValueChange={setCompetence}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
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
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button disabled={!canSubmit || createMut.isPending || updateMut.isPending} onClick={handleSubmit}>
            {person ? "Opslaan" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
