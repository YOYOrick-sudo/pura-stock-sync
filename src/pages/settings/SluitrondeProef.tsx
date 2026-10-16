import { useMemo, useState } from 'react';
import { Check, Info, Minus, Plus } from 'lucide-react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useVoorraadLades, positieLabel } from '@/hooks/useVoorraadLades';
import {
  useKoelcelCheckItems,
  vervolgactieVoorRegel,
  eindBestemming,
  ketenKortLabel,
  vulnormLabel,
  HERKOMST_LABEL,
  BESTEMMING_LABEL,
  type KoelcelCheckItem,
} from '@/hooks/useKoelcelCheck';
import { cn } from '@/lib/utils';

interface Groep { id: string; titel: string; items: KoelcelCheckItem[] }

/** Looproute: lades in volgorde, dan flessen/werkblad, koelcel, vriescel. */
function useGroepen(vestiging: string) {
  const { data: items = [] } = useKoelcelCheckItems(vestiging);
  const { data: lades = [] } = useVoorraadLades(vestiging);
  const groepen = useMemo<Groep[]>(() => {
    const out: Groep[] = [];
    for (const l of lades.filter((l) => l.actief)) {
      const g = items.filter((i) => i.lade_id === l.id);
      if (g.length) out.push({ id: l.id, titel: `${l.naam || 'Lade'} · ${positieLabel(l)}`, items: g });
    }
    const los = items.filter((i) => i.plek === 'werkbank' && !lades.some((l) => l.id === i.lade_id && l.actief));
    if (los.length) out.push({ id: 'werkbank-los', titel: 'Koelwerkbank', items: los });
    const plekken: [KoelcelCheckItem['plek'], string][] = [
      ['werkblad', 'Flessen & werkblad'], ['koelcel', 'Koelcel'], ['vriezer', 'Vriescel'], ['magazijn', 'Magazijn'],
    ];
    for (const [p, t] of plekken) {
      const g = items.filter((i) => i.plek === p);
      if (g.length) out.push({ id: p, titel: t, items: g });
    }
    return out;
  }, [items, lades]);
  return { groepen, items };
}

/** Wat je moet doen als het niet klopt, in één zin. */
function opdracht(item: KoelcelCheckItem, alle: KoelcelCheckItem[]): string {
  const v = vervolgactieVoorRegel(item, alle);
  if (v.soort === 'niveau') {
    return `Pak ${item.naam.toLowerCase()} uit ${HERKOMST_LABEL[v.onderItem.plek]} en leg het ${BESTEMMING_LABEL[item.plek]}.`;
  }
  return `Op? Dan gaat het naar ${eindBestemming(item, alle).label}.`;
}

function regelUitleg(item: KoelcelCheckItem, alle: KoelcelCheckItem[]) {
  const norm = item.plek === 'werkbank' || item.plek === 'werkblad' ? vulnormLabel(item) : `${Number(item.doel_aantal)} ${item.eenheid}`;
  return `${norm} · aanvullen ${ketenKortLabel(item, alle)}`;
}

/* ---------- Voorbeeld 1: checklist ---------- */
function Checklist({ groepen, alle, verberg = [] }: { groepen: Groep[]; alle: KoelcelCheckItem[]; verberg?: string[] }) {
  const [klaar, setKlaar] = useState<Record<string, 'ok' | 'op'>>({});
  const zichtbaar = groepen.filter((g) => !verberg.includes(g.id));
  const totaal = zichtbaar.reduce((n, g) => n + g.items.length, 0);
  const gedaan = Object.keys(klaar).filter((id) => zichtbaar.some((g) => g.items.some((i) => i.id === id))).length;
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{gedaan} van {totaal} afgevinkt</p>
      {zichtbaar.map((g) => (
        <Card key={g.id} className="p-4 space-y-1">
          <h3 className="font-semibold">{g.titel}</h3>
          {g.items.map((i) => {
            const s = klaar[i.id];
            return (
              <div key={i.id} className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  aria-label={`${i.naam} afvinken`}
                  onClick={() => setKlaar((k) => { const n = { ...k }; if (n[i.id]) delete n[i.id]; else n[i.id] = 'ok'; return n; })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                >
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border-2',
                    s === 'ok' ? 'border-primary bg-primary text-primary-foreground' : s === 'op' ? 'border-destructive bg-destructive/10' : 'border-input')}>
                    {s === 'ok' && <Check className="h-4 w-4" />}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-medium', s === 'ok' && 'line-through text-muted-foreground')}>{i.naam}</p>
                  <p className="text-xs text-muted-foreground">{s === 'op' ? opdracht(i, alle) : regelUitleg(i, alle)}</p>
                </div>
                <Button variant={s === 'op' ? 'destructive' : 'outline'} className="h-11"
                  onClick={() => setKlaar((k) => ({ ...k, [i.id]: 'op' }))}>Op</Button>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}

/* ---------- Voorbeeld 2: alleen uitzonderingen ---------- */
function Uitzonderingen({ groepen, alle }: { groepen: Groep[]; alle: KoelcelCheckItem[] }) {
  const [klopt, setKlopt] = useState<Record<string, boolean>>({});
  const [mist, setMist] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<KoelcelCheckItem | null>(null);
  return (
    <div className="space-y-4">
      {groepen.map((g) => {
        const gemist = g.items.filter((i) => mist[i.id]);
        if (klopt[g.id]) {
          return (
            <Card key={g.id} className="flex items-center justify-between p-4">
              <span className="font-semibold">{g.titel}</span>
              <span className="flex items-center gap-1 text-sm text-primary"><Check className="h-4 w-4" /> Klopt{gemist.length ? ` · ${gemist.length} gemeld` : ''}</span>
            </Card>
          );
        }
        return (
          <Card key={g.id} className="p-4 space-y-3">
            <h3 className="font-semibold">{g.titel}</h3>
            <p className="text-xs text-muted-foreground">Tik alleen aan wat mist of bijna leeg is.</p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((i) => (
                <button key={i.id} type="button"
                  onClick={() => { setMist((m) => ({ ...m, [i.id]: true })); setOpen(i); }}
                  className={cn('min-h-11 rounded-polar border px-3 text-sm',
                    mist[i.id] ? 'border-destructive bg-destructive/10 text-destructive' : 'border-input bg-background')}>
                  {i.naam}
                </button>
              ))}
            </div>
            <Button className="h-12 w-full" onClick={() => setKlopt((k) => ({ ...k, [g.id]: true }))}>
              Klopt{gemist.length ? ` (${gemist.length} gemeld)` : ''}
            </Button>
          </Card>
        );
      })}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{open?.naam}</DialogTitle></DialogHeader>
          {open && <p className="text-base">{opdracht(open, alle)}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-12" onClick={() => setOpen(null)}>Gedaan</Button>
            <Button variant="outline" className="h-12" onClick={() => setOpen(null)}>Bron ook op</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Voorbeeld 3: checklist + maandag tellen ---------- */
function MaandagTelling({ groepen }: { groepen: Groep[] }) {
  const [tel, setTel] = useState<Record<string, number>>({});
  const telGroepen = groepen.filter((g) => ['koelcel', 'vriezer', 'magazijn'].includes(g.id));
  return (
    <div className="space-y-4">
      {telGroepen.map((g) => (
        <Card key={g.id} className="p-4 space-y-1">
          <h3 className="font-semibold">{g.titel} · tellen</h3>
          {g.items.map((i) => {
            const n = tel[i.id] ?? Number(i.doel_aantal);
            return (
              <div key={i.id} className="flex items-center gap-2 py-1">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.naam}</p>
                  <p className="text-xs text-muted-foreground">hoort {Number(i.doel_aantal)} {i.eenheid}</p>
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Minder"
                  onClick={() => setTel((t) => ({ ...t, [i.id]: Math.max(0, n - 1) }))}><Minus className="h-4 w-4" /></Button>
                <span className="w-8 text-center font-semibold">{n}</span>
                <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Meer"
                  onClick={() => setTel((t) => ({ ...t, [i.id]: n + 1 }))}><Plus className="h-4 w-4" /></Button>
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}

function ChecklistPlusMaandag({ groepen, alle }: { groepen: Groep[]; alle: KoelcelCheckItem[] }) {
  const [dag, setDag] = useState<'gewoon' | 'maandag'>('gewoon');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button variant={dag === 'gewoon' ? 'default' : 'outline'} className="h-11" onClick={() => setDag('gewoon')}>Gewone dag</Button>
        <Button variant={dag === 'maandag' ? 'default' : 'outline'} className="h-11" onClick={() => setDag('maandag')}>Maandag</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {dag === 'gewoon'
          ? 'Alleen afvinken: lades, flessen en koelcel. De vriescel en het magazijn sla je over.'
          : 'Maandag: eerst de vriescel, het magazijn en de koelcel tellen, daarna de gewone afvinklijst voor de lades.'}
      </p>
      {dag === 'maandag' && <MaandagTelling groepen={groepen} />}
      <Checklist groepen={groepen} alle={alle} verberg={dag === 'gewoon' ? ['vriezer', 'magazijn'] : ['koelcel', 'vriezer', 'magazijn']} />
    </div>
  );
}

export default function SluitrondeProef() {
  const { userLocation } = useUserLocation();
  const vestiging = userLocation || 'West';
  const { groepen, items } = useGroepen(vestiging);
  return (
    <SidebarLayout>
      <div className="page-stack max-w-3xl">
        <Card className="flex items-start gap-2 border-warning/40 bg-warning/10 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">Voorbeeld, wordt niet opgeslagen. Er gaat niets naar de mise-en-place of een bestelling en er wordt niets geprint.</p>
        </Card>
        <Tabs defaultValue="1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1" className="min-h-11">1. Checklist</TabsTrigger>
            <TabsTrigger value="2" className="min-h-11">2. Uitzonderingen</TabsTrigger>
            <TabsTrigger value="3" className="min-h-11">3. + maandag</TabsTrigger>
          </TabsList>
          <TabsContent value="1"><Checklist groepen={groepen} alle={items} /></TabsContent>
          <TabsContent value="2"><Uitzonderingen groepen={groepen} alle={items} /></TabsContent>
          <TabsContent value="3"><ChecklistPlusMaandag groepen={groepen} alle={items} /></TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
