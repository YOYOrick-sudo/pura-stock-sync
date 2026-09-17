import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { MepTaakToevoegen } from '@/components/kitchen/MepTaakToevoegen';
import { MepAfrondDialog } from '@/components/kitchen/MepAfrondDialog';
import { MepTaakBewerken } from '@/components/kitchen/MepTaakBewerken';
import {
  Plus,
  Check,
  Undo2,
  Trash2,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tag,
  CalendarDays,
  ChevronDown,
  AlertTriangle,
  GripVertical,
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useKeukenMedewerkers } from '@/hooks/useMepPlanning';
import {
  MepTaak,
  
  dagenOpen,
  useMepTaakMutaties,
  useMepTaken,
  useProductieBatches,
  ymd,
} from '@/hooks/useMepTaken';

const PRIO_LABEL: Record<number, string> = { 1: 'Belangrijk' };
const PRIO_CLASS: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function MepDag() {
  const navigate = useNavigate();
  const { userLocation } = useUserLocation();
  const vestiging = userLocation ?? '';
  const [params, setParams] = useSearchParams();
  const datumParam = params.get('datum');
  const initieleOffset = datumParam
    ? differenceInCalendarDays(parseISO(datumParam), new Date())
    : 0;
  const [dagOffset, setDagOffsetState] = useState(Number.isFinite(initieleOffset) ? initieleOffset : 0);
  const datum = ymd(addDays(new Date(), dagOffset));
  const setDagOffset = (fn: (d: number) => number) => {
    setDagOffsetState((d) => {
      const next = fn(d);
      const nieuweDatum = ymd(addDays(new Date(), next));
      if (next === 0) setParams({}, { replace: true });
      else setParams({ datum: nieuweDatum }, { replace: true });
      return next;
    });
  };

  const { data: taken = [], isLoading } = useMepTaken(vestiging, datum);
  const { data: batches = [] } = useProductieBatches(vestiging, datum);
  const { data: medewerkers = [] } = useKeukenMedewerkers(vestiging);
  const { toevoegen, bijwerken, verwijderen, afronden, heropenen, herordenen } =
    useMepTaakMutaties(vestiging, datum);

  // Slepen: op tablet pas na een korte druk, zodat scrollen en tikken normaal blijft.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [afrondTaak, setAfrondTaak] = useState<MepTaak | null>(null);
  const [bewerkTaak, setBewerkTaak] = useState<MepTaak | null>(null);
  const [weergave, setWeergave] = useState<'alles' | 'persoon' | 'handeling'>('alles');
  const [batchesOpen, setBatchesOpen] = useState(false);

  const open = taken.filter((t) => t.status !== 'afgerond');
  const klaar = taken.filter((t) => t.status === 'afgerond');
  const voortgang = taken.length ? Math.round((klaar.length / taken.length) * 100) : 0;

  const groepen = useMemo(() => {
    if (weergave === 'alles') {
      return [['Alle taken', taken]] as [string, MepTaak[]][];
    }
    const map = new Map<string, MepTaak[]>();
    for (const t of taken) {
      const sleutel =
        weergave === 'handeling'
          ? t.handeling || 'Geen handeling'
          : medewerkers.find((m) => m.id === t.toegewezen_aan)?.name ?? 'Niet toegewezen';
      if (!map.has(sleutel)) map.set(sleutel, []);
      map.get(sleutel)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'nl'));
  }, [taken, weergave, medewerkers, datum]);


  const dagLabel =
    dagOffset === 0
      ? 'Vandaag'
      : dagOffset === 1
        ? 'Morgen'
        : format(addDays(new Date(), dagOffset), 'EEEE d MMMM', { locale: nl });

  const verwijder = async (t: MepTaak) => {
    try {
      await verwijderen.mutateAsync(t.id);
      toast.success('Taak verwijderd');
    } catch (e: any) {
      toast.error('Verwijderen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const heropen = async (t: MepTaak) => {
    try {
      await heropenen.mutateAsync(t.id);
      toast.success('Taak weer open gezet');
    } catch (e: any) {
      toast.error('Heropenen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-4">
        {/* Kop */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium capitalize">
              {format(addDays(new Date(), dagOffset), 'EEEE d MMMM', { locale: nl })}
            </p>
            <p className="text-sm text-muted-foreground">
              {vestiging} · {klaar.length}/{taken.length} klaar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => setDagOffset((d) => d - 1)}
              aria-label="Vorige dag"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="min-w-[92px] text-center text-[15px] font-medium">{dagLabel}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => setDagOffset((d) => d + 1)}
              aria-label="Volgende dag"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => navigate('/kitchen/mep/week')}
              aria-label="Weekweergave"
            >
              <CalendarDays className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-11 w-11"
              onClick={() => navigate('/settings/mep')}
              aria-label="Instellingen"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Voortgang */}
        <Card className="p-3 sm:p-4 bg-card shadow-sm">
          <Progress value={voortgang} className="h-2" />
        </Card>

        {/* Taak toevoegen — inline */}
        <MepTaakToevoegen
          vestiging={vestiging}
          datum={datum}
          medewerkers={medewerkers}
          onToevoegen={(input) => toevoegen.mutateAsync(input)}
          onBijwerken={(taakId, patch) => bijwerken.mutateAsync({ id: taakId, ...patch })}
        />

        <Tabs
          value={weergave}
          onValueChange={(v) => setWeergave(v as 'alles' | 'persoon' | 'handeling')}
        >
          <TabsList>
            <TabsTrigger value="alles">Alle taken</TabsTrigger>
            <TabsTrigger value="persoon">Per persoon</TabsTrigger>

            <TabsTrigger value="handeling">Per handeling</TabsTrigger>
          </TabsList>
        </Tabs>


        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
        ) : taken.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nog geen MEP voor deze dag"
            description="Gebruik het zoekveld hierboven om halffabricaten of vrije taken toe te voegen."
          />
        ) : (
          <div className="space-y-4">
            {groepen.map(([naam, rijen]) => {
              const openRijen = rijen.filter((r) => r.status !== 'afgerond');
              const klaarRijen = rijen.filter((r) => r.status === 'afgerond');
              const kanSlepen = weergave === 'alles' && openRijen.length > 1;
              const rij = (t: MepTaak) => (
                <TaakRij
                  key={t.id}
                  t={t}
                  datum={datum}
                  weergave={weergave}
                  medewerkers={medewerkers}
                  sleepbaar={kanSlepen && t.status !== 'afgerond'}
                  onBewerk={setBewerkTaak}
                  onAfrond={setAfrondTaak}
                  onHeropen={heropen}
                  onVerwijder={verwijder}
                />
              );
              return (
                <Card key={naam} className="overflow-hidden bg-card shadow-sm">
                  <div className="px-4 sm:px-5 py-3 border-b border-border/60 flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {naam}
                    </h2>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {klaarRijen.length}/{rijen.length}
                    </span>
                  </div>
                  {kanSlepen ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => sleepKlaar(e, openRijen)}
                    >
                      <SortableContext
                        items={openRijen.map((r) => r.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="divide-y divide-border/60">{openRijen.map(rij)}</ul>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <ul className="divide-y divide-border/60">{openRijen.map(rij)}</ul>
                  )}
                  {klaarRijen.length > 0 && (
                    <>
                      <div className="px-4 sm:px-5 pt-3 pb-1 flex items-center gap-2">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Afgerond
                        </span>
                        <span className="h-px flex-1 bg-border/60" />
                      </div>
                      <ul className="divide-y divide-border/60">
                        {klaarRijen.map(rij)}
                      </ul>
                    </>
                  )}
                </Card>
              );
            })}

          </div>
        )}

        {/* Batches van vandaag */}
        {batches.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setBatchesOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', !batchesOpen && '-rotate-90')} />
              Geproduceerd vandaag ({batches.length})
            </button>
            {batchesOpen && (
            <ul className="mt-1 divide-y divide-border/60">
              {batches.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{b.omschrijving}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {b.hoeveelheid ? `${Number(b.hoeveelheid)} ${b.eenheid ?? ''} · ` : ''}
                    {b.batch_nummer}
                    {b.houdbaar_tot
                      ? ` · t/m ${format(new Date(b.houdbaar_tot), 'd MMM', { locale: nl })}`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
            )}
          </div>
        )}
      </div>

      <MepAfrondDialog
        taak={afrondTaak}
        onOpenChange={(v) => !v && setAfrondTaak(null)}
        onAfronden={(args) => afronden.mutateAsync(args)}
      />

      <MepTaakBewerken
        taak={bewerkTaak}
        vestiging={vestiging}
        medewerkers={medewerkers}
        onOpenChange={(v) => !v && setBewerkTaak(null)}
        onOpslaan={(taakId, patch) => bijwerken.mutateAsync({ id: taakId, ...patch })}
      />

    </SidebarLayout>
  );
}
