import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
import {
  useLocations, useUpsertLocation, useDeleteLocation,
  useTeams, useUpsertTeam, useDeleteTeam,
  useHousing, useUpsertHousing, useDeleteHousing,
} from "@/hooks/personeel";
import { ColorPickerModal } from "@/components/personeel/ColorPickerModal";
import { HousingEditModal } from "@/components/personeel/HousingEditModal";
import type { PersoneelHousing } from "@/types/personeel";

type TabKey = "vestigingen" | "teams" | "slaapplekken";

export default function PersoneelSettings() {
  const { data: locations = [] } = useLocations();
  const { data: teams = [] } = useTeams();
  const { data: housing = [] } = useHousing();

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) || "vestigingen";
  const setTab = (t: TabKey) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", t);
    setSearchParams(sp, { replace: true });
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="vestigingen">Vestigingen ({locations.length})</TabsTrigger>
          <TabsTrigger value="teams">Teams ({teams.length})</TabsTrigger>
          <TabsTrigger value="slaapplekken">Slaapplekken ({housing.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vestigingen" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">De fysieke locaties waar collega's werken.</p>
          <LocationsSection />
        </TabsContent>

        <TabsContent value="teams" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Functiegroepen per vestiging.</p>
          <TeamsSection />
        </TabsContent>

        <TabsContent value="slaapplekken" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Waar collega's verblijven tijdens hun werkperiode.</p>
          <HousingSection />
        </TabsContent>
      </Tabs>
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
      <CardContent className="p-4 space-y-2">
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
  const { data: locations = [] } = useLocations();
  const upsert = useUpsertTeam();
  const remove = useDeleteTeam();
  const [newName, setNewName] = useState("");
  const [newLocationId, setNewLocationId] = useState<string>("");

  const sortedLocs = [...locations].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card className="rounded-[20px]">
      <CardContent className="p-4 space-y-4">
        {sortedLocs.map(loc => {
          const locTeams = teams.filter(t => t.location_id === loc.id).sort((a, b) => a.sort_order - b.sort_order);
          return (
            <div key={loc.id} className="space-y-2">
              <div className="text-sm font-semibold text-foreground border-b pb-1">{loc.name}</div>
              {locTeams.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">Geen teams</p>
              ) : (
                locTeams.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Input
                      defaultValue={t.name}
                      onBlur={(e) => e.target.value !== t.name && upsert.mutate({ id: t.id, name: e.target.value, location_id: t.location_id, sort_order: t.sort_order ?? i })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          );
        })}

        <div className="pt-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground">Nieuw team toevoegen</div>
          <div className="flex gap-2">
            <Select value={newLocationId} onValueChange={setNewLocationId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Vestiging" />
              </SelectTrigger>
              <SelectContent>
                {sortedLocs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Teamnaam" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button
              disabled={!newName.trim() || !newLocationId}
              onClick={() => {
                const sortOrder = teams.filter(t => t.location_id === newLocationId).length;
                upsert.mutate({ name: newName.trim(), location_id: newLocationId, sort_order: sortOrder });
                setNewName("");
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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
  const [editing, setEditing] = useState<PersoneelHousing | null>(null);

  return (
    <Card className="rounded-[20px]">
      <CardContent className="p-4 space-y-2">
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
            <Button variant="ghost" size="icon" onClick={() => setEditing(h)} title="Meer details">
              <SettingsIcon className="h-4 w-4" />
            </Button>
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
      {editing && <HousingEditModal open={!!editing} onClose={() => setEditing(null)} housing={editing} />}
    </Card>
  );
}
