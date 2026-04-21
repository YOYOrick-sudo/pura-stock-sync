import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useLocations, useUpsertLocation, useDeleteLocation, useTeams, useUpsertTeam, useDeleteTeam, useHousing, useUpsertHousing, useDeleteHousing } from "@/hooks/personeel";
import { ColorPickerModal } from "@/components/personeel/ColorPickerModal";

export default function PersoneelSettings() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <LocationsSection />
      <TeamsSection />
      <HousingSection />
    </div>
  );
}

function LocationsSection() {
  const { data: locations = [] } = useLocations();
  const upsert = useUpsertLocation();
  const remove = useDeleteLocation();
  const [newName, setNewName] = useState("");

  return (
    <Card className="rounded-[20px]">
      <CardHeader><CardTitle>Vestigingen</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {locations.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2">
            <Input
              defaultValue={l.name}
              onBlur={(e) => e.target.value !== l.name && upsert.mutate({ id: l.id, name: e.target.value, sort_order: l.sort_order ?? i })}
            />
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(l.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2 pt-2 border-t">
          <Input placeholder="Nieuwe vestiging" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={() => { if (newName.trim()) { upsert.mutate({ name: newName.trim(), sort_order: locations.length }); setNewName(""); } }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamsSection() {
  const { data: teams = [] } = useTeams();
  const upsert = useUpsertTeam();
  const remove = useDeleteTeam();
  const [newName, setNewName] = useState("");

  return (
    <Card className="rounded-[20px]">
      <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {teams.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2">
            <Input
              defaultValue={t.name}
              onBlur={(e) => e.target.value !== t.name && upsert.mutate({ id: t.id, name: e.target.value, sort_order: t.sort_order ?? i })}
            />
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(t.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2 pt-2 border-t">
          <Input placeholder="Nieuw team" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={() => { if (newName.trim()) { upsert.mutate({ name: newName.trim(), sort_order: teams.length }); setNewName(""); } }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HousingSection() {
  const { data: housing = [] } = useHousing();
  const upsert = useUpsertHousing();
  const remove = useDeleteHousing();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#9CA3AF");
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  return (
    <Card className="rounded-[20px]">
      <CardHeader><CardTitle>Slaapplekken</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {housing.map((h, i) => (
          <div key={h.id} className="flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-md border border-border shrink-0"
              style={{ backgroundColor: h.color }}
              onClick={() => setPickerFor(h.id)}
              aria-label="Kies kleur"
            />
            <Input
              defaultValue={h.name}
              onBlur={(e) => e.target.value !== h.name && upsert.mutate({ id: h.id, name: e.target.value, color: h.color, capacity: h.capacity, sort_order: h.sort_order ?? i })}
            />
            <Input
              type="number"
              min={0}
              defaultValue={h.capacity ?? ""}
              placeholder="cap."
              className="w-20"
              onBlur={(e) => {
                const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
                if (v !== h.capacity) upsert.mutate({ id: h.id, name: h.name, color: h.color, capacity: v, sort_order: h.sort_order ?? i });
              }}
            />
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(h.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            {pickerFor === h.id && (
              <ColorPickerModal
                open
                initialColor={h.color}
                onClose={() => setPickerFor(null)}
                onSelect={(color) => upsert.mutate({ id: h.id, name: h.name, color, capacity: h.capacity, sort_order: h.sort_order ?? i })}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-2 border-t items-center">
          <button
            type="button"
            className="w-8 h-8 rounded-md border border-border shrink-0"
            style={{ backgroundColor: newColor }}
            onClick={() => setPickerFor("__new")}
          />
          <Input placeholder="Nieuwe slaapplek" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={() => {
            if (newName.trim()) {
              upsert.mutate({ name: newName.trim(), color: newColor, capacity: null, sort_order: housing.length });
              setNewName(""); setNewColor("#9CA3AF");
            }
          }}>
            <Plus className="h-4 w-4" />
          </Button>
          {pickerFor === "__new" && (
            <ColorPickerModal
              open
              initialColor={newColor}
              onClose={() => setPickerFor(null)}
              onSelect={(c) => setNewColor(c)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
