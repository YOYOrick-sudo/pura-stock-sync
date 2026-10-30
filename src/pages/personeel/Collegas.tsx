import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePeople, useLocations, useTeams, useHousing, useSoftDeletePerson, usePersoneelFilters } from "@/hooks/personeel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreVertical, Plus, X } from "lucide-react";
import { PersonModal } from "@/components/personeel/PersonModal";
import { categorizeByDate, formatPeriod } from "@/lib/personeel-utils";
import type { Person } from "@/types/personeel";
import { copy } from "@/lib/personeel-copy";
import { useIsMobile } from '@/hooks/use-mobile';

type ViewKey = "actief" | "toekomstig" | "afgelopen";

export default function Collegas() {
  const isMobile = useIsMobile();
  const { data: people = [], isLoading } = usePeople();
  const { data: locations = [] } = useLocations();
  const { data: teams = [] } = useTeams();
  const { data: housing = [] } = useHousing();
  const softDelete = useSoftDeletePerson();
  const { filters, hasAny, toggleLocation, toggleTeam, toggleHousing, setQ, clear } = usePersoneelFilters();

  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get("view") as ViewKey) || "actief";
  const setView = (v: ViewKey) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("view", v);
    setSearchParams(sp, { replace: true });
  };

  const [editing, setEditing] = useState<Person | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null);

  // Geef alle (location_id, team_id) paren van een persoon terug — uit assignments, of fallback naar legacy
  const personAssignments = (p: Person): { location_id: string; team_id: string }[] => {
    if (p.assignments && p.assignments.length > 0) return p.assignments;
    return [{ location_id: p.location_id, team_id: p.team_id }];
  };

  const filtered = useMemo(() => {
    return people.filter(p => {
      const aList = personAssignments(p);
      if (filters.locations.length && !aList.some(a => filters.locations.includes(a.location_id))) return false;
      if (filters.teams.length && !aList.some(a => filters.teams.includes(a.team_id))) return false;
      if (filters.housing.length && !filters.housing.includes(p.housing_id ?? "")) return false;
      if (filters.q && !p.name.toLowerCase().includes(filters.q.toLowerCase())) return false;
      return true;
    });
  }, [people, filters]);

  const { current, future, past } = useMemo(() => categorizeByDate(filtered), [filtered]);

  const locName = (id: string) => locations.find(l => l.id === id)?.name ?? "—";
  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? "—";
  const housingObj = (id: string | null) => housing.find(h => h.id === id);

  // Group people by location_id (een persoon met meerdere locaties verschijnt in elke groep)
  const groupByLocation = (list: Person[]) => {
    const sortedLocs = [...locations].sort((a, b) => a.sort_order - b.sort_order);
    return sortedLocs
      .map(loc => ({
        loc,
        people: list
          .filter(p => personAssignments(p).some(a => a.location_id === loc.id))
          .sort((a, b) => a.start_date.localeCompare(b.start_date)),
      }))
      .filter(g => g.people.length > 0);
  };

  const renderGrouped = (list: Person[]) => {
    const groups = groupByLocation(list);
    if (groups.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm">Geen collega's in deze categorie</div>
      );
    }
    return (
      <Card className="rounded-[20px] overflow-hidden">
        <Table className={isMobile ? 'min-w-[48rem] [&_tr>th:first-child]:sticky [&_tr>th:first-child]:left-0 [&_tr>th:first-child]:z-10 [&_tr>th:first-child]:bg-card [&_tr>td:first-child]:sticky [&_tr>td:first-child]:left-0 [&_tr>td:first-child]:z-10 [&_tr>td:first-child]:bg-card [&_tr>td:first-child]:max-w-48 [&_tr>td:first-child]:break-words' : undefined}>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Slaapplek</TableHead>
              <TableHead>Competentie</TableHead>
              <TableHead>Betaling</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(g => (
              <>
                <TableRow key={`g-${g.loc.id}`} className="bg-muted/60 hover:bg-muted/60">
                  <TableCell colSpan={7} className="font-semibold text-sm py-2">
                    {g.loc.name} <span className="text-muted-foreground font-normal">({g.people.length})</span>
                  </TableCell>
                </TableRow>
                {g.people.map(p => {
                  const h = housingObj(p.housing_id);
                  const aList = personAssignments(p);
                  const teamForThisLoc = aList.find(a => a.location_id === g.loc.id)?.team_id ?? p.team_id;
                  const multi = aList.length > 1;
                  return (
                    <TableRow key={`${p.id}-${g.loc.id}`}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          {p.name}
                          {multi && (
                            <span
                              className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                              title={`Ook actief op: ${aList.filter(a => a.location_id !== g.loc.id).map(a => locName(a.location_id)).join(", ")}`}
                            >
                              multi
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{teamName(teamForThisLoc)}</TableCell>
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
                            <Button variant="ghost" size="icon" className="h-11 w-11">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className={isMobile ? 'min-h-11' : undefined} onClick={() => setEditing(p)}>{copy.bewerken}</DropdownMenuItem>
                            <DropdownMenuItem className={isMobile ? 'text-destructive min-h-11' : 'text-destructive'} onClick={() => setConfirmDelete(p)}>
                              {copy.verwijderen}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className={isMobile ? 'space-y-4 min-w-0 max-w-full [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:h-11 [&_input]:min-w-0 [&_input]:text-base' : 'space-y-4'}>
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

      <div className={isMobile ? 'flex flex-nowrap gap-2 min-w-0 overflow-x-auto [&>.cursor-pointer]:min-h-11 [&>.cursor-pointer]:shrink-0 [&>.cursor-pointer]:whitespace-nowrap [&>button]:shrink-0' : 'flex flex-wrap gap-2'}>
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
            {t.name} <span className="text-muted-foreground ml-1">({locName(t.location_id)})</span>
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

      <Tabs value={view} onValueChange={(v) => setView(v as ViewKey)}>
        <div className={isMobile ? 'min-w-0 max-w-full overflow-x-auto' : undefined}>
        <TabsList className={isMobile ? 'h-auto w-max min-w-full flex-nowrap [&>button]:shrink-0 [&>button]:whitespace-nowrap' : undefined}>
          <TabsTrigger value="actief">Actief nu ({current.length})</TabsTrigger>
          <TabsTrigger value="toekomstig">Toekomstig ({future.length})</TabsTrigger>
          <TabsTrigger value="afgelopen">Afgelopen ({past.length})</TabsTrigger>
        </TabsList>
        </div>
        <TabsContent value="actief" className="mt-4">{renderGrouped(current)}</TabsContent>
        <TabsContent value="toekomstig" className="mt-4">{renderGrouped(future)}</TabsContent>
        <TabsContent value="afgelopen" className="mt-4">{renderGrouped(past)}</TabsContent>
      </Tabs>

      {showNew && <PersonModal open={showNew} onClose={() => setShowNew(false)} />}
      {editing && <PersonModal open={!!editing} onClose={() => setEditing(null)} person={editing} />}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className={isMobile ? 'min-w-0 [&_button]:min-h-11 [&_button]:min-w-11' : undefined}>
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
