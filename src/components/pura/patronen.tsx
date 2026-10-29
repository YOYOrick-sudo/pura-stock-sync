import { ChevronDown, RotateCw, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Sectiekop: titel + teller links, één actie of info rechts. */
export function SectieKop({ titel, teller, rechts }: { titel: ReactNode; teller?: ReactNode; rechts?: ReactNode }) {
  return <div className="flex min-h-9 items-center justify-between gap-2">
    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">{titel}{teller != null && <span className="tabular-nums font-normal text-muted-foreground">{teller}</span>}</div>
    {rechts}
  </div>;
}

/** Groepkop als tussenrij in één tabel: naam vet links, aantal en totaal rechts. */
export function GroepRij({ naam, aantal, totaal, kolommen, gedimd = false, actie }: { naam: ReactNode; aantal?: number; totaal?: ReactNode; kolommen: number; gedimd?: boolean; actie?: ReactNode }) {
  return <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableCell colSpan={kolommen} className="h-10 py-0">
      <div className={cn('flex items-center justify-between gap-2 text-sm', gedimd ? 'text-muted-foreground' : 'text-foreground')}>
        <span className="flex min-w-0 items-baseline gap-2"><span className="truncate font-semibold">{naam}</span>{aantal != null && <span className="shrink-0 tabular-nums font-normal text-muted-foreground">{aantal}</span>}</span>
        <span className="flex shrink-0 items-center gap-3 tabular-nums">{totaal != null && <span className="font-medium text-foreground">{totaal}</span>}{actie}</span>
      </div>
    </TableCell>
  </TableRow>;
}

/** Kengetal: icoon + label klein, groot getal eronder. Meerdere naast elkaar in één kaart. */
export function Kengetal({ icoon: Icoon, label, waarde, toon = 'neutraal' }: { icoon: LucideIcon; label: string; waarde: ReactNode; toon?: 'neutraal' | 'let-op' }) {
  return <div className="min-w-0 space-y-1 px-3 py-4">
    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Icoon className={cn('h-4 w-4 shrink-0', toon === 'let-op' && 'text-warning')} /><span className="truncate leading-tight">{label}</span></div>
    <div className={cn('truncate text-xl font-semibold tabular-nums', toon === 'let-op' ? 'text-warning' : 'text-foreground')}>{waarde}</div>
  </div>;
}

/** Eén samenvattingskaart: kengetallen elk in een eigen vak, optioneel inhoud eronder. */
export function OverzichtKaart({ kengetallen, children }: { kengetallen: ReactNode; children?: ReactNode }) {
  return <Card className="self-start overflow-hidden">
    <div className="grid grid-cols-3 divide-x divide-border">{kengetallen}</div>
    {children && <div className="border-t border-border">{children}</div>}
  </Card>;
}

export function LegeStaat({ tekst }: { tekst: string }) {
  return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{tekst}</p>;
}

/** Kleine stip met optioneel één woord. Toon: goed (groen), let-op (oranje), fout (rood), neutraal (grijs). */
export function StatusDot({ toon = 'neutraal', label, verborgenLabel }: { toon?: 'goed' | 'let-op' | 'fout' | 'neutraal'; label?: string; verborgenLabel?: string }) {
  const kleur = { goed: 'bg-primary', 'let-op': 'bg-warning', fout: 'bg-destructive', neutraal: 'bg-muted-foreground' }[toon];
  return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
    <span className={cn('h-2 w-2 shrink-0 rounded-full', kleur)} aria-hidden />
    {label}{verborgenLabel && <span className="sr-only">{verborgenLabel}</span>}
  </span>;
}

/** Invoerbalk: zoekveld, aantal en eenheid in één omlijnd vlak. Kinderen zijn randloos. */
export function Invoerbalk({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-polar-md border border-input bg-background p-1 sm:flex-nowrap [&_input]:border-0 [&_input]:shadow-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0">{children}</div>;
}

/** Klasse voor TabsList als aaneengesloten segmentbalk zonder gaten. */
export const segmentTabsKlasse = 'flex h-auto w-full min-w-0 gap-0 p-1 sm:w-auto [&>button]:min-h-11 [&>button]:flex-1 [&>button]:gap-1.5 [&>button]:px-3 sm:[&>button]:flex-none';

/* ===================== Kaarten & lijsten ===================== */

/** Kaartkop: icoon + titel + teller links, één compacte actie rechts. */
export function KaartKop({ icoon: Icoon, titel, teller, rechts }: { icoon?: LucideIcon; titel: ReactNode; teller?: number; rechts?: ReactNode }) {
  return <div className="flex min-h-12 items-center justify-between gap-2 border-b border-border px-4 py-2">
    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
      {Icoon && <Icoon className="h-5 w-5 shrink-0 text-muted-foreground" />}
      <span className="truncate">{titel}</span>
      {teller != null && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{teller}</span>}
    </div>
    {rechts && <div className="flex shrink-0 items-center gap-1">{rechts}</div>}
  </div>;
}

/** Lijstkaart: kaartkop + tabel van rand tot rand + optionele voetregel. */
export function LijstKaart({ kop, children, voet }: { kop?: ReactNode; children: ReactNode; voet?: ReactNode }) {
  return <Card className="overflow-hidden">
    {kop}
    <div className="min-w-0">{children}</div>
    {voet && <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{voet}</div>}
  </Card>;
}

/** Laadrijen: skelet in dezelfde rijhoogte als de lijst. */
export function LaadRijen({ aantal = 3 }: { aantal?: number }) {
  return <div className="divide-y divide-border" aria-busy="true" aria-label="Laden">
    {Array.from({ length: aantal }, (_, i) => <div key={i} className="flex h-12 items-center gap-3 px-4"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-12" /></div>)}
  </div>;
}

/** Foutregel met één herstelactie. */
export function FoutRegel({ tekst = 'Laden mislukt.', onOpnieuw }: { tekst?: string; onOpnieuw?: () => void }) {
  return <div className="flex min-h-12 items-center justify-between gap-2 px-4 text-sm">
    <StatusDot toon="fout" label={tekst} />
    {onOpnieuw && <Button variant="ghost" size="touch" onClick={onOpnieuw}><RotateCw className="h-4 w-4" />Opnieuw</Button>}
  </div>;
}

/** Inklapgroep: één stijl voor "Geleverd (n)", "Niet nodig (n)", "Overige (n)". */
export function InklapGroep({ titel, aantal, children, standaardOpen = false }: { titel: string; aantal?: number; children: ReactNode; standaardOpen?: boolean }) {
  return <Collapsible defaultOpen={standaardOpen} className="group/inklap">
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="touch" className="w-full justify-between text-muted-foreground">
        <span>{titel}{aantal != null && <span className="tabular-nums"> ({aantal})</span>}</span>
        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/inklap:rotate-180" />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>{children}</CollapsibleContent>
  </Collapsible>;
}

/* ===================== Invoer & acties ===================== */

/** Filterbalk: zoekveld links, max. twee filters, één actie rechts. */
export function FilterBalk({ zoek, filters, actie }: { zoek?: ReactNode; filters?: ReactNode; actie?: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">
    {zoek && <div className="min-w-0 flex-1 basis-full sm:basis-auto">{zoek}</div>}
    {filters}
    {actie && <div className="ml-auto">{actie}</div>}
  </div>;
}

/** Detaillade: details/bewerken bij tik op een rij. Rechts vanaf iPad, onderaan op telefoon. */
export function DetailLade({ open, onOpenChange, titel, children, voet }: { open: boolean; onOpenChange: (o: boolean) => void; titel: ReactNode; children: ReactNode; voet?: ReactNode }) {
  const smal = useSmal();
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side={smal ? 'bottom' : 'right'} className={cn('flex flex-col gap-0 p-0', smal ? 'max-h-[90vh] rounded-t-polar-2xl' : 'w-full sm:max-w-md')}>
      <SheetHeader className="border-b border-border px-4 py-3 text-left"><SheetTitle className="pr-8 text-base">{titel}</SheetTitle></SheetHeader>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">{children}</div>
      {voet && <div className="flex justify-end gap-2 border-t border-border px-4 py-3">{voet}</div>}
    </SheetContent>
  </Sheet>;
}

function useSmal() {
  const [smal, setSmal] = useState(() => typeof window !== 'undefined' && window.innerWidth < 744);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 743px)');
    const z = () => setSmal(mq.matches);
    z(); mq.addEventListener('change', z);
    return () => mq.removeEventListener('change', z);
  }, []);
  return smal;
}

/** Formuliersectie: kop + velden; label boven veld. */
export function FormSectie({ titel, info, children }: { titel: string; info?: ReactNode; children: ReactNode }) {
  return <section className="space-y-3">
    <div className="flex items-center gap-1 text-sm font-semibold text-foreground">{titel}{info}</div>
    <div className="space-y-3">{children}</div>
  </section>;
}

/** Bevestigen: alleen voor verwijderen/archiveren. */
export function Bevestig({ open, onOpenChange, titel, tekst, actie, onBevestig }: { open: boolean; onOpenChange: (o: boolean) => void; titel: string; tekst?: string; actie: string; onBevestig: () => void }) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{titel}</AlertDialogTitle>{tekst && <AlertDialogDescription>{tekst}</AlertDialogDescription>}</AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={onBevestig}>{actie}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
