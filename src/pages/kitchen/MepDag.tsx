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
  useDroppable,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  User,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tag,
  CalendarDays,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  Info,
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

  // Taken die vooruit gepland zijn blijven zichtbaar, maar apart: ze tellen niet
  // mee in de voortgang van deze dag.
  const dagTaken = useMemo(() => taken.filter((t) => t.taak_datum <= datum), [taken, datum]);
  const laterTaken = useMemo(() => taken.filter((t) => t.taak_datum > datum), [taken, datum]);

  const klaar = dagTaken.filter((t) => t.status === 'afgerond');
  const voortgang = dagTaken.length ? Math.round((klaar.length / dagTaken.length) * 100) : 0;
  const isVandaag = datum === ymd(new Date());
  const teLaat = isVandaag
    ? dagTaken.filter((t) => t.status !== 'afgerond' && t.taak_datum < datum)
    : [];

  const alleTaken = useMemo(() => [...dagTaken, ...laterTaken], [dagTaken, laterTaken]);

  // Blokken: in "Alle taken" één blok per dag; anders per persoon/handeling.
  type Blok = { key: string; naam: string; rijen: MepTaak[]; doelDatum: string | null; rood?: boolean; persoon?: string | null };
  const groepen = useMemo<Blok[]>(() => {
    if (weergave === 'alles') {
      const teLaatRijen = alleTaken.filter((t) => t.taak_datum < datum && t.status !== 'afgerond');
      const dezeDag = alleTaken.filter(
        (t) => t.taak_datum === datum || (t.taak_datum < datum && t.status === 'afgerond'),
      );
      const blokken: Blok[] = [];
      if (teLaatRijen.length) blokken.push({ key: 'telaat', naam: 'Te laat', rijen: teLaatRijen, doelDatum: null, rood: true });
      blokken.push({
        key: datum,
        naam: datum === ymd(new Date()) ? 'Vandaag' : format(parseISO(datum), 'EEEE d MMM', { locale: nl }),
        rijen: dezeDag,
        doelDatum: datum,
      });
      const perDag = new Map<string, MepTaak[]>();
      for (const t of laterTaken) {
        if (!perDag.has(t.taak_datum)) perDag.set(t.taak_datum, []);
        perDag.get(t.taak_datum)!.push(t);
      }
      for (const [d, rijen] of [...perDag.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const naam = d === ymd(addDays(new Date(), 1)) ? 'Morgen' : format(parseISO(d), 'EEEE d MMM', { locale: nl });
        blokken.push({ key: d, naam, rijen, doelDatum: d });
      }
      return blokken;
    }
    if (weergave === 'persoon') {
      const blokken: Blok[] = [
        { key: 'iedereen', naam: 'Iedereen', rijen: alleTaken.filter((t) => !t.toegewezen_aan || !medewerkers.some((m) => m.id === t.toegewezen_aan)), doelDatum: null, persoon: null },
        ...[...medewerkers]
          .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
          .map((m) => ({ key: m.id, naam: m.name, rijen: alleTaken.filter((t) => t.toegewezen_aan === m.id), doelDatum: null, persoon: m.id })),
      ];
      return blokken;
    }
    const map = new Map<string, MepTaak[]>();
    for (const t of alleTaken) {
      const sleutel =
        weergave === 'handeling'
          ? t.handeling || 'Geen handeling'
          : medewerkers.find((m) => m.id === t.toegewezen_aan)?.name ?? 'Niet toegewezen';
      if (!map.has(sleutel)) map.set(sleutel, []);
      map.get(sleutel)!.push(t);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'nl'))
      .map(([naam, rijen]) => ({ key: naam, naam, rijen, doelDatum: null }));
  }, [alleTaken, laterTaken, weergave, medewerkers, datum]);

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

  // Te laat opruimen: naar vandaag of laten vervallen (status geannuleerd, niets verwijderd).
  const opruimen = async (rijen: MepTaak[], actie: 'vandaag' | 'wissen') => {
    const oud = rijen.map((t) => ({ id: t.id, taak_datum: t.taak_datum, status: t.status }));
    const nu = ymd(new Date());
    try {
      await Promise.all(
        rijen.map((t) =>
          bijwerken.mutateAsync(actie === 'vandaag' ? { id: t.id, taak_datum: nu } : { id: t.id, status: 'geannuleerd' }),
        ),
      );
      toast.success(
        actie === 'vandaag' ? `${rijen.length} taken staan nu op vandaag` : `${rijen.length} taken vervallen`,
        { action: { label: 'Ongedaan maken', onClick: () => { oud.forEach((o) => bijwerken.mutate(o)); } } },
      );
    } catch (e: any) {
      toast.error('Opruimen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const blokVan = (id: string) => groepen.find((g) => g.rijen.some((r) => r.id === id));

  const sleepKlaar = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const taakId = String(active.id);
    const overId = String(over.id);
    const bron = blokVan(taakId);
    const doel = overId.startsWith('blok-')
      ? groepen.find((g) => `blok-${g.key}` === overId)
      : blokVan(overId);
    if (!bron || !doel) return;
    const doelOpen = doel.rijen.filter((r) => r.status !== 'afgerond');

    if (bron.key === doel.key) {
      const van = doelOpen.findIndex((r) => r.id === taakId);
      const naar = doelOpen.findIndex((r) => r.id === overId);
      if (van < 0 || naar < 0) return;
      try {
        await herordenen.mutateAsync(arrayMove(doelOpen, van, naar).map((r) => r.id));
      } catch (e: any) {
        toast.error('Volgorde niet opgeslagen: ' + (e?.message ?? 'onbekende fout'));
      }
      return;
    }

    const taak = alleTaken.find((t) => t.id === taakId);
    if (!taak) return;
    if (weergave === 'persoon') {
      const oudPersoon = taak.toegewezen_aan;
      try {
        await bijwerken.mutateAsync({ id: taakId, toegewezen_aan: doel.persoon ?? null });
        toast.success(`${taak.titel} staat nu bij ${doel.naam}`, {
          action: { label: 'Ongedaan maken', onClick: () => { bijwerken.mutate({ id: taakId, toegewezen_aan: oudPersoon }); } },
        });
      } catch (e: any) {
        toast.error('Verplaatsen mislukt: ' + (e?.message ?? 'onbekende fout'));
      }
      return;
    }
    if (!doel.doelDatum) return; // naar "Te laat" kan niet
    const oud = { taak_datum: taak.taak_datum, volgorde: taak.volgorde };
    const plek = doelOpen.findIndex((r) => r.id === overId);
    const ids = doelOpen.map((r) => r.id);
    ids.splice(plek < 0 ? ids.length : plek, 0, taakId);
    try {
      await bijwerken.mutateAsync({ id: taakId, taak_datum: doel.doelDatum });
      await herordenen.mutateAsync(ids);
      toast.success(`${taak.titel} staat nu op ${doel.naam.toLowerCase()}`, {
        action: {
          label: 'Ongedaan maken',
          onClick: () => {
            bijwerken.mutate({ id: taakId, ...oud });
          },
        },
      });
    } catch (e: any) {
      toast.error('Verplaatsen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const toewijzen = async (t: MepTaak, persoonId: string | null) => {
    const oud = t.toegewezen_aan;
    if (oud === persoonId) return;
    const naam = persoonId ? medewerkers.find((m) => m.id === persoonId)?.name ?? '' : 'niemand';
    try {
      await bijwerken.mutateAsync({ id: t.id, toegewezen_aan: persoonId });
      toast.success(`${t.titel} → ${naam}`, {
        action: { label: 'Ongedaan maken', onClick: () => { bijwerken.mutate({ id: t.id, toegewezen_aan: oud }); } },
      });
    } catch (e: any) {
      toast.error('Toewijzen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };
  const nietToegewezen = alleTaken.filter(
    (t) => t.status !== 'afgerond' && (!t.toegewezen_aan || !medewerkers.some((m) => m.id === t.toegewezen_aan)),
  ).length;

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
              {vestiging} · {klaar.length}/{dagTaken.length} klaar
              {laterTaken.length > 0 && ` · ${laterTaken.length} voor later`}
              {teLaat.length > 0 && (
                <span className="text-destructive font-medium">
                  {' '}· {teLaat.length} te laat
                </span>
              )}
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
              className={vestiging === 'Midsland' ? 'hidden' : 'h-11 w-11'}
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

        {dagTaken.length > 0 && <Progress value={voortgang} className="h-1 -mt-2" />}

        {/* Taak toevoegen — inline */}
        <MepTaakToevoegen
          vestiging={vestiging}
          datum={datum}
          medewerkers={medewerkers}
          onToevoegen={(input) => toevoegen.mutateAsync(input)}
          onBijwerken={(taakId, patch) => bijwerken.mutateAsync({ id: taakId, ...patch })}
          rechts={
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
          }
        />


        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
        ) : taken.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Nog geen MEP voor deze dag"
            description="Gebruik het zoekveld hierboven om halffabricaten of vrije taken toe te voegen."
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={sleepKlaar}
          >
            <div className="space-y-4">
              {groepen.map((g) => {
                const openRijen = g.rijen.filter((r) => r.status !== 'afgerond');
                const klaarRijen = g.rijen.filter((r) => r.status === 'afgerond');
                const sleepbaar = weergave !== 'handeling';
                const rij = (t: MepTaak) => (
                  <TaakRij
                    key={t.id}
                    t={t}
                    datum={datum}
                    weergave={weergave}
                    medewerkers={medewerkers}
                    sleepbaar={sleepbaar && t.status !== 'afgerond'}
                    onBewerk={setBewerkTaak}
                    onAfrond={setAfrondTaak}
                    onHeropen={heropen}
                     onVerwijder={verwijder}
                    onToewijzen={toewijzen}
                    onNaarVandaag={(t) => opruimen([t], 'vandaag')}
                  />
                );
                return (
                  <DagBlok
                    key={g.key}
                    id={`blok-${g.key}`}
                    naam={g.naam}
                    rood={g.rood}
                    stand={`${klaarRijen.length}/${g.rijen.length}`}
                    dropbaar={weergave === 'persoon' || (sleepbaar && !!g.doelDatum)}
                    hint={
                      g.key === 'telaat'
                        ? 'Deze taken zijn van een eerdere dag. Tik op “Vandaag” bij een taak om hem op de lijst van vandaag te zetten.'
                        : undefined
                    }
                    acties={
                      g.key === 'telaat' && openRijen.length > 0 ? (
                        <>
                          <Button size="sm" className="h-11" onClick={() => opruimen(openRijen, 'vandaag')}>
                            <ArrowRight className="w-4 h-4" />
                            Alles naar vandaag
                          </Button>
                          <Button size="sm" variant="ghost" className="h-11 text-muted-foreground" onClick={() => opruimen(openRijen, 'wissen')}>
                            Wissen
                          </Button>
                        </>
                      ) : undefined
                    }
                  >
                    <SortableContext
                      items={openRijen.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="divide-y divide-border/60">{openRijen.map(rij)}</ul>
                    </SortableContext>
                    {openRijen.length === 0 && klaarRijen.length === 0 && (
                      <p className="px-5 py-4 text-sm text-muted-foreground">Sleep hier een taak naartoe</p>
                    )}
                    {klaarRijen.length > 0 && (
                      <>
                        <div className="px-4 sm:px-5 pt-3 pb-1 flex items-center gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Afgerond
                          </span>
                          <span className="h-px flex-1 bg-border/60" />
                        </div>
                        <ul className="divide-y divide-border/60">{klaarRijen.map(rij)}</ul>
                      </>
                    )}
                  </DagBlok>
                );
              })}
            </div>
            {nietToegewezen > 0 && (
              <p className="mt-3 text-right text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{nietToegewezen}</span> niet toegewezen
              </p>
            )}
          </DndContext>
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
        printen={vestiging !== 'Midsland'}
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

function DagBlok({
  id,
  naam,
  rood,
  stand,
  dropbaar,
  acties,
  hint,
  children,
}: {
  acties?: React.ReactNode;
  hint?: string;
  id: string;
  naam: string;
  rood?: boolean;
  stand: string;
  dropbaar: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !dropbaar });
  return (
    <Card
      ref={setNodeRef}
      className={cn('overflow-hidden bg-card shadow-sm', isOver && 'ring-2 ring-primary/40')}
    >
      <div className="px-4 sm:px-5 py-3 border-b border-border/60 flex items-center justify-between bg-muted/30">
        <h2
          className={cn(
            'text-[15px] font-semibold capitalize',
            rood ? 'text-destructive' : 'text-foreground',
          )}
        >
          {naam}
        </h2>
        <div className="flex items-center gap-2">
          {acties}
          <span className="text-xs font-medium text-muted-foreground tabular-nums rounded-full bg-muted px-2.5 py-0.5">
            {stand}
          </span>
        </div>
      </div>
      {hint && (
        <div className="px-4 sm:px-5 py-2.5 text-[13px] leading-snug text-muted-foreground bg-muted/20 border-b border-border/60 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          {hint}
        </div>
      )}
      {children}
    </Card>
  );
}

interface TaakRijProps {
  t: MepTaak;
  datum: string;
  weergave: 'alles' | 'persoon' | 'handeling';
  medewerkers: { id: string; name: string }[];
  sleepbaar: boolean;
  onBewerk: (t: MepTaak) => void;
  onAfrond: (t: MepTaak) => void;
  onHeropen: (t: MepTaak) => void;
  onVerwijder: (t: MepTaak) => void;
  onToewijzen: (t: MepTaak, persoonId: string | null) => void;
  onNaarVandaag: (t: MepTaak) => void;
}

function TaakRij({
  t,
  datum,
  weergave,
  medewerkers,
  sleepbaar,
  onBewerk,
  onAfrond,
  onHeropen,
  onVerwijder,
  onToewijzen,
  onNaarVandaag,
}: TaakRijProps) {
  const isKlaar = t.status === 'afgerond';
  // Taak staat gepland op een latere dag: zichtbaar, maar duidelijk anders.
  const isLater = t.taak_datum > datum;
  const laterLabel = isLater
    ? format(parseISO(t.taak_datum), 'EEEE d MMM', { locale: nl })
    : '';
  // Taak is van een eerdere dag meegekomen en nog niet af: overtijd = meteen prio.
  // Alleen op "vandaag" relevant (bij terugbladeren was het toen gewoon een dagtaak).
  const isOvertijd =
    !isKlaar && !isLater && t.taak_datum < datum && datum === ymd(new Date());
  const dagenTeLaat = isOvertijd
    ? differenceInCalendarDays(parseISO(datum), parseISO(t.taak_datum))
    : 0;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: t.id,
    disabled: !sleepbaar,
  });

  return (
    <li
      ref={sleepbaar ? setNodeRef : undefined}
      style={
        sleepbaar
          ? { transform: CSS.Transform.toString(transform), transition }
          : undefined
      }
      className={cn(
        'flex items-stretch gap-3 px-4 sm:px-5 py-3 min-h-[64px]',
        'bg-card',
        isOvertijd && 'bg-destructive/5',
        isKlaar && 'opacity-60',
        isDragging && 'relative z-10 shadow-md rounded-polar-md',
      )}
    >
      {sleepbaar ? (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Verplaats ${t.titel}`}
          className="-ml-2 w-8 shrink-0 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground touch-none cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      ) : null}
      {/* Statusbalk links: groen = klaar, rood = overtijd, oranje = belangrijk, grijs = normaal */}
      <span
        aria-hidden
        className={cn(
          'w-1.5 shrink-0 rounded-full my-1',
          isKlaar
            ? 'bg-success'
            : isOvertijd
              ? 'bg-destructive'
              : t.prioriteit === 1
                ? 'bg-warning'
                : 'bg-border',
        )}
      />
      <button
        type="button"
        onClick={() => onBewerk(t)}
        className="min-w-0 flex-1 text-left rounded-polar-md -mx-1 px-1 py-1 hover:bg-primary/5 active:bg-primary/10 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-[16px] font-semibold text-foreground',
              isKlaar && 'line-through text-muted-foreground',
            )}
          >
            {t.titel}
          </span>
          {isLater && weergave !== 'alles' && (
            <Badge
              variant="outline"
              className="font-normal bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1 capitalize"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {laterLabel}
            </Badge>
          )}
          {isOvertijd && (
            <Badge
              variant="outline"
              className="font-medium bg-destructive/10 text-destructive border-destructive/25 inline-flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {dagenTeLaat > 1 ? `${dagenTeLaat} dagen te laat` : 'Overtijd'}
            </Badge>
          )}
          {t.prioriteit === 1 && (
            <Badge variant="outline" className={cn('font-normal', PRIO_CLASS[1])}>
              {PRIO_LABEL[1]}
            </Badge>
          )}
          {dagenOpen(t.taak_datum, datum) >= 7 && (
            <Badge
              variant="outline"
              className="font-normal bg-destructive/10 text-destructive border-destructive/30 inline-flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              7+ dagen — nog nodig?
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {[t.handeling, t.doel_aantal != null ? `${Number(t.doel_aantal)} ${t.doel_eenheid ?? ''}`.trim() : null]
            .filter(Boolean)
            .join(' · ')}
          {t.deadline && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t.deadline.slice(0, 5)}
            </span>
          )}
          {t.notitie && <span className="truncate">{t.notitie}</span>}
        </div>
      </button>

      {isKlaar ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11"
          onClick={() => onHeropen(t)}
          aria-label="Heropenen"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      ) : (
        <>
          <PersoonKiezer
            persoon={medewerkers.find((m) => m.id === t.toegewezen_aan) ?? null}
            medewerkers={medewerkers}
            onKies={(id) => onToewijzen(t, id)}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 text-muted-foreground/60 hover:text-destructive"
            onClick={() => onVerwijder(t)}
            aria-label="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button className="h-11 min-w-[44px]" onClick={() => onAfrond(t)}>
            <Check className="w-5 h-5" />
          </Button>
        </>
      )}
    </li>
  );
}

function Initiaal({ naam, actief }: { naam: string; actief?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold uppercase',
        actief ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
      )}
    >
      {naam.trim().charAt(0) || '?'}
    </span>
  );
}

function PersoonKiezer({
  persoon,
  medewerkers,
  onKies,
}: {
  persoon: { id: string; name: string } | null;
  medewerkers: { id: string; name: string }[];
  onKies: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const kies = (id: string | null) => {
    setOpen(false);
    onKies(id);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={persoon ? `Toegewezen aan ${persoon.name}, wijzigen` : 'Toewijzen'}
          className={cn(
            'h-11 shrink-0 inline-flex items-center gap-2 rounded-full border pl-1.5 pr-3 text-[14px] font-medium transition-colors',
            persoon
              ? 'border-primary/25 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:bg-muted',
          )}
        >
          {persoon ? (
            <Initiaal naam={persoon.name} actief />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="w-4 h-4" />
            </span>
          )}
          <span className="hidden sm:inline max-w-[90px] truncate">
            {persoon ? persoon.name : 'Toewijzen'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <div className="max-h-72 overflow-y-auto">
          {persoon && (
            <button
              type="button"
              onClick={() => kies(null)}
              className="flex w-full items-center gap-3 rounded-polar-md px-2 min-h-[44px] text-[15px] text-muted-foreground hover:bg-primary/5 active:bg-primary/10"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted-foreground/50">
                <User className="w-4 h-4" />
              </span>
              Niemand
            </button>
          )}
          {medewerkers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => kies(m.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-polar-md px-2 min-h-[44px] text-[15px] hover:bg-primary/5 active:bg-primary/10',
                persoon?.id === m.id && 'bg-primary/10 font-medium',
              )}
            >
              <Initiaal naam={m.name} actief={persoon?.id === m.id} />
              <span className="truncate">{m.name}</span>
            </button>
          ))}
          {medewerkers.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">Nog geen keukenmedewerkers.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
