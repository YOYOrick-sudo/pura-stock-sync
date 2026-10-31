import { StatusDot } from '@/components/pura/patronen';
import { kaartRandKlasse } from '@/components/pura';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';
import { euro, perLeverancier } from './presentatie';

export function LeveranciersOverzicht({ open, onderweg, leverancier, prijsVan }: {
  open: BestelSignaal[]; onderweg: BestelSignaal[]; leverancier: (s: BestelSignaal) => string;
  prijsVan: (s: BestelSignaal) => { vorm: ArtikelVorm; totaal: number } | null;
}) {
  const bedrag = (rs: BestelSignaal[]) => {
    const prijzen = rs.map(prijsVan).filter((p) => p != null);
    return prijzen.length ? euro(prijzen.reduce((n, p) => n + p.totaal, 0)) : '—';
  };
  return <Table className={`table-fixed [&_td]:px-2 [&_td]:py-2 [&_th]:px-2 [&_th]:h-9 ${kaartRandKlasse}`}><TableHeader><TableRow><TableHead>Leverancier</TableHead><TableHead className="w-24 text-right">Open €</TableHead><TableHead className="w-32 whitespace-nowrap text-right">Onderweg €</TableHead></TableRow></TableHeader><TableBody>{perLeverancier([...open, ...onderweg], leverancier).map(([naam, rs]) => {
    const zonder = rs.filter((s) => !prijsVan(s));
    return <TableRow key={naam}><TableCell className="break-words"><span>{naam}</span>{!!zonder.length && <Collapsible><CollapsibleTrigger asChild><Button variant="ghost" className="h-auto min-h-11 justify-start gap-1 whitespace-normal px-0 text-left text-xs text-muted-foreground"><StatusDot toon="let-op" label={`${zonder.length} zonder prijs`} /></Button></CollapsibleTrigger><CollapsibleContent className="text-xs text-muted-foreground">{zonder.map((s) => s.naam).join(', ')}</CollapsibleContent></Collapsible>}</TableCell><TableCell className="text-right tabular-nums">{bedrag(rs.filter((s) => s.status === 'open'))}</TableCell><TableCell className="text-right tabular-nums">{bedrag(rs.filter((s) => s.status === 'besteld'))}</TableCell></TableRow>;
  })}</TableBody></Table>;
}