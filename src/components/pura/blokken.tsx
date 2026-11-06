import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Stappen: voortgang van een proces (besteld → onderweg → geleverd). Alleen tonen, nooit klikbaar. */
export function Stappen({ stappen, huidig }: { stappen: string[]; huidig: number }) {
  return <ol className="flex items-start" aria-label="Voortgang">
    {stappen.map((s, i) => <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center" aria-current={i === huidig ? 'step' : undefined}>
      <div className="flex w-full items-center">
        <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : i <= huidig ? 'bg-primary' : 'bg-border')} />
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs', i < huidig ? 'border-primary bg-primary text-primary-foreground' : i === huidig ? 'border-primary bg-background text-primary' : 'border-border bg-background text-muted-foreground')}>{i < huidig ? <Check className="h-3 w-3" /> : i + 1}</span>
        <span className={cn('h-0.5 flex-1', i === stappen.length - 1 ? 'bg-transparent' : i < huidig ? 'bg-primary' : 'bg-border')} />
      </div>
      <span className={cn('text-xs', i === huidig ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{s}</span>
    </li>)}
  </ol>;
}

/** Genummerde stap in een instructie (kassa, sluiten). */
export function GenummerdeStap({ nummer, titel, children }: { nummer: number; titel: ReactNode; children?: ReactNode }) {
  return <div className="flex gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">{nummer}</span>
    <div className="min-w-0 space-y-1"><p className="text-sm font-medium text-foreground">{titel}</p>{children && <div className="text-sm text-muted-foreground">{children}</div>}</div>
  </div>;
}

/** Kengetal met uitsplitsing: label, groot getal, hooguit drie regels. */
export function KengetalVerdeling({ label, waarde, regels }: { label: string; waarde: ReactNode; regels: { naam: string; waarde: ReactNode; toon?: 'goed' | 'let-op' | 'neutraal' }[] }) {
  return <Card className="space-y-3 p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-semibold tabular-nums text-foreground">{waarde}</p>
    <ul className="space-y-1">{regels.slice(0, 3).map((r) => <li key={r.naam} className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground"><span className={cn('h-2 w-2 rounded-full', r.toon === 'goed' ? 'bg-primary' : r.toon === 'let-op' ? 'bg-warning' : 'bg-muted-foreground')} />{r.naam}</span>
      <span className="font-medium tabular-nums text-foreground">{r.waarde}</span>
    </li>)}</ul>
  </Card>;
}

/** Instellingsrij: titel + één regel links, bediening (schakelaar/select) rechts. */
export function InstellingRij({ titel, uitleg, children }: { titel: ReactNode; uitleg?: ReactNode; children: ReactNode }) {
  return <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
    <div className="min-w-0"><p className="text-sm font-medium text-foreground">{titel}</p>{uitleg && <p className="text-xs text-muted-foreground">{uitleg}</p>}</div>
    <div className="shrink-0">{children}</div>
  </div>;
}

/** Formulierkaart: velden met label erboven, knoppen rechtsonder (Annuleren, Opslaan). */
export function FormKaart({ titel, children, knoppen }: { titel?: ReactNode; children: ReactNode; knoppen?: ReactNode }) {
  return <Card className="overflow-hidden">
    {titel && <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">{titel}</div>}
    <div className="space-y-4 p-4">{children}</div>
    {knoppen && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{knoppen}</div>}
  </Card>;
}
