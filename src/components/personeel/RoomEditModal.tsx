import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpsertRoom } from "@/hooks/personeel";
import type { PersoneelRoom } from "@/types/personeel";

interface RoomEditModalProps {
  open: boolean;
  onClose: () => void;
  housingId: string;
  room?: PersoneelRoom | null;
  defaultSortOrder?: number;
}

export function RoomEditModal({ open, onClose, housingId, room, defaultSortOrder = 0 }: RoomEditModalProps) {
  const upsert = useUpsertRoom();

  const [name, setName] = useState("");
  const [sizeM2, setSizeM2] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [costPerPerson, setCostPerPerson] = useState("");
  const [costPrivate, setCostPrivate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(room?.name ?? "");
      setSizeM2(room?.size_m2 != null ? String(room.size_m2) : "");
      setCapacity(room?.capacity != null ? String(room.capacity) : "1");
      setCostPerPerson(room?.cost_per_person != null ? String(room.cost_per_person) : "");
      setCostPrivate(room?.cost_private != null ? String(room.cost_private) : "");
      setNotes(room?.notes ?? "");
    }
  }, [open, room]);

  const canSubmit = name.trim().length > 0 && parseInt(capacity || "0", 10) > 0;

  const parseNumOrNull = (v: string): number | null => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await upsert.mutateAsync({
        id: room?.id,
        housing_id: housingId,
        name: name.trim(),
        size_m2: parseNumOrNull(sizeM2),
        capacity: parseInt(capacity, 10),
        cost_per_person: parseNumOrNull(costPerPerson),
        cost_private: parseNumOrNull(costPrivate),
        notes: notes.trim() || null,
        sort_order: room?.sort_order ?? defaultSortOrder,
      });
      onClose();
    } catch {
      // toast in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{room ? "Kamer bewerken" : "Nieuwe kamer"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="r-name">Naam</Label>
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bv. Kamer 1, Zolder, Achterkamer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-size">Oppervlakte (m²)</Label>
              <Input
                id="r-size"
                type="number"
                step="0.5"
                min="0"
                value={sizeM2}
                onChange={(e) => setSizeM2(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-cap">Aantal bedden</Label>
              <Input
                id="r-cap"
                type="number"
                step="1"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-cpp">Prijs per persoon / maand (€)</Label>
              <Input
                id="r-cpp"
                type="number"
                step="1"
                min="0"
                value={costPerPerson}
                onChange={(e) => setCostPerPerson(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-cpr">Prijs bij privégebruik / maand (€)</Label>
              <Input
                id="r-cpr"
                type="number"
                step="1"
                min="0"
                value={costPrivate}
                onChange={(e) => setCostPrivate(e.target.value)}
                placeholder="—"
              />
              <p className="text-xs text-muted-foreground">
                Alleen voor 2-persoonskamers die ook solo verhuurd kunnen worden
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="r-notes">Notities</Label>
            <Textarea
              id="r-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optioneel"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button disabled={!canSubmit || upsert.isPending} onClick={handleSubmit}>
            {room ? "Opslaan" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
