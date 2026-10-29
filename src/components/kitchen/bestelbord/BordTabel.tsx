import { Check, MoreVertical, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';
import type { PrijsSignaal } from '@/lib/prijsSignaal';
import { PrijsPijl } from '@/components/kitchen/PrijsPijl';
import { CompacteTabel } from './CompacteTabel';
import { euro, perLeverancier } from './presentatie';

export function BordTabel({ regels, leverancier, prijsVan, prijsSignaal, prijsTip, onBesteld, onBewerk, onVervallen, geleverd = false, onTerug, detail }: {
  regels: BestelSignaal[]; leverancier: (s: BestelSignaal) => string;
  prijsVan: (s: BestelSignaal) => { vorm: ArtikelVorm; totaal: number } | null;
  prijsSignaal: (s: BestelSignaal) => PrijsSignaal | null; prijsTip: (v: ArtikelVorm) => string;
  onBesteld: (s: BestelSignaal, b: boolean) => void; onBewerk: (s: BestelSignaal) => void; onVervallen: (s: BestelSignaal) => void;
  geleverd?: boolean; onTerug?: (s: BestelSignaal) => void; detail?: (s: BestelSignaal) => string;
}) {
  return <div className="space-y-3">{perLeverancier(regels, leverancier).map(([lev, rs]) => {
    const prijzen = rs.map(prijsVan).filter((p) => p != null);
    return <section key={lev}>
      <div className="flex items-center justify-between gap-2 bg-muted/50 px-3 py-2 text-sm text-muted-foreground"><span className="min-w-0 break-words">{lev}</span><span className="flex shrink-0 gap-3 tabular-nums"><span>{rs.length}</span><span>{prijzen.length ? euro(prijzen.reduce((n, p) => n + p.totaal, 0)) : '—'}</span></span></div>
      <CompacteTabel kinderen={<TableBody>{rs.map((s) => {
        const prijs = prijsVan(s);
        return <TableRow key={s.id} className={geleverd ? 'text-muted-foreground' : 'cursor-pointer'} onClick={() => !geleverd && onBewerk(s)}>
          <TableCell onClick={(e) => e.stopPropagation()}><div className="flex h-12 w-11 items-center justify-center">{geleverd ? <Check className="h-4 w-4 text-primary" /> : <label className="flex h-11 w-11 cursor-pointer items-center justify-center"><Checkbox checked={s.status === 'besteld'} aria-label={`${s.naam} besteld`} onCheckedChange={(b) => onBesteld(s, b === true)} /></label>}</div></TableCell>
          <TableCell><Tooltip><TooltipTrigger asChild><Button variant="ghost" className="h-auto min-h-11 w-full justify-start whitespace-normal rounded-none px-0 text-left font-medium" onClick={(e) => { e.stopPropagation(); if (!geleverd) onBewerk(s); }}>{s.naam}</Button></TooltipTrigger>{geleverd && <TooltipContent className="max-w-xs">{detail?.(s) || 'Geleverd'}</TooltipContent>}</Tooltip></TableCell>
          <TableCell className="text-right tabular-nums"><span className="font-medium">{Number(s.aantal)}</span> <span className="text-muted-foreground">{s.eenheid || '—'}</span></TableCell>
          <TableCell className="hidden text-right sm:table-cell" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-end gap-1">{prijs && <PrijsPijl signaal={prijsSignaal(s)} eenheid={s.eenheid} />}<Tooltip><TooltipTrigger asChild><Button variant="ghost" className="h-11 px-1 font-medium tabular-nums" aria-label={`Prijs ${s.naam}`}>{prijs ? euro(prijs.totaal) : '—'}</Button></TooltipTrigger><TooltipContent>{prijs ? prijsTip(prijs.vorm) : 'Geen prijs bekend'}</TooltipContent></Tooltip></div></TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>{geleverd ? <Button variant="ghost" className="h-11 w-11 p-0" aria-label={`${s.naam} terug naar onderweg`} onClick={() => onTerug?.(s)}><Undo2 className="h-4 w-4" /></Button> : <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-11 w-11 p-0" aria-label={`Opties ${s.naam}`}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onBewerk(s)}>Bewerken</DropdownMenuItem><DropdownMenuItem onClick={() => onVervallen(s)}>Vervallen</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</TableCell>
        </TableRow>;
      })}</TableBody>} />
    </section>;
  })}</div>;
}