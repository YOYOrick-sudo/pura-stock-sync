import { eenheidVorm } from '@/lib/hoeveelheid';
import { Fragment } from 'react';
import { AlertCircle, Check, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import { RijMenu, RijMeta, StatusLabel } from '@/components/pura/lijst';
import { CompacteTabel } from './CompacteTabel';
import { RegelInfo } from './RegelInfo';
import type { BordRegelInfo } from '@/hooks/useBestelbord';

export interface OnderwegGroep {
  key: string;
  titel: string;
  referentie: string | null;
  besteldag: string | null;
  leverdatum: string | null;
  laatLabel: string | null;
  totaal: string | null;
  regels: BestelSignaal[];
}

export function OnderwegTabel({ groepen, regelInfo, dagenTeLaatVan, onAllesGeleverd, onGeleverd, onDatum, onNietGeleverd, onDeelsGeleverd, onTerugBord, onBewerk, leverDatumLabel, restStatus, zonderDeels = false, alleenLezen = false }: {
  groepen: OnderwegGroep[]; dagenTeLaatVan: (s: BestelSignaal) => number;
  onAllesGeleverd: (ids: string[]) => void; onGeleverd: (s: BestelSignaal) => void;
  onDatum: (s: BestelSignaal) => void; onNietGeleverd: (s: BestelSignaal) => void; onDeelsGeleverd: (s: BestelSignaal) => void;
  onTerugBord: (s: BestelSignaal) => void;
  onBewerk: (s: BestelSignaal) => void; leverDatumLabel: (d: string | null) => string;
  regelInfo?: (s: BestelSignaal) => BordRegelInfo | undefined;
  restStatus?: (s: BestelSignaal) => 'nageleverd' | 'mist' | null;
  zonderDeels?: boolean; alleenLezen?: boolean;
}) {
  return <CompacteTabel zonderKop onderweg vinkKop="Binnen" kinderen={<TableBody>{groepen.map(({ key, titel, referentie, besteldag, leverdatum, laatLabel, totaal, regels }) => {
    const meta = [leverdatum ? leverDatumLabel(leverdatum) : null, !referentie && besteldag ? `besteld ${leverDatumLabel(besteldag)}` : null].filter(Boolean).join(' · ');
    const gedimd = titel === 'Leverancier onbekend';
    return <Fragment key={key}>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell className="!px-0" />
        <TableCell className="py-2">
          <div className={`flex min-h-11 flex-wrap items-center justify-between gap-2 text-sm ${gedimd ? 'text-muted-foreground' : 'text-foreground'}`}>
            <span className="flex min-w-0 flex-col justify-center">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-semibold">{titel}</span>
                {referentie && <span className="truncate font-normal text-muted-foreground">{referentie}</span>}
                {laatLabel && <Badge variant="warning" className="shrink-0 font-medium">{laatLabel}</Badge>}
                <span className="shrink-0 tabular-nums font-normal text-muted-foreground">{regels.length}</span>
              </span>
              {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
              {totaal != null && <span className="text-xs font-medium tabular-nums sm:hidden">{totaal}</span>}
            </span>
            {!alleenLezen && <Button type="button" variant="ghost" size="touch" className="shrink-0 gap-1 px-2" onClick={() => onAllesGeleverd(regels.map((s) => s.id))}><Check className="h-4 w-4" />Alles geleverd</Button>}
          </div>
        </TableCell>
        <TableCell className="py-0" />
        <TableCell className="!px-0 py-0 text-right sm:!px-2">{totaal != null && <div className="hidden font-medium tabular-nums sm:block">{totaal}</div>}</TableCell>
        <TableCell className="py-0" />
      </TableRow>
      {regels.map((s) => {
        const laat = dagenTeLaatVan(s);
        return <TableRow key={s.id} className={alleenLezen ? undefined : 'cursor-pointer'} onClick={() => !alleenLezen && onBewerk(s)}>
          <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}><label className="mx-auto flex h-11 w-11 cursor-pointer items-center justify-center"><Checkbox disabled={alleenLezen} aria-label={`${s.naam} geleverd`} checked={false} onCheckedChange={() => onGeleverd(s)} /></label></TableCell>
          <TableCell><div className="flex min-h-11 min-w-0 flex-col justify-center">
            <span className="min-w-0 line-clamp-2 break-words font-medium">{s.naam}</span>
            {restStatus?.(s) === 'nageleverd' && <RijMeta altijd><Hourglass className="h-4 w-4" aria-hidden /><Badge variant="info">al besteld, wordt nageleverd</Badge></RijMeta>}{restStatus?.(s) === 'mist' && <RijMeta altijd><AlertCircle className="h-4 w-4 text-warning" aria-hidden /><Badge variant="warning">mist</Badge></RijMeta>}
            <RegelInfo info={regelInfo?.(s)} />
            {(laat > 0 || s.verwachte_levering) && <RijMeta altijd={laat > 0}>{laat > 0 && <StatusLabel toon="fout">{laat}d te laat</StatusLabel>}{s.verwachte_levering && <span className="sm:hidden">{leverDatumLabel(s.verwachte_levering)}</span>}</RijMeta>}
          </div></TableCell>
          <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="inline-flex min-h-6 items-center justify-end gap-1.5"><span className="inline-flex items-center rounded-full bg-muted px-2 text-sm font-semibold">{Number(s.aantal)}</span>{s.eenheid && <span className="text-xs text-muted-foreground">{eenheidVorm(Number(s.aantal), s.eenheid)}</span>}</span></TableCell>
          <TableCell className="!px-0 text-right text-muted-foreground sm:!px-2"><span className="hidden sm:inline">{s.verwachte_levering ? leverDatumLabel(s.verwachte_levering) : ''}</span></TableCell>
          <TableCell className="!px-0" onClick={(e) => e.stopPropagation()}>{!alleenLezen && <RijMenu naam={s.naam} acties={[{ label: 'Bewerken', onClick: () => onBewerk(s) }, { label: 'Leverdatum aanpassen', onClick: () => onDatum(s) }, { label: 'Terug op het bord', onClick: () => onTerugBord(s) }, ...(zonderDeels ? [] : [{ label: 'Deels geleverd', onClick: () => onDeelsGeleverd(s) }]), { label: 'Niet geleverd', onClick: () => onNietGeleverd(s), gevaar: true }]} />}</TableCell>
        </TableRow>;
      })}
    </Fragment>;
  })}</TableBody>} />;
}
