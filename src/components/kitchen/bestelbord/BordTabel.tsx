import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';
import type { PrijsSignaal } from '@/lib/prijsSignaal';
import { PrijsPijl } from '@/components/kitchen/PrijsPijl';
import { GroepRij } from '@/components/pura/patronen';
import { RijMenu, RijMeta } from '@/components/pura/lijst';
import { CompacteTabel } from './CompacteTabel';
import { euro, perLeverancier } from './presentatie';
import { DeadlineNaam } from './DeadlineNaam';
import { RegelInfo } from './RegelInfo';
import type { BordRegelInfo } from '@/hooks/useBestelbord';

export function BordTabel({ regels, regelInfo, leverancier, deadlineHint, prijsVan, prijsSignaal, prijsTip, onBesteld, onBewerk, onVervallen, geleverd = false, onTerug, detail }: {
  regels: BestelSignaal[]; leverancier: (s: BestelSignaal) => string;
  deadlineHint: (s: BestelSignaal) => string | null;
  prijsVan: (s: BestelSignaal) => { vorm: ArtikelVorm; totaal: number } | null;
  prijsSignaal: (s: BestelSignaal) => PrijsSignaal | null; prijsTip: (v: ArtikelVorm) => string;
  onBesteld: (s: BestelSignaal, b: boolean) => void; onBewerk: (s: BestelSignaal) => void; onVervallen: (s: BestelSignaal) => void;
  geleverd?: boolean; onTerug?: (s: BestelSignaal) => void; detail?: (s: BestelSignaal) => string;
  regelInfo?: (s: BestelSignaal) => BordRegelInfo | undefined;
}) {
  return <CompacteTabel vinkKop={geleverd ? undefined : 'Besteld'} kinderen={<TableBody>{perLeverancier(regels, leverancier).map(([lev, rs]) => {
    const prijzen = rs.map(prijsVan).filter((p) => p != null);
    return <Fragment key={lev}>
      <GroepRij kolommen={5} naam={geleverd ? lev : <DeadlineNaam naam={lev} hint={rs[0] ? deadlineHint(rs[0]) : null} />} aantal={rs.length} totaal={prijzen.length ? euro(prijzen.reduce((n, p) => n + p.totaal, 0)) : undefined} gedimd={lev === 'Leverancier onbekend'} />
      {rs.map((s) => {
        const prijs = prijsVan(s);
        const info = geleverd ? detail?.(s) : '';
        return <TableRow key={s.id} className={geleverd ? 'text-muted-foreground' : 'cursor-pointer'} onClick={() => !geleverd && onBewerk(s)}>
          <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}>{geleverd ? <div className="mx-auto flex h-11 w-11 items-center justify-center"><Check className="h-4 w-4 text-primary" aria-label="Geleverd" /></div> : <label className="mx-auto flex h-11 w-11 cursor-pointer items-center justify-center"><Checkbox checked={s.status === 'besteld'} aria-label={`${s.naam} besteld`} onCheckedChange={(b) => onBesteld(s, b === true)} /></label>}</TableCell>
          <TableCell><div className="flex min-h-11 min-w-0 flex-col justify-center">
            <span className="truncate font-medium">{s.naam}</span>
            <RegelInfo info={regelInfo?.(s)} />
            {info ? <RijMeta altijd>{info}</RijMeta> : <RijMeta>{prijs ? euro(prijs.totaal) : '—'}</RijMeta>}
          </div></TableCell>
          <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="font-medium">{Number(s.aantal)}</span> <span className="text-xs text-muted-foreground">{s.eenheid || ''}</span></TableCell>
          <TableCell className="!px-0 text-right sm:!px-2" onClick={(e) => e.stopPropagation()}><div className="hidden sm:block">{prijs ? <Tooltip><TooltipTrigger asChild><span className="inline-flex h-11 items-center justify-end gap-1 tabular-nums" tabIndex={0}><PrijsPijl signaal={prijsSignaal(s)} eenheid={s.eenheid} alleenDuurder />{euro(prijs.totaal)}</span></TooltipTrigger><TooltipContent>{prijsTip(prijs.vorm)}</TooltipContent></Tooltip> : <span className="text-muted-foreground">—</span>}</div></TableCell>
          <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}><RijMenu naam={s.naam} acties={geleverd ? [{ label: 'Terug naar onderweg', onClick: () => onTerug?.(s) }] : [{ label: 'Bewerken', onClick: () => onBewerk(s) }, { label: 'Vervallen', onClick: () => onVervallen(s), gevaar: true }]} /></TableCell>
        </TableRow>;
      })}
    </Fragment>;
  })}</TableBody>} />;
}
