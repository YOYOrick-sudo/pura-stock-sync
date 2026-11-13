import { eenheidVorm } from '@/lib/hoeveelheid';
import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import { GroepRij } from '@/components/pura/patronen';
import { CompacteTabel } from './CompacteTabel';
import { perLeverancier } from './presentatie';

/** Winkel: gehaald afvinken. Intern: alleen tonen, geen bestelactie. */
export function ZelfHalenTabel({ soort, regels, leverancier, onGehaald, onAllesGehaald, onBewerk, onVervallen, alleenLezen = false }: {
  soort: 'winkel' | 'intern';
  regels: BestelSignaal[];
  leverancier: (s: BestelSignaal) => string;
  onGehaald: (s: BestelSignaal) => void;
  onAllesGehaald: (ids: string[]) => void;
  onBewerk: (s: BestelSignaal) => void;
  onVervallen: (s: BestelSignaal) => void;
  alleenLezen?: boolean;
}) {
  const winkel = soort === 'winkel';
  const kolommen = winkel ? 4 : 3;
  return <CompacteTabel zonderKop zonderVink zonderMidden={!winkel} kinderen={<TableBody>{perLeverancier(regels, leverancier).map(([lev, rs]) => <Fragment key={lev}>
    <GroepRij kolommen={kolommen} naam={lev} aantal={rs.length} actie={winkel && !alleenLezen ? <Button variant="ghost" size="touch" className="-my-1 gap-1 px-2" onClick={() => onAllesGehaald(rs.map((s) => s.id))}><Check className="h-4 w-4" />Alles gehaald</Button> : undefined} />
    {rs.map((s) => <TableRow key={s.id} className={alleenLezen ? undefined : 'cursor-pointer'} onClick={() => !alleenLezen && onBewerk(s)}>
      <TableCell colSpan={kolommen}>
        <div className="flex min-h-11 flex-wrap items-center gap-2">
          <span className="min-w-0 basis-full break-normal font-medium sm:flex-1 sm:basis-0">{s.naam}</span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap tabular-nums"><span className="inline-flex items-center rounded-full bg-muted px-2 text-sm font-semibold">{Number(s.aantal)}</span>{s.eenheid && <span className="text-xs text-muted-foreground">{eenheidVorm(Number(s.aantal), s.eenheid)}</span>}</span>
          {winkel && !alleenLezen && <Button type="button" variant="outline" size="touch" className="px-3" onClick={(e) => { e?.stopPropagation(); onGehaald(s); }}>Gehaald</Button>}
          {!alleenLezen && <Button type="button" variant="outline" size="touch" aria-label={`${s.naam} weg`} onClick={(e) => { e?.stopPropagation(); onVervallen(s); }}>Weg</Button>}
        </div>
      </TableCell>
    </TableRow>)}
  </Fragment>)}</TableBody>} />;
}
