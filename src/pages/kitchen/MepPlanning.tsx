import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { MepToevoegenDialog } from '@/components/kitchen/MepToevoegenDialog';
import { MepPerPersoon } from '@/components/kitchen/MepPerPersoon';
import { MepVerbindingBanner } from '@/components/kitchen/MepVerbindingBanner';
import {
  Plus,
  Clock,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Check,
  GripVertical,
  Monitor,
  List,
  Users,
  Settings,
  CalendarPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserLocation } from '@/contexts/UserLocationContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useMepKalender,
  useMepPlanning,
  useKeukenMedewerkers,
  useMepSuggesties,
  useMepTemplates,
  ymd,
  MepRegel,
} from '@/hooks/useMepPlanning';

const PRIO_LABEL: Record<number, string> = { 1: 'Moet', 2: 'Normaal', 3: 'Later' };
const PRIO_CLASS: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive border-destructive/20',
  2: 'bg-muted text-muted-foreground',
  3: 'bg-muted/60 text-muted-foreground',
};

type Weergave = 'alles' | 'persoon' | 'werk';

function MepRij({
  regel,
  naam,
  werkview,
  onVoortgang,
  onAfvinken,
  onVerplaats,
  onVerwijder,
  onTemplate,
  verplaatsLabel,
  verplaatsTerug,
}: {
  regel: MepRegel;
  naam?: string;
  werkview: boolean;
  onVoortgang: (richting: 1 | -1) => void;
  onAfvinken: (klaar: boolean) => void;
  onVerplaats: () => void;
  onVerwijder: () => void;
  onTemplate: () => void;
  verplaatsLabel: string;
  verplaatsTerug: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: regel.id });
  const klaar = !!regel.completed_at;
  const totaal = regel.quantity ?? 1;

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'p-3 flex items-center gap-3 bg-card shadow-sm',
        werkview && 'p-4',
        klaar && 'opacity-60',
        isDragging && 'ring-2 ring-primary/40',
      )}
    >
      {!werkview && (
        <button {...attributes} {...listeners} className="touch-none text-muted-foreground p-2 -ml-2" aria-label="Verslepen">
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={() => onAfvinken(!klaar)}
        aria-label={klaar ? 'Terugzetten' : 'Afvinken'}
        className={cn(
          'shrink-0 rounded-polar border-2 flex items-center justify-center transition-default',
          werkview ? 'h-14 w-14' : 'h-11 w-11',
          klaar ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
        )}
      >
        {klaar && <Check className={werkview ? 'h-7 w-7' : 'h-5 w-5'} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-semibold text-foreground', werkview && 'text-lg', klaar && 'line-through')}>
            {regel.titel}
          </span>
          {regel.handeling && <Badge variant="outline" className="text-[11px]">{regel.handeling}</Badge>}
          <Badge variant="outline" className={cn('text-[11px] border', PRIO_CLASS[regel.prioriteit])}>
            {PRIO_LABEL[regel.prioriteit]}
          </Badge>
          {regel.bron === 'doorgeschoven' && (
            <Badge variant="outline" className="text-[11px] bg-warning/10 text-warning border-warning/20">
              {regel.doorschuif_teller >= 3 ? `${regel.doorschuif_teller}e dag` : 'van gisteren'}
            </Badge>
          )}
          {regel.bron === 'bestelling' && <Badge variant="outline" className="text-[11px]">Bestelling</Badge>}
        </div>
        {(naam || regel.notes) && (
          <p className="text-xs text-muted-foreground truncate">{[naam, regel.notes].filter(Boolean).join(' · ')}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onVoortgang(-1)}
          className={cn('rounded-polar border border-border text-muted-foreground', werkview ? 'h-14 w-11 text-lg' : 'h-11 w-9')}
          aria-label="Voortgang omlaag"
        >
          –
        </button>
        <button
          onClick={() => onVoortgang(1)}
          className={cn(
            'rounded-polar border border-border px-3 text-sm font-medium tabular-nums',
            werkview ? 'h-14 min-w-[92px]' : 'h-11 min-w-[74px]',
          )}
          aria-label="Voortgang omhoog"
        >
          {regel.aantal_klaar} / {totaal}
          {regel.eenheid && <span className="block text-[10px] text-muted-foreground">{regel.eenheid}</span>}
        </button>
      </div>

      {!werkview && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onTemplate} title="Opslaan als template" className="h-10 w-10">
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onVerplaats} title={verplaatsLabel} className="h-10 w-10">
            {verplaatsTerug ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onVerwijder} title="Verwijderen" className="h-10 w-10">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function MepPlanning() {
  const { userLocation } = useUserLocation();
  const navigate = useNavigate();
  const kalender = useMepKalender(userLocation);
  const [tab, setTab] = useState<'vandaag' | 'volgende'>('vandaag');
  const [weergave, setWeergave] = useState<Weergave>('alles');
  const [dialogOpen, setDialogOpen] = useState(false);

  const vandaagKey = ymd(kalender.vandaag);
  const volgendeKey = ymd(kalender.volgendeDag);
  const actieveKey = tab === 'vandaag' ? vandaagKey : volgendeKey;
  const andereKey = tab === 'vandaag' ? volgendeKey : vandaagKey;
  const actieveDatum = tab === 'vandaag' ? kalender.vandaag : kalender.volgendeDag;

  const planning = useMepPlanning(userLocation, actieveKey, tab === 'vandaag');
  const { data: medewerkers = [] } = useKeukenMedewerkers(userLocation);
  const templates = useMepTemplates(userLocation);
  const naamVan = useMemo(
    () => Object.fromEntries(medewerkers.map((m) => [m.id, m.name])),
    [medewerkers],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const regels = planning.regels;
  const { chips } = useMepSuggesties(userLocation, actieveKey, regels);
  const klaarAantal = regels.filter((r) => r.completed_at).length;
  const dagDicht = !kalender.isOpen(actieveDatum);
  const sluitReden = kalender.sluitReden(actieveDatum);
  const werkview = weergave === 'werk';

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oud = regels.findIndex((r) => r.id === active.id);
    const nieuw = regels.findIndex((r) => r.id === over.id);
    const volgorde = arrayMove(regels, oud, nieuw).map((r) => r.id);
    planning.herordenen.mutate(volgorde);
  };

  const verwijderMetUndo = (r: MepRegel) =>
    planning.verwijderen.mutate(r.id, {
      onSuccess: () =>
        toast.success(`"${r.titel}" verwijderd`, {
          action: { label: 'Ongedaan maken', onClick: () => planning.herstellen.mutate(r.id) },
          duration: 8000,
        }),
      onError: () => toast.error('Verwijderen mislukt'),
    });

  const opslaanAlsTemplate = (r: MepRegel) => {
    const weekdag = actieveDatum.getDay();
    templates.opslaan.mutate(
      {
        titel: r.titel,
        weekdag,
        handeling: r.handeling,
        recipe_id: r.recipe_id,
        aantal: r.quantity ?? 1,
        eenheid: r.eenheid,
        prioriteit: r.prioriteit,
        notitie: r.notes,
      },
      {
        onSuccess: () =>
          toast.success(`Staat nu elke ${format(actieveDatum, 'EEEE', { locale: nl })} op de lijst`),
        onError: () => toast.error('Opslaan als template mislukt'),
      },
    );
  };

  const dagOpties = [
    { waarde: vandaagKey, label: kalender.dagLabel(kalender.vandaag) },
    { waarde: volgendeKey, label: kalender.dagLabel(kalender.volgendeDag) },
  ];

  return (
    <KitchenLayout title="Mise-en-place" subtitle={`${format(kalender.vandaag, 'EEEE d MMMM', { locale: nl })}`}>
      <div className="space-y-5">
        <MepVerbindingBanner
          realtimeOk={planning.verbinding.realtimeOk}
          wachtrij={planning.verbinding.wachtrij}
          onOpnieuw={planning.verbinding.opnieuwProberen}
        />

        <div className="flex items-center gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'vandaag' | 'volgende')} className="flex-1">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="vandaag">{kalender.dagLabel(kalender.vandaag)}</TabsTrigger>
              <TabsTrigger value="volgende">{kalender.dagLabel(kalender.volgendeDag)}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant={weergave === 'persoon' ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10"
            onClick={() => setWeergave((w) => (w === 'persoon' ? 'alles' : 'persoon'))}
            title="Per persoon"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant={werkview ? 'default' : 'outline'}
            size="icon"
            className="h-10 w-10"
            onClick={() => setWeergave((w) => (w === 'werk' ? 'alles' : 'werk'))}
            title="Werkview"
          >
            {werkview ? <List className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/kitchen/mep/beheer')} title="Beheren">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <Card className="p-4 bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {klaarAantal} van {regels.length} klaar
              </p>
              {dagDicht && (
                <p className="text-xs text-muted-foreground">
                  Gesloten dag{sluitReden ? ` · ${sluitReden}` : ''} — wordt niet automatisch gevuld
                </p>
              )}
            </div>
            <Button onClick={() => setDialogOpen(true)} className="h-11">
              <Plus className="h-4 w-4 mr-2" /> Toevoegen
            </Button>
          </div>
          <Progress value={regels.length ? (klaarAantal / regels.length) * 100 : 0} className="h-2" />
        </Card>

        {!werkview && chips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Vaak op deze dag</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Button
                  key={`${c.titel}-${c.handeling ?? ''}`}
                  variant="outline"
                  className="h-10 rounded-full"
                  onClick={() =>
                    planning.toevoegen.mutate(
                      {
                        regel: {
                          titel: c.titel,
                          handeling: c.handeling,
                          quantity: c.quantity ?? 1,
                          eenheid: c.eenheid,
                          prioriteit: c.prioriteit,
                        },
                        dag: actieveKey,
                      },
                      { onSuccess: () => toast.success('Toegevoegd'), onError: () => toast.error('Toevoegen mislukt') },
                    )
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  {c.titel}
                  {c.handeling ? ` · ${c.handeling}` : ''}
                </Button>
              ))}
            </div>
          </div>
        )}

        {planning.loading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : regels.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nog niets gepland"
            description="Voeg halfproducten of vrije taken toe voor deze dag"
            action={{ label: 'Toevoegen', onClick: () => setDialogOpen(true) }}
          />
        ) : weergave === 'persoon' ? (
          <MepPerPersoon
            regels={regels}
            medewerkers={medewerkers}
            onAfvinken={(regel, klaar) => planning.afvinken.mutate({ regel, klaar })}
            onVoortgang={(regel, richting) => planning.stapVoortgang.mutate({ regel, richting })}
            onToewijzen={(id, employeeId) =>
              planning.toewijzen.mutate({ id, employeeId }, { onError: () => toast.error('Toewijzen mislukt') })
            }
            onHerordenen={(ids) => planning.herordenenPersoon.mutate(ids)}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={regels.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {regels.map((r) => (
                  <MepRij
                    key={r.id}
                    regel={r}
                    naam={r.employee_id ? naamVan[r.employee_id] : undefined}
                    werkview={werkview}
                    onVoortgang={(richting) => planning.stapVoortgang.mutate({ regel: r, richting })}
                    onAfvinken={(klaar) => planning.afvinken.mutate({ regel: r, klaar })}
                    onTemplate={() => opslaanAlsTemplate(r)}
                    onVerplaats={() => {
                      planning.verplaatsNaarDag.mutate(
                        { id: r.id, dag: andereKey },
                        {
                          onSuccess: () =>
                            toast.success(
                              `Verplaatst naar ${tab === 'vandaag' ? kalender.dagLabel(kalender.volgendeDag) : 'vandaag'}`,
                            ),
                          onError: () => toast.error('Staat daar al op de lijst'),
                        },
                      );
                    }}
                    onVerwijder={() => verwijderMetUndo(r)}
                    verplaatsLabel={`Naar ${tab === 'vandaag' ? kalender.dagLabel(kalender.volgendeDag) : kalender.dagLabel(kalender.vandaag)}`}
                    verplaatsTerug={tab !== 'vandaag'}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <MepToevoegenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={userLocation}
        dagOpties={dagOpties}
        standaardDag={ymd(kalender.standaardDag)}
        onOpslaan={(regel, dag) =>
          planning.toevoegen.mutate(
            { regel, dag },
            {
              onSuccess: (r) => toast.success(r === 'opgehoogd' ? 'Bestaande regel opgehoogd' : 'Toegevoegd'),
              onError: () => toast.error('Toevoegen mislukt'),
            },
          )
        }
      />
    </KitchenLayout>
  );
}
