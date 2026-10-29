import { Check, Circle, Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BestelAdvies, BestelSignaal } from '@/hooks/useBestelbord';
import { CompacteTabel } from './CompacteTabel';
import { perLeverancier } from './presentatie';

export function AdviesTabel({ regels, open, bezig, onOpBord, nul = false }: { regels: BestelAdvies[]; open: BestelSignaal[]; bezig: boolean; onOpBord: (a: BestelAdvies) => void; nul?: boolean }) {
  return <div className={nul ? 'opacity-60' : undefined}>{perLeverancier(regels, (a) => a.leverancier ?? 'Leverancier onbekend').map(([lev, rs]) => <section key={lev}>
    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-sm text-muted-foreground"><span>{lev}</span><span className="tabular-nums">{rs.length}</span></div>
    <CompacteTabel advies kinderen={<TableBody>{rs.map((a) => {
      const alOpen = !!a.artikel_id && open.some((s) => s.artikel_id === a.artikel_id);
      return <TableRow key={a.id}>
        <TableCell><div className="flex min-h-12 items-center gap-2"><span className="min-w-0 break-words font-medium">{a.artikel}</span>{a.onzeker && !alOpen && !a.op_bord_regel_id && <Circle className="h-2 w-2 shrink-0 fill-warning text-warning" aria-label="onzeker" />}</div></TableCell>
        <TableCell className="text-right tabular-nums"><span className="text-lg font-semibold">{Number(a.hoeveelheid)}</span> <span className="text-muted-foreground">{a.eenheid}</span></TableCell>
        <TableCell><Reden a={a} /></TableCell>
        <TableCell>{nul ? null : alOpen ? <Tooltip><TooltipTrigger asChild><span className="flex min-h-11 flex-wrap items-center justify-center gap-1 text-xs text-primary" tabIndex={0}><Circle className="h-2 w-2 shrink-0 fill-current" /><span>op bord</span></span></TooltipTrigger><TooltipContent>op bord</TooltipContent></Tooltip> : a.op_bord_regel_id ? <span className="flex h-11 items-center justify-center text-primary"><Check className="h-4 w-4" aria-label="Op bord gezet" /></span> : <Tooltip><TooltipTrigger asChild><Button variant="ghost" className="h-11 w-11 p-0" disabled={bezig} aria-label={`${a.artikel} op bord`} onClick={() => onOpBord(a)}><Plus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>op bord</TooltipContent></Tooltip>}</TableCell>
      </TableRow>;
    })}</TableBody>} />
  </section>)}</div>;
}

function Reden({ a }: { a: BestelAdvies }) {
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" className="h-11 w-11 p-0" aria-label={`Reden voor ${a.artikel}`}><Info className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent className="max-w-xs"><p>{a.reden || 'Geen toelichting'}</p>{a.onzeker && <p>Onzeker</p>}<p className="text-muted-foreground">Bestelhistorie</p></TooltipContent></Tooltip>;
}