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
  return <CompacteTabel zonderKop zonderVink zonderMidden={!winkel} ruimeActie kinderen={<TableBody>{perLeverancier(regels, leverancier).map(([lev, rs]) => <Fragment key={lev}>
    <GroepRij kolommen={winkel ? 4 : 3} naam={lev} aantal={rs.length} actie={winkel && !alleenLezen ? <Button variant="ghost" size="touch" className="-my-1 gap-1 px-2" onClick={() => onAllesGehaald(rs.map((s) => s.id))}><Check className="h-4 w-4" />Alles gehaald</Button> : undefined} />
    {rs.map((s) => <TableRow key={s.id} className={alleenLezen ? undefined : 'cursor-pointer'} onClick={() => !alleenLezen && onBewerk(s)}>
      <TableCell><div className="flex min-h-11 min-w-0 flex-col justify-center"><span className="min-w-0 line-clamp-2 break-words font-medium">{s.naam}</span></div></TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="inline-flex min-h-6 items-center justify-end gap-1.5"><span className="inline-flex items-center rounded-full bg-muted px-2 text-sm font-semibold">{Number(s.aantal)}</span>{s.eenheid && <span className="text-xs text-muted-foreground">{eenheidVorm(Number(s.aantal), s.eenheid)}</span>}</span></TableCell>
      {winkel && <TableCell className="!px-1 text-right align-middle" onClick={(e) => e.stopPropagation()}>{!alleenLezen && <Button variant="outline" size="touch" className="px-3" onClick={() => onGehaald(s)}>Gehaald</Button>}</TableCell>}
      <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}>{!alleenLezen && <Button type="button" variant="outline" size="touch" aria-label={`${s.naam} weg`} onClick={() => onVervallen(s)}>Weg</Button>}</TableCell>
    </TableRow>)}
  </Fragment>)}</TableBody>} />;
}
