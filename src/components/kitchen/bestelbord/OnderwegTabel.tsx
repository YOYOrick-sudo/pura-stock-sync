import { Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import { CompacteTabel } from './CompacteTabel';

export function OnderwegTabel({ titel, regels, dagenTeLaatVan, onAllesGeleverd, onGeleverd, onDatum, onNietGeleverd, onDeelsGeleverd, onBewerk, datumLabel, leverDatumLabel }: {
  titel: string; regels: BestelSignaal[]; dagenTeLaatVan: (s: BestelSignaal) => number;
  onAllesGeleverd: (ids: string[]) => void; onGeleverd: (s: BestelSignaal) => void;
  onDatum: (s: BestelSignaal) => void; onNietGeleverd: (s: BestelSignaal) => void; onDeelsGeleverd: (s: BestelSignaal) => void;
  onBewerk: (s: BestelSignaal) => void; datumLabel: (d: string) => string; leverDatumLabel: (d: string | null) => string;
}) {
  const besteldOp = regels[0]?.besteld_op;
  return <section>
    <div className="flex items-center justify-between gap-2 bg-muted/50 px-3 py-1 text-sm text-muted-foreground"><span className="min-w-0 break-words">{titel}{besteldOp && ` · besteld ${datumLabel(besteldOp)}`}</span><Button variant="ghost" className="min-h-11 shrink-0 gap-1 px-2" onClick={() => onAllesGeleverd(regels.map((s) => s.id))}><Check className="h-4 w-4" /><span className="hidden sm:inline">Alles geleverd</span><span className="sm:hidden">Alles</span></Button></div>
    <CompacteTabel onderweg kinderen={<TableBody>{regels.map((s) => <TableRow key={s.id} className="cursor-pointer" onClick={() => onBewerk(s)}>
      <TableCell onClick={(e) => e.stopPropagation()}><label className="flex h-12 w-11 cursor-pointer items-center justify-center"><Checkbox aria-label={`${s.naam} geleverd`} checked={false} onCheckedChange={() => onGeleverd(s)} /></label></TableCell>
      <TableCell><div className="flex min-h-12 items-center gap-1"><Button variant="ghost" className="h-auto min-h-11 min-w-0 justify-start whitespace-normal rounded-none px-0 text-left font-medium" onClick={(e) => { e.stopPropagation(); onBewerk(s); }}>{s.naam}</Button>{dagenTeLaatVan(s) > 0 && <Badge variant="destructive" className="shrink-0" title={`${dagenTeLaatVan(s)} dagen te laat`}>{dagenTeLaatVan(s)}d</Badge>}</div></TableCell>
      <TableCell className="text-right tabular-nums">{Number(s.aantal)} <span className="text-muted-foreground">{s.eenheid || '—'}</span></TableCell>
      <TableCell className="hidden text-right text-muted-foreground sm:table-cell">{s.verwachte_levering ? leverDatumLabel(s.verwachte_levering) : '—'}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-11 w-11 p-0" aria-label={`Opties ${s.naam}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onDatum(s)}>Leverdatum aanpassen</DropdownMenuItem><DropdownMenuItem onClick={() => onNietGeleverd(s)}>Niet geleverd</DropdownMenuItem><DropdownMenuItem onClick={() => onDeelsGeleverd(s)}>Deels geleverd</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
    </TableRow>)}</TableBody>} />
  </section>;
}