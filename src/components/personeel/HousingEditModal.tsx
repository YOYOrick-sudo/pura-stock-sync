import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useUpsertHousing } from "@/hooks/personeel";
import { ColorPickerModal } from "@/components/personeel/ColorPickerModal";
import type { PersoneelHousing } from "@/types/personeel";
import { HOUSING_FACILITY_PRESETS } from "@/types/personeel";

interface HousingEditModalProps {
  open: boolean;
  onClose: () => void;
  housing: PersoneelHousing;
}

export function HousingEditModal({ open, onClose, housing }: HousingEditModalProps) {
  const upsert = useUpsertHousing();

  const [name, setName] = useState(housing.name);
  const [color, setColor] = useState(housing.color);
  const [capacity, setCapacity] = useState<string>(housing.capacity?.toString() ?? "");
  const [address, setAddress] = useState(housing.address ?? "");
  const [contactName, setContactName] = useState(housing.contact_name ?? "");
  const [costPerMonth, setCostPerMonth] = useState<string>(housing.cost_per_month?.toString() ?? "");
  const [rooms, setRooms] = useState<string>(housing.rooms?.toString() ?? "");
  const [roomSize, setRoomSize] = useState<string>(housing.room_size_m2?.toString() ?? "");
  const [facilities, setFacilities] = useState<string[]>(housing.facilities ?? []);
  const [description, setDescription] = useState(housing.description ?? "");
  const [notes, setNotes] = useState(housing.notes ?? "");
  const [customFacility, setCustomFacility] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(housing.name);
      setColor(housing.color);
      setCapacity(housing.capacity?.toString() ?? "");
      setAddress(housing.address ?? "");
      setContactName(housing.contact_name ?? "");
      setCostPerMonth(housing.cost_per_month?.toString() ?? "");
      setRooms(housing.rooms?.toString() ?? "");
      setRoomSize(housing.room_size_m2?.toString() ?? "");
      setFacilities(housing.facilities ?? []);
      setDescription(housing.description ?? "");
      setNotes(housing.notes ?? "");
      setCustomFacility("");
    }
  }, [open, housing]);

  const toggleFacility = (f: string) => {
    setFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const addCustomFacility = () => {
    const v = customFacility.trim().toLowerCase();
    if (v && !facilities.includes(v)) {
      setFacilities([...facilities, v]);
      setCustomFacility("");
    }
  };

  const handleSave = async () => {
    await upsert.mutateAsync({
      id: housing.id,
      name: name.trim(),
      color,
      capacity: capacity === "" ? null : parseInt(capacity, 10),
      sort_order: housing.sort_order,
      address: address.trim() || null,
      contact_name: contactName.trim() || null,
      cost_per_month: costPerMonth === "" ? null : parseFloat(costPerMonth),
      rooms: rooms === "" ? null : parseInt(rooms, 10),
      room_size_m2: roomSize === "" ? null : parseFloat(roomSize),
      facilities,
      description: description.trim() || null,
      notes: notes.trim() || null,
    });
    onClose();
  };

  const customFacilities = facilities.filter(f => !HOUSING_FACILITY_PRESETS.includes(f as typeof HOUSING_FACILITY_PRESETS[number]));

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Slaapplek bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basis */}
            <div className="grid grid-cols-[auto_1fr_120px] gap-3 items-end">
              <div className="space-y-2">
                <Label>Kleur</Label>
                <button
                  type="button"
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: color }}
                  onClick={() => setPickerOpen(true)}
                  aria-label="Kies kleur"
                />
              </div>
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Capaciteit</Label>
                <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adres</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straat 12, Plaats" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contactpersoon</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kosten p/m (€)</Label>
                <Input type="number" min={0} step="0.01" value={costPerMonth} onChange={(e) => setCostPerMonth(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Aantal kamers</Label>
                <Input type="number" min={0} value={rooms} onChange={(e) => setRooms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kamergrootte (m²)</Label>
                <Input type="number" min={0} step="0.1" value={roomSize} onChange={(e) => setRoomSize(e.target.value)} />
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-2">
              <Label>Voorzieningen</Label>
              <div className="flex flex-wrap gap-2">
                {HOUSING_FACILITY_PRESETS.map(f => (
                  <Badge
                    key={f}
                    variant={facilities.includes(f) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleFacility(f)}
                  >
                    {f}
                  </Badge>
                ))}
                {customFacilities.map(f => (
                  <Badge key={f} variant="default" className="cursor-pointer gap-1 capitalize" onClick={() => toggleFacility(f)}>
                    {f}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="andere voorziening"
                  value={customFacility}
                  onChange={(e) => setCustomFacility(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFacility())}
                />
                <Button type="button" variant="outline" onClick={addCustomFacility}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschrijving</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Notities</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Interne notities" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Annuleren</Button>
            <Button onClick={handleSave} disabled={upsert.isPending || !name.trim()}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {pickerOpen && (
        <ColorPickerModal
          open
          initialColor={color}
          onClose={() => setPickerOpen(false)}
          onSelect={(c) => setColor(c)}
        />
      )}
    </>
  );
}
