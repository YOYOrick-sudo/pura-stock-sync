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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BakmaatKiezer } from '@/components/voorraad/BakmaatKiezer';
import { BakmaatUitleg } from '@/components/voorraad/BakmaatUitleg';
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

/**
 * Product met sleepgreep. Staat er reserve achter de hand, dan tel je die;
 * anders beoordeel je het werkbakje en stel je hier de vulnorm in.
 */
function SleepbaarProduct({
  item,
  onReserve,
  onVulnorm,
  onFormaat,
}: {
  item: KoelcelCheckItem;
  onReserve?: (aantal: number) => void;
  onVulnorm?: (vulnorm: 'vol' | 'half') => void;
  onFormaat?: (formaat: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  const reserve = Math.max(Number(item.reserve_doel ?? 0), 0);
  const vulnorm = (item.vulnorm ?? 'vol') === 'half' ? 'half' : 'vol';

  return (
    <div
      className={`rounded-[12px] border border-border bg-card px-2 py-1.5 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-center gap-1.5" style={{ minHeight: 40 }}>
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
            <span className="mr-1 text-[11px] text-muted-foreground">reserve</span>
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

      {onFormaat && (
        <div className="mt-1">
          <BakmaatKiezer formaat={item.formaat ?? item.bak_maat} onWijzig={onFormaat} />
        </div>
      )}

      {onVulnorm && reserve === 0 && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">bakje hoort</span>
          {(['vol', 'half'] as const).map((keuze) => (
            <button
              key={keuze}
              type="button"
              onClick={() => onVulnorm(keuze)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                vulnorm === keuze
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {keuze}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Tijdstip van de laatste sleep-actie: voorkomt dat loslaten een tik opent. */
let laatsteSleepEind = 0;

/** Compact ladepatroon-kaartje: alleen de naam, tik opent de instellingen. */
function LadeChip({ item, onOpen }: { item: KoelcelCheckItem; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      onClick={() => {
        if (Date.now() - laatsteSleepEind < 300) return;
        onOpen();
      }}
      title={item.naam}
      className={`flex w-full touch-none items-start gap-1 rounded-[12px] border border-border bg-card px-1.5 py-2 text-left transition-colors active:border-primary active:bg-primary/10 ${
        isDragging ? 'opacity-40' : ''
      }`}
      style={{ minHeight: 44 }}
    >
      <GripVertical size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
      <span className="line-clamp-2 text-[12px] font-medium leading-tight text-foreground">
        {item.naam}
      </span>
    </button>
  );
}

/** Instellingen van één product (reserve, bakmaat, vulnorm) in een dialoog. */
function ProductInstellingenDialog({
  item,
  open,
  onOpenChange,
  onReserve,
  onVulnorm,
  onFormaat,
}: {
  item: KoelcelCheckItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve: (aantal: number) => void;
  onVulnorm: (vulnorm: 'vol' | 'half') => void;
  onFormaat: (formaat: string | null) => void;
}) {
  if (!item) return null;
  const reserve = Math.max(Number(item.reserve_doel ?? 0), 0);
  const vulnorm = (item.vulnorm ?? 'vol') === 'half' ? 'half' : 'vol';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{item.naam}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">Reserve achter de hand</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Minder reserve"
                onClick={() => onReserve(reserve - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border text-muted-foreground"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-[15px] font-bold tabular-nums text-foreground">
                {reserve}
              </span>
              <button
                type="button"
                aria-label="Meer reserve"
                onClick={() => onReserve(reserve + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border text-muted-foreground"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] text-muted-foreground">Bakmaat</p>
            <div className="flex items-center gap-1.5">
              <BakmaatKiezer formaat={item.formaat ?? item.bak_maat} onWijzig={onFormaat} />
              <BakmaatUitleg variant="link" />
            </div>
          </div>
          {reserve === 0 && (
            <div>
              <p className="mb-1.5 text-[13px] text-muted-foreground">Bakje hoort</p>
              <div className="flex gap-2">
                {(['vol', 'half'] as const).map((keuze) => (
                  <button
                    key={keuze}
                    type="button"
                    onClick={() => onVulnorm(keuze)}
                    className={`flex-1 rounded-[12px] border px-3 py-2.5 text-[13px] font-semibold ${
                      vulnorm === keuze
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {keuze}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LadeVak({
  lade,
  items,
  onHernoem,
  onZetActief,
  onZetRol,
  onReserve,
  onVulnorm,
  onFormaat,
}: {
  lade: VoorraadLade;
  items: KoelcelCheckItem[];
  onHernoem: (naam: string) => void;
  onZetActief: (actief: boolean) => void;
  onZetRol: (rol: 'werk' | 'reserve') => void;
  onReserve: (itemId: string, aantal: number) => void;
  onVulnorm: (itemId: string, vulnorm: 'vol' | 'half') => void;
  onFormaat: (itemId: string, formaat: string | null) => void;
}) {
  const isReserve = lade.rol === 'reserve';
  const { setNodeRef, isOver } = useDroppable({ id: `lade:${lade.id}`, disabled: !lade.actief });
  const [bewerk, setBewerk] = useState(false);
  const [naam, setNaam] = useState(lade.naam);
  const [openItem, setOpenItem] = useState<KoelcelCheckItem | null>(null);

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

      <div className="flex-1">
        {items.length === 0 ? (
          <p className="pt-3 text-center text-[12px] text-muted-foreground">
            {lade.actief ? 'Sleep hier producten naartoe' : 'Niet in gebruik'}
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {items.map((i, index) => (
              <div key={i.id} className={index < 4 ? 'col-span-3' : 'col-span-2'}>
                <LadeChip item={i} onOpen={() => setOpenItem(i)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductInstellingenDialog
        item={openItem}
        open={openItem !== null}
        onOpenChange={(open) => {
          if (!open) setOpenItem(null);
        }}
        onReserve={(a) => openItem && onReserve(openItem.id, a)}
        onVulnorm={(v) => openItem && onVulnorm(openItem.id, v)}
        onFormaat={(f) => openItem && onFormaat(openItem.id, f)}
      />

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
  const { hernoem, zetActief, verplaatsItem, zetRol, zetReserveDoel, zetVulnorm, zetFormaat } =
    useLadeMutaties(vestiging);
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
    laatsteSleepEind = Date.now();
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
                    onVulnorm={(itemId, vulnorm) => zetVulnorm.mutate({ itemId, vulnorm })}
                    onFormaat={(itemId, formaat) => zetFormaat.mutate({ itemId, formaat })}
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
                  onVulnorm={(v) => zetVulnorm.mutate({ itemId: i.id, vulnorm: v })}
                  onFormaat={(f) => zetFormaat.mutate({ itemId: i.id, formaat: f })}
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
