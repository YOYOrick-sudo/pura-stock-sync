import { Fragment } from 'react';
import { Check, MoreVertical, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';
import type { PrijsSignaal } from '@/lib/prijsSignaal';
import { PrijsPijl } from '@/components/kitchen/PrijsPijl';
import { GroepRij, StatusDot } from '@/components/layout/Paginapatronen';
import { CompacteTabel } from './CompacteTabel';
import { euro, perLeverancier } from './presentatie';

export function BordTabel({ regels, leverancier, prijsVan, prijsSignaal, prijsTip, onBesteld, onBewerk, onVervallen, geleverd = false, onTerug, detail }: {
  regels: BestelSignaal[]; leverancier: (s: BestelSignaal) => string;
  prijsVan: (s: BestelSignaal) => { vorm: ArtikelVorm; totaal: number } | null;
  prijsSignaal: (s: BestelSignaal) => PrijsSignaal | null; prijsTip: (v: ArtikelVorm) => string;
  onBesteld: (s: BestelSignaal, b: boolean) => void; onBewerk: (s: BestelSignaal) => void; onVervallen: (s: BestelSignaal) => void;
  geleverd?: boolean; onTerug?: (s: BestelSignaal) => void; detail?: (s: BestelSignaal) => string;
}) {
  return <CompacteTabel kinderen={<TableBody>{perLeverancier(regels, leverancier).map(([lev, rs]) => {
    const prijzen = rs.map(prijsVan).filter((p) => p != null);
    return <Fragment key={lev}>
      <GroepRij kolommen={5} naam={lev} aantal={rs.length} totaal={prijzen.length ? euro(prijzen.reduce((n, p) => n + p.totaal, 0)) : undefined} gedimd={lev === 'Leverancier onbekend'} />
      {rs.map((s) => {
        const prijs = prijsVan(s);
        return <TableRow key={s.id} className={geleverd ? 'text-muted-foreground' : 'cursor-pointer'} onClick={() => !geleverd && onBewerk(s)}>
          <TableCell onClick={(e) => e.stopPropagation()}>{geleverd ? <div className="flex h-11 w-11 items-center justify-center"><Check className="h-4 w-4 text-primary" /></div> : <label className="flex h-11 w-11 cursor-pointer items-center justify-center"><Checkbox checked={s.status === 'besteld'} aria-label={`${s.naam} besteld`} onCheckedChange={(b) => onBesteld(s, b === true)} /></label>}</TableCell>
          <TableCell className="truncate font-medium">{geleverd ? <Tooltip><TooltipTrigger asChild><span>{s.naam}</span></TooltipTrigger><TooltipContent className="max-w-xs">{detail?.(s) || 'Geleverd'}</TooltipContent></Tooltip> : s.naam}</TableCell>
          <TableCell className="text-right tabular-nums"><span className="font-medium">{Number(s.aantal)}</span> <span className="text-muted-foreground">{s.eenheid || ''}</span></TableCell>
          <TableCell className="hidden text-right sm:table-cell" onClick={(e) => e.stopPropagation()}><Tooltip><TooltipTrigger asChild><span className="inline-flex h-11 items-center justify-end gap-1 tabular-nums">{prijs && <PrijsPijl signaal={prijsSignaal(s)} eenheid={s.eenheid} alleenDuurder />}{prijs ? euro(prijs.totaal) : <StatusDot toon="let-op" verborgenLabel="Geen prijs" />}</span></TooltipTrigger><TooltipContent>{prijs ? prijsTip(prijs.vorm) : 'Geen prijs bekend'}</TooltipContent></Tooltip></TableCell>
          <TableCell onClick={(e) => e.stopPropagation()}>{geleverd ? <Button variant="ghost" className="h-11 w-11 p-0" aria-label={`${s.naam} terug naar onderweg`} onClick={() => onTerug?.(s)}><Undo2 className="h-4 w-4" /></Button> : <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-11 w-11 p-0" aria-label={`Opties ${s.naam}`}><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onBewerk(s)}>Bewerken</DropdownMenuItem><DropdownMenuItem onClick={() => onVervallen(s)}>Vervallen</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</TableCell>
        </TableRow>;
      })}
    </Fragment>;
  })}</TableBody>} />;
}
