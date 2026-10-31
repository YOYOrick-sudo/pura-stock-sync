import { ChefHat, Hourglass, Info } from 'lucide-react';
import { kaartRandKlasse } from '@/components/pura';
import { KaartKop, LaadRijen, LijstKaart } from '@/components/pura/patronen';
import { EmptyState } from '@/components/pura/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { KeukenAdviesRegel } from '@/hooks/useOntvangstV2';
import { formatTelHoeveelheid, type TelInfo } from '@/lib/ontvangstV2';

const STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  advies: { label: 'Advies', variant: 'success' },
  gedeeltelijk: { label: 'Deels', variant: 'warning' },
  geen_advies: { label: 'Geen advies', variant: 'secondary' },
};

/** 8.2 Advies keuken: alleen lezen. */
export function KeukenAdviesTabel({ regels, laden, telinfo }: { regels: KeukenAdviesRegel[]; laden: boolean; telinfo?: Record<string, TelInfo> }) {
  return <LijstKaart kop={<KaartKop icoon={ChefHat} titel="Advies keuken" teller={regels.length || undefined} />}>
    {laden ? <LaadRijen /> : !regels.length ? <EmptyState icon={ChefHat} title="Geen advies" description="" className="border-0 shadow-none" /> :
      <div className="overflow-x-auto">
        <Table className={`[&_td]:whitespace-nowrap [&_td]:px-2 [&_td]:py-1 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs ${kaartRandKlasse}`}>
          <TableHeader><TableRow>
            <TableHead className="sticky left-0 bg-card">Product</TableHead>
            <TableHead className="text-right">Stand</TableHead>
            <TableHead className="text-right">Onderweg</TableHead>
            <TableHead className="text-right">Nodig</TableHead>
            <TableHead className="text-right">Advies</TableHead>
            <TableHead><span className="sr-only">Status</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>{regels.map((r) => {
            const restant = Number(r.onderweg_restant ?? 0);
            const info = telinfo?.[r.telartikel_id] ?? { tel_label: null, tel_factor: 1, basis_eenheid: r.basis_eenheid };
            return <TableRow key={r.telartikel_id}>
              <TableCell className="sticky left-0 max-w-[10rem] bg-card"><div className="flex min-h-11 flex-col justify-center"><span className="truncate font-medium">{r.naam}</span>{r.leverancier_naam && <span className="truncate text-xs text-muted-foreground">{r.leverancier_naam}</span>}</div></TableCell>
              <TableCell className="text-right tabular-nums">{formatTelHoeveelheid(r.stand, info) ?? '—'}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums"><span className="inline-flex items-center gap-1">{formatTelHoeveelheid(Number(r.onderweg_op_tijd ?? 0) + restant, info) ?? '—'}{restant > 0 && <Hourglass className="h-4 w-4 text-muted-foreground" aria-label="wordt nageleverd" />}</span></TableCell>
              <TableCell className="text-right tabular-nums">{formatTelHoeveelheid(r.behoefte, info) ?? '—'}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{r.advies_vormen == null ? '—' : <span className="inline-flex items-center gap-1.5"><span className="rounded-full bg-muted px-2 text-sm font-semibold">{r.advies_vormen}</span>{r.vorm && <span className="text-xs text-muted-foreground">{r.vorm}</span>}{r.inhoud_vorm != null && r.inhoud_vorm > 0 && <span className="text-xs text-muted-foreground">({formatTelHoeveelheid(r.advies_vormen * r.inhoud_vorm, { tel_label: null, tel_factor: 1, basis_eenheid: r.basis_eenheid })})</span>}</span>}</TableCell>
              <TableCell><div className="flex items-center justify-end gap-1">
                {r.status && <Badge variant={STATUS[r.status]?.variant ?? 'secondary'}>{STATUS[r.status]?.label ?? r.status}</Badge>}
                {r.reden && <Popover><PopoverTrigger asChild><Button variant="ghost" size="touch-icon" aria-label={`Reden voor ${r.naam}`}><Info className="h-4 w-4 text-muted-foreground" /></Button></PopoverTrigger><PopoverContent className="max-w-xs text-sm">{r.reden}</PopoverContent></Popover>}
              </div></TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
      </div>}
  </LijstKaart>;
}
