import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, GripVertical, Plus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MepRegel } from '@/hooks/useMepPlanning';

const NIET = 'niet-toegewezen';

interface Props {
  regels: MepRegel[];
  medewerkers: { id: string; name: string }[];
  onAfvinken: (regel: MepRegel, klaar: boolean) => void;
  onVoortgang: (regel: MepRegel, richting: 1 | -1) => void;
  onToewijzen: (id: string, employeeId: string | null) => void;
  onHerordenen: (ids: string[]) => void;
}

function PersoonRij({ regel, onAfvinken, onVoortgang }: { regel: MepRegel; onAfvinken: (k: boolean) => void; onVoortgang: (r: 1 | -1) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: regel.id });
  const klaar = !!regel.completed_at;
  const totaal = regel.quantity ?? 1;

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('p-2.5 flex items-center gap-2 bg-card shadow-sm', klaar && 'opacity-60', isDragging && 'ring-2 ring-primary/40')}
    >
      <button {...attributes} {...listeners} className="touch-none text-muted-foreground p-2 -ml-2" aria-label="Verslepen">
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => onAfvinken(!klaar)}
        aria-label={klaar ? 'Terugzetten' : 'Afvinken'}
        className={cn(
          'shrink-0 h-11 w-11 rounded-polar border-2 flex items-center justify-center transition-default',
          klaar ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
        )}
      >
        {klaar && <Check className="h-5 w-5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-sm font-semibold text-foreground', klaar && 'line-through')}>{regel.titel}</span>
          {regel.handeling && <Badge variant="outline" className="text-[10px]">{regel.handeling}</Badge>}
        </div>
        {regel.notes && <p className="text-[11px] text-muted-foreground truncate">{regel.notes}</p>}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onVoortgang(-1)}
          className="h-9 w-8 rounded-polar border border-border text-sm text-muted-foreground"
          aria-label="Voortgang omlaag"
        >
          –
        </button>
        <button
          onClick={() => onVoortgang(1)}
          className="h-9 min-w-[54px] rounded-polar border border-border px-2 text-sm font-medium tabular-nums"
          aria-label="Voortgang omhoog"
        >
          {regel.aantal_klaar} / {totaal}
        </button>
      </div>
    </Card>
  );
}

function Kolom({
  id,
  titel,
  regels,
  onAfvinken,
  onVoortgang,
}: {
  id: string;
  titel: string;
  regels: MepRegel[];
  onAfvinken: (regel: MepRegel, klaar: boolean) => void;
  onVoortgang: (regel: MepRegel, richting: 1 | -1) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `kolom-${id}` });
  const klaar = regels.filter((r) => r.completed_at).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-polar-lg border border-border/60 bg-muted/30 p-3 space-y-2 min-h-[140px]',
        isOver && 'ring-2 ring-primary/40',
      )}
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{titel}</p>
          <span className="text-xs text-muted-foreground tabular-nums">
            {klaar} van {regels.length}
          </span>
        </div>
        <Progress value={regels.length ? (klaar / regels.length) * 100 : 0} className="h-1.5" />
      </div>

      <SortableContext items={regels.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {regels.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">Sleep hier een regel naartoe</p>
          ) : (
            regels.map((r) => (
              <PersoonRij
                key={r.id}
                regel={r}
                onAfvinken={(k) => onAfvinken(r, k)}
                onVoortgang={(richting) => onVoortgang(r, richting)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function MepPerPersoon({ regels, medewerkers, onAfvinken, onVoortgang, onToewijzen, onHerordenen }: Props) {
  const [extra, setExtra] = useState<string[]>([]);
  const [kiezen, setKiezen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const kolommen = useMemo(() => {
    const metRegels = [...new Set(regels.map((r) => r.employee_id).filter(Boolean) as string[])];
    const ids = [...new Set([...metRegels, ...extra])];
    const lijst = ids.map((id) => ({
      id,
      titel: medewerkers.find((m) => m.id === id)?.name ?? 'Onbekend',
      regels: regels
        .filter((r) => r.employee_id === id)
        .sort((a, b) => a.sort_order_persoon - b.sort_order_persoon),
    }));
    lijst.sort((a, b) => a.titel.localeCompare(b.titel));
    return [
      ...lijst,
      {
        id: NIET,
        titel: 'Niet toegewezen',
        regels: regels
          .filter((r) => !r.employee_id)
          .sort((a, b) => a.sort_order_persoon - b.sort_order_persoon),
      },
    ];
  }, [regels, medewerkers, extra]);

  const beschikbaar = medewerkers.filter((m) => !kolommen.some((k) => k.id === m.id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const regel = regels.find((r) => r.id === active.id);
    if (!regel) return;

    const overId = String(over.id);
    const doelKolom = overId.startsWith('kolom-')
      ? overId.slice(6)
      : (regels.find((r) => r.id === over.id)?.employee_id ?? NIET);
    const huidig = regel.employee_id ?? NIET;

    if (doelKolom !== huidig) {
      onToewijzen(regel.id, doelKolom === NIET ? null : doelKolom);
      return;
    }

    const kolom = kolommen.find((k) => k.id === huidig);
    if (!kolom || active.id === over.id) return;
    const oud = kolom.regels.findIndex((r) => r.id === active.id);
    const nieuw = kolom.regels.findIndex((r) => r.id === over.id);
    if (oud < 0 || nieuw < 0) return;
    onHerordenen(arrayMove(kolom.regels, oud, nieuw).map((r) => r.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        {kiezen && beschikbaar.length > 0 ? (
          <Select
            onValueChange={(v) => {
              setExtra((e) => [...e, v]);
              setKiezen(false);
            }}
          >
            <SelectTrigger className="w-[220px] h-10">
              <SelectValue placeholder="Kies een collega" />
            </SelectTrigger>
            <SelectContent>
              {beschikbaar.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Button variant="outline" className="h-10" onClick={() => setKiezen(true)} disabled={beschikbaar.length === 0}>
            <UserPlus className="h-4 w-4 mr-2" /> Persoon
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {kolommen.map((k) => (
            <Kolom
              key={k.id}
              id={k.id}
              titel={k.titel}
              regels={k.regels}
              onAfvinken={onAfvinken}
              onVoortgang={onVoortgang}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
