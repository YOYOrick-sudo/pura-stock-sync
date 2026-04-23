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
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(room?.name ?? "");
      setSizeM2(room?.size_m2 != null ? String(room.size_m2) : "");
      setCapacity(room?.capacity != null ? String(room.capacity) : "1");
      setNotes(room?.notes ?? "");
    }
  }, [open, room]);

  const canSubmit = name.trim().length > 0 && parseInt(capacity || "0", 10) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await upsert.mutateAsync({
        id: room?.id,
        housing_id: housingId,
        name: name.trim(),
        size_m2: sizeM2.trim() ? Number(sizeM2.replace(",", ".")) : null,
        capacity: parseInt(capacity, 10),
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
