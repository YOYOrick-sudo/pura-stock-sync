import { Fragment } from 'react';
import { Info, Plus } from 'lucide-react';
import { GroepRij } from '@/components/pura/patronen';
import { StatusLabel } from '@/components/pura/lijst';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BestelAdvies, BestelSignaal } from '@/hooks/useBestelbord';
import { CompacteTabel } from './CompacteTabel';
import { perLeverancier } from './presentatie';
import { DeadlineNaam } from './DeadlineNaam';

export function AdviesTabel({ regels, open, bezig, onOpBord, deadlineHint, nul = false }: { regels: BestelAdvies[]; open: BestelSignaal[]; bezig: boolean; onOpBord: (a: BestelAdvies) => void; deadlineHint: (a: BestelAdvies) => string | null; nul?: boolean }) {
  return <div className={nul ? 'opacity-60' : undefined}><CompacteTabel advies kinderen={<TableBody>{perLeverancier(regels, (a) => a.leverancier ?? 'Leverancier onbekend').map(([lev, rs]) => <Fragment key={lev}>
    <GroepRij kolommen={4} naam={<DeadlineNaam naam={lev} hint={rs[0] ? deadlineHint(rs[0]) : null} />} aantal={rs.length} gedimd={lev === 'Leverancier onbekend'} />
    {rs.map((a) => {
      const opBord = (!!a.artikel_id && open.some((s) => s.artikel_id === a.artikel_id)) || !!a.op_bord_regel_id;
      return <TableRow key={a.id}>
        <TableCell><div className="flex min-h-11 items-center gap-2"><span className="min-w-0 break-words font-medium">{a.artikel}</span>{a.onzeker && !opBord && !nul && <StatusLabel toon="let-op">Onzeker</StatusLabel>}</div></TableCell>
        <TableCell className="text-right tabular-nums"><span className="font-semibold">{Number(a.hoeveelheid)}</span> <span className="text-xs text-muted-foreground">{a.eenheid}</span></TableCell>
        <TableCell><Reden a={a} /></TableCell>
        <TableCell className="text-right">{nul ? null : opBord ? <StatusLabel toon="goed">Op bord</StatusLabel> : <Button variant="outline" size="touch" className="gap-1 px-3" disabled={bezig} aria-label={`${a.artikel} op bord`} onClick={() => onOpBord(a)}><Plus className="h-4 w-4" />Bord</Button>}</TableCell>
      </TableRow>;
    })}
  </Fragment>)}</TableBody>} /></div>;
}

/** Toelichting op tik (geen hover): werkt ook op de iPad. */
function Reden({ a }: { a: BestelAdvies }) {
  return <Popover><PopoverTrigger asChild><Button variant="ghost" size="touch-icon" aria-label={`Reden voor ${a.artikel}`}><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="max-w-xs text-sm"><p>{a.reden || 'Geen toelichting'}</p>{a.onzeker && <p className="mt-1 text-muted-foreground">Onzeker voorstel</p>}</PopoverContent></Popover>;
}
