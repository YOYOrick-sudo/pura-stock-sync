import { useMemo, useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { MepToevoegenDialog } from '@/components/kitchen/MepToevoegenDialog';
import { Plus, Clock, ArrowRight, ArrowLeft, Trash2, Check, GripVertical, Monitor, List } from 'lucide-react';
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
  ymd,
  MepRegel,
} from '@/hooks/useMepPlanning';

const PRIO_LABEL: Record<number, string> = { 1: 'Moet', 2: 'Normaal', 3: 'Later' };
const PRIO_CLASS: Record<number, string> = {
  1: 'bg-destructive/10 text-destructive border-destructive/20',
  2: 'bg-muted text-muted-foreground',
  3: 'bg-muted/60 text-muted-foreground',
};

function MepRij({
  regel,
  naam,
  werkview,
  onVoortgang,
  onAfvinken,
  onVerplaats,
  onVerwijder,
  verplaatsLabel,
  verplaatsTerug,
}: {
  regel: MepRegel;
  naam?: string;
  werkview: boolean;
  onVoortgang: () => void;
  onAfvinken: (klaar: boolean) => void;
  onVerplaats: () => void;
  onVerwijder: () => void;
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

      <button
        onClick={onVoortgang}
        className={cn(
          'shrink-0 rounded-polar border border-border px-3 text-sm font-medium tabular-nums',
          werkview ? 'h-14 min-w-[92px]' : 'h-11 min-w-[80px]',
        )}
        aria-label="Deelvoortgang ophogen"
      >
        {regel.aantal_klaar} / {totaal}
        {regel.eenheid && <span className="block text-[10px] text-muted-foreground">{regel.eenheid}</span>}
      </button>

      {!werkview && (
        <div className="flex items-center gap-1">
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
  const kalender = useMepKalender(userLocation);
  const [tab, setTab] = useState<'vandaag' | 'volgende'>('vandaag');
  const [werkview, setWerkview] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const vandaagKey = ymd(kalender.vandaag);
  const volgendeKey = ymd(kalender.volgendeDag);
  const actieveKey = tab === 'vandaag' ? vandaagKey : volgendeKey;
  const andereKey = tab === 'vandaag' ? volgendeKey : vandaagKey;

  const planning = useMepPlanning(userLocation, actieveKey, tab === 'vandaag');
  const { data: medewerkers = [] } = useKeukenMedewerkers(userLocation);
  const naamVan = useMemo(
    () => Object.fromEntries(medewerkers.map((m) => [m.id, m.name])),
    [medewerkers],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const regels = planning.regels;
  const klaarAantal = regels.filter((r) => r.completed_at).length;
  const dagDicht = !kalender.isOpen(tab === 'vandaag' ? kalender.vandaag : kalender.volgendeDag);
  const sluitReden = kalender.sluitReden(tab === 'vandaag' ? kalender.vandaag : kalender.volgendeDag);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oud = regels.findIndex((r) => r.id === active.id);
    const nieuw = regels.findIndex((r) => r.id === over.id);
    const volgorde = arrayMove(regels, oud, nieuw).map((r) => r.id);
    planning.herordenen.mutate(volgorde);
  };

  const dagOpties = [
    { waarde: vandaagKey, label: kalender.dagLabel(kalender.vandaag) },
    { waarde: volgendeKey, label: kalender.dagLabel(kalender.volgendeDag) },
  ];

  return (
    <KitchenLayout title="Mise-en-place" subtitle={`${format(kalender.vandaag, 'EEEE d MMMM', { locale: nl })}`}>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'vandaag' | 'volgende')} className="flex-1">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="vandaag">{kalender.dagLabel(kalender.vandaag)}</TabsTrigger>
              <TabsTrigger value="volgende">{kalender.dagLabel(kalender.volgendeDag)}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setWerkview((v) => !v)} title="Werkview">
            {werkview ? <List className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
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

        {planning.loading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : regels.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nog niets gepland"
            description="Voeg halfproducten of vrije taken toe voor deze dag"
            action={{ label: 'Toevoegen', onClick: () => setDialogOpen(true) }}
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
                    onVoortgang={() => planning.stapVoortgang.mutate(r)}
                    onAfvinken={(klaar) => planning.afvinken.mutate({ regel: r, klaar })}
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
                    onVerwijder={() =>
                      planning.verwijderen.mutate(r.id, { onSuccess: () => toast.success('Verwijderd') })
                    }
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
