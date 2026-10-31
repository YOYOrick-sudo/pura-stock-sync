import { Fragment } from 'react';
import { AlertCircle, Check, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import { GroepRij } from '@/components/pura/patronen';
import { RijMenu, RijMeta, StatusLabel } from '@/components/pura/lijst';
import { CompacteTabel } from './CompacteTabel';
import { DeadlineNaam } from './DeadlineNaam';
import { RegelInfo } from './RegelInfo';
import type { BordRegelInfo } from '@/hooks/useBestelbord';

export function OnderwegTabel({ groepen, regelInfo, deadlineHint, dagenTeLaatVan, onAllesGeleverd, onGeleverd, onDatum, onNietGeleverd, onDeelsGeleverd, onBewerk, datumLabel, leverDatumLabel, restStatus, zonderDeels = false, alleenLezen = false }: {
  groepen: { key: string; titel: string; regels: BestelSignaal[] }[]; dagenTeLaatVan: (s: BestelSignaal) => number;
  deadlineHint: (s: BestelSignaal) => string | null;
  onAllesGeleverd: (ids: string[]) => void; onGeleverd: (s: BestelSignaal) => void;
  onDatum: (s: BestelSignaal) => void; onNietGeleverd: (s: BestelSignaal) => void; onDeelsGeleverd: (s: BestelSignaal) => void;
  onBewerk: (s: BestelSignaal) => void; datumLabel: (d: string) => string; leverDatumLabel: (d: string | null) => string;
  regelInfo?: (s: BestelSignaal) => BordRegelInfo | undefined;
  restStatus?: (s: BestelSignaal) => 'nageleverd' | 'mist' | null;
  zonderDeels?: boolean; alleenLezen?: boolean;
}) {
  return <CompacteTabel zonderKop onderweg vinkKop="Binnen" kinderen={<TableBody>{groepen.map(({ key, titel, regels }) => {
    const besteldOp = regels[0]?.besteld_op;
    return <Fragment key={key}>
      <GroepRij kolommen={5} naam={<><DeadlineNaam naam={titel} hint={regels[0] ? deadlineHint(regels[0]) : null} />{besteldOp ? ` · ${datumLabel(besteldOp)}` : ''}</>} gedimd={titel === 'Leverancier onbekend'} actie={alleenLezen ? undefined : <Button variant="ghost" size="touch" className="-my-1 gap-1 px-2" onClick={() => onAllesGeleverd(regels.map((s) => s.id))}><Check className="h-4 w-4" />Alles geleverd</Button>} />
      {regels.map((s) => {
        const laat = dagenTeLaatVan(s);
        return <TableRow key={s.id} className={alleenLezen ? undefined : 'cursor-pointer'} onClick={() => !alleenLezen && onBewerk(s)}>
          <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}><label className="mx-auto flex h-11 w-11 cursor-pointer items-center justify-center"><Checkbox disabled={alleenLezen} aria-label={`${s.naam} geleverd`} checked={false} onCheckedChange={() => onGeleverd(s)} /></label></TableCell>
          <TableCell><div className="flex min-h-11 min-w-0 flex-col justify-center">
            <span className="truncate font-medium">{s.naam}</span>
            {restStatus?.(s) === 'nageleverd' && <RijMeta altijd><Hourglass className="h-4 w-4" aria-hidden /><Badge variant="info">al besteld, wordt nageleverd</Badge></RijMeta>}{restStatus?.(s) === 'mist' && <RijMeta altijd><AlertCircle className="h-4 w-4 text-warning" aria-hidden /><Badge variant="warning">mist</Badge></RijMeta>}
            <RegelInfo info={regelInfo?.(s)} />
            {(laat > 0 || s.verwachte_levering) && <RijMeta altijd={laat > 0}>{laat > 0 && <StatusLabel toon="fout">{laat}d te laat</StatusLabel>}{s.verwachte_levering && <span className="sm:hidden">{leverDatumLabel(s.verwachte_levering)}</span>}</RijMeta>}
          </div></TableCell>
          <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="inline-flex min-h-6 items-center justify-end gap-1.5"><span className="inline-flex items-center rounded-full bg-muted px-2 text-sm font-semibold">{Number(s.aantal)}</span>{s.eenheid && <span className="text-xs text-muted-foreground">{s.eenheid}</span>}</span></TableCell>
          <TableCell className="!px-0 text-right text-muted-foreground sm:!px-2"><span className="hidden sm:inline">{s.verwachte_levering ? leverDatumLabel(s.verwachte_levering) : ''}</span></TableCell>
          <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}>{!alleenLezen && <RijMenu naam={s.naam} acties={[{ label: 'Bewerken', onClick: () => onBewerk(s) }, { label: 'Leverdatum aanpassen', onClick: () => onDatum(s) }, ...(zonderDeels ? [] : [{ label: 'Deels geleverd', onClick: () => onDeelsGeleverd(s) }]), { label: 'Niet geleverd', onClick: () => onNietGeleverd(s), gevaar: true }]} />}</TableCell>
        </TableRow>;
      })}
    </Fragment>;
  })}</TableBody>} />;
}
