import { useMemo, useState } from "react";
import { usePeople, useLocations, useTeams, useHousing, useSoftDeletePerson, usePersoneelFilters } from "@/hooks/personeel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreVertical, Plus, X } from "lucide-react";
import { PersonModal } from "@/components/personeel/PersonModal";
import { formatPeriod } from "@/lib/personeel-utils";
import type { Person } from "@/types/personeel";
import { copy } from "@/lib/personeel-copy";

export default function Collegas() {
  const { data: people = [], isLoading } = usePeople();
  const { data: locations = [] } = useLocations();
  const { data: teams = [] } = useTeams();
  const { data: housing = [] } = useHousing();
  const softDelete = useSoftDeletePerson();
  const { filters, hasAny, toggleLocation, toggleTeam, toggleHousing, setQ, clear } = usePersoneelFilters();

  const [editing, setEditing] = useState<Person | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null);

  const filtered = useMemo(() => {
    return people.filter(p => {
      if (filters.locations.length && !filters.locations.includes(p.location_id)) return false;
      if (filters.teams.length && !filters.teams.includes(p.team_id)) return false;
      if (filters.housing.length && !filters.housing.includes(p.housing_id ?? "")) return false;
      if (filters.q && !p.name.toLowerCase().includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [people, filters]);

  const locName = (id: string) => locations.find(l => l.id === id)?.name ?? "—";
  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "—";
  const housingObj = (id: string | null) => housing.find(h => h.id === id);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={copy.zoekCollega}
          value={filters.q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => setShowNew(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-1" /> {copy.nieuweCollega}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {locations.map(l => (
          <Badge
            key={l.id}
            variant={filters.locations.includes(l.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleLocation(l.id)}
          >
            {l.name}
          </Badge>
        ))}
        {teams.map(t => (
          <Badge
            key={t.id}
            variant={filters.teams.includes(t.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTeam(t.id)}
          >
            {t.name}
          </Badge>
        ))}
        {housing.map(h => (
          <Badge
            key={h.id}
            variant={filters.housing.includes(h.id) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleHousing(h.id)}
          >
            <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: h.color }} />
            {h.name}
          </Badge>
        ))}
        {hasAny && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X className="h-3 w-3 mr-1" /> {copy.wis_filters}
          </Button>
        )}
      </div>

      <Card className="rounded-[20px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Vestiging</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Slaapplek</TableHead>
              <TableHead>Competentie</TableHead>
              <TableHead>Betaling</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Geen collega's gevonden
                </TableCell>
              </TableRow>
            ) : filtered.map(p => {
              const h = housingObj(p.housing_id);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{locName(p.location_id)}</TableCell>
                  <TableCell>{teamName(p.team_id)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatPeriod(p.start_date, p.end_date)}</TableCell>
                  <TableCell>
                    {h ? (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: h.color }} />
                        {h.name}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{p.competence ?? "—"}</TableCell>
                  <TableCell className="text-sm">{p.pay ?? "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(p)}>{copy.bewerken}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete(p)}>
                          {copy.verwijderen}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {showNew && <PersonModal open={showNew} onClose={() => setShowNew(false)} />}
      {editing && <PersonModal open={!!editing} onClose={() => setEditing(null)} person={editing} />}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.weet_je_zeker}</AlertDialogTitle>
            <AlertDialogDescription>{copy.archiveer_uitleg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.annuleren}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) softDelete.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.verwijderen}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
