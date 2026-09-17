import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Check, GripVertical, Minus, Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useKoelcelCheckItems, type KoelcelCheckItem } from '@/hooks/useKoelcelCheck';
import {
  positieLabel,
  useLadeMutaties,
  useVoorraadLades,
  type VoorraadLade,
} from '@/hooks/useVoorraadLades';

function ProductChip({ item, actief }: { item: KoelcelCheckItem; actief?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-[12px] border px-2.5 py-2 text-[13px] font-medium ${
        actief ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-foreground'
      }`}
      style={{ minHeight: 40 }}
    >
      <GripVertical size={14} className="shrink-0 text-muted-foreground" />
      <span className="truncate">{item.naam}</span>
    </span>
  );
}

/** Product met sleepgreep en het aantal reservebakjes dat erachter hoort te staan. */
function SleepbaarProduct({
  item,
  onReserve,
}: {
  item: KoelcelCheckItem;
  onReserve?: (aantal: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  const reserve = Math.max(Number(item.reserve_doel ?? 0), 0);

  return (
    <div
      className={`flex items-center gap-1.5 rounded-[12px] border border-border bg-card px-2 py-1.5 ${
        isDragging ? 'opacity-40' : ''
      }`}
      style={{ minHeight: 44 }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex min-w-0 flex-1 touch-none items-center gap-1.5"
      >
        <GripVertical size={14} className="shrink-0 text-muted-foreground" />
        <span className="truncate text-[13px] font-medium text-foreground">{item.naam}</span>
      </div>
      {onReserve && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Minder reserve"
            onClick={() => onReserve(reserve - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border text-muted-foreground"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-[13px] font-bold tabular-nums text-foreground">
            {reserve}
          </span>
          <button
            type="button"
            aria-label="Meer reserve"
            onClick={() => onReserve(reserve + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border text-muted-foreground"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function LadeVak({
  lade,
  items,
  onHernoem,
  onZetActief,
  onZetRol,
  onReserve,
}: {
  lade: VoorraadLade;
  items: KoelcelCheckItem[];
  onHernoem: (naam: string) => void;
  onZetActief: (actief: boolean) => void;
  onZetRol: (rol: 'werk' | 'reserve') => void;
  onReserve: (itemId: string, aantal: number) => void;
}) {
  const isReserve = lade.rol === 'reserve';
  const { setNodeRef, isOver } = useDroppable({ id: `lade:${lade.id}`, disabled: !lade.actief });
  const [bewerk, setBewerk] = useState(false);
  const [naam, setNaam] = useState(lade.naam);

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[150px] flex-col rounded-[18px] border p-3 transition-colors ${
        !lade.actief
          ? 'border-dashed border-border bg-muted/20 opacity-60'
          : isOver
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card'
      }`}
    >
      <div className="mb-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {bewerk ? (
            <div className="flex items-center gap-1">
              <Input
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className="h-9 rounded-[10px] text-[13px]"
                autoFocus
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-[10px]"
                onClick={() => {
                  const schoon = naam.trim();
                  if (schoon) onHernoem(schoon);
                  setBewerk(false);
                }}
              >
                <Check size={16} />
              </Button>
            </div>
          ) : (
            <>
              <p className="truncate text-[14px] font-bold text-foreground">{lade.naam}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {positieLabel(lade)}
                {isReserve ? ' · reservelade' : ''}
              </p>
            </>
          )}
        </div>
        {!bewerk && (
          <button
            type="button"
            aria-label="Naam wijzigen"
            onClick={() => {
              setNaam(lade.naam);
              setBewerk(true);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border text-muted-foreground"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        {items.length === 0 ? (
          <p className="pt-3 text-center text-[12px] text-muted-foreground">
            {lade.actief ? 'Sleep hier producten naartoe' : 'Niet in gebruik'}
          </p>
        ) : (
          items.map((i) => (
            <SleepbaarProduct key={i.id} item={i} onReserve={(a) => onReserve(i.id, a)} />
          ))
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onZetRol(isReserve ? 'werk' : 'reserve')}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            isReserve
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          {isReserve ? 'Reservelade' : 'Werklade'}
        </button>
        <button
          type="button"
          onClick={() => onZetActief(!lade.actief)}
          className="text-left text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          {lade.actief ? 'Lade niet in gebruik' : 'Lade weer in gebruik'}
        </button>
      </div>
    </div>
  );
}

/** Visuele indeling van de koelwerkbank: 3 kolommen x 3 lades, sleep producten erheen. */
export function LadeGrid({ vestiging }: { vestiging: string }) {
  const ladesQuery = useVoorraadLades(vestiging);
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const { hernoem, zetActief, verplaatsItem, zetRol, zetReserveDoel } = useLadeMutaties(vestiging);
  const [sleept, setSleept] = useState<KoelcelCheckItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const lades = ladesQuery.data ?? [];
  const werkbankItems = useMemo(
    () => (itemsQuery.data ?? []).filter((i) => i.plek === 'werkbank'),
    [itemsQuery.data],
  );

  const { setNodeRef: setRestRef, isOver: restOver } = useDroppable({ id: 'lade:geen' });

  const perLade = useMemo(() => {
    const map = new Map<string, KoelcelCheckItem[]>();
    for (const item of werkbankItems) {
      const sleutel = item.lade_id ?? 'geen';
      map.set(sleutel, [...(map.get(sleutel) ?? []), item]);
    }
    return map;
  }, [werkbankItems]);

  const onStart = (e: DragStartEvent) =>
    setSleept(werkbankItems.find((i) => i.id === e.active.id) ?? null);

  const onEnd = (e: DragEndEvent) => {
    setSleept(null);
    const over = e.over?.id;
    if (typeof over !== 'string' || !over.startsWith('lade:')) return;
    const doelId = over.slice(5);
    const itemId = String(e.active.id);
    const huidig = werkbankItems.find((i) => i.id === itemId);
    const nieuw = doelId === 'geen' ? null : doelId;
    if (!huidig || (huidig.lade_id ?? null) === nieuw) return;
    verplaatsItem.mutate({ itemId, ladeId: nieuw });
  };

  if (ladesQuery.isLoading || itemsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Bezig met laden…</p>;
  }

  const kolommen = [1, 2, 3];
  const nietIngedeeld = perLade.get('geen') ?? [];

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setSleept(null)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {kolommen.map((kolom) => (
            <div key={kolom} className="space-y-3">
              <p className="text-center text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                {['Links', 'Midden', 'Rechts'][kolom - 1]}
              </p>
              {lades
                .filter((l) => l.kolom === kolom)
                .sort((a, b) => a.rij - b.rij)
                .map((lade) => (
                  <LadeVak
                    key={lade.id}
                    lade={lade}
                    items={perLade.get(lade.id) ?? []}
                    onHernoem={(naam) => hernoem.mutate({ id: lade.id, naam })}
                    onZetActief={(actief) => zetActief.mutate({ id: lade.id, actief })}
                    onZetRol={(rol) => zetRol.mutate({ id: lade.id, rol })}
                    onReserve={(itemId, aantal) => zetReserveDoel.mutate({ itemId, aantal })}
                  />
                ))}
            </div>
          ))}
        </div>

        <div
          ref={setRestRef}
          className={`rounded-[18px] border p-3 transition-colors ${
            restOver ? 'border-primary bg-primary/10' : 'border-dashed border-border bg-muted/20'
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[14px] font-bold text-foreground">Nog niet ingedeeld</p>
            <Badge variant="secondary" className="text-[11px]">{nietIngedeeld.length}</Badge>
          </div>
          {nietIngedeeld.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">Alle producten liggen in een lade.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {nietIngedeeld.map((i) => (
                <SleepbaarProduct
                  key={i.id}
                  item={i}
                  onReserve={(a) => zetReserveDoel.mutate({ itemId: i.id, aantal: a })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {sleept ? (
          <div className="w-52">
            <ProductChip item={sleept} actief />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default LadeGrid;
