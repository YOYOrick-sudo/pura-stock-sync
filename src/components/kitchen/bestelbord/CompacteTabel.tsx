import type { ReactNode } from 'react';
import { kaartRandKlasse } from '@/components/pura';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** Eén rij-opbouw voor bord, onderweg en advies: vink links, naam vult, aantal/prijs/menu vast rechts. Kolombreedtes via colgroup, zodat de verborgen kop niets verschuift. */
export function CompacteTabel({ kinderen, onderweg = false, advies = false, vinkKop, zonderKop = false, smal = false }: { kinderen: ReactNode; onderweg?: boolean; advies?: boolean; vinkKop?: string; zonderKop?: boolean; smal?: boolean }) {
  return <Table className={`table-fixed [&_td]:px-2 [&_td]:py-1 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs ${kaartRandKlasse}`}>
    <colgroup>
      {!advies && <col className={smal ? 'w-8' : 'w-14'} />}
      <col />
      <col className={smal ? 'w-20 sm:w-28' : 'w-24 sm:w-28'} />
      <col className={advies ? 'w-12' : 'w-0 sm:w-28'} />
      <col className={advies ? 'w-24' : 'w-12'} />
    </colgroup>
    {!zonderKop && <TableHeader><TableRow>
      {!advies && <TableHead className="text-center">{vinkKop ?? <span className="sr-only">Status</span>}</TableHead>}
      <TableHead>Product</TableHead>
      <TableHead className="text-right">{advies ? 'Advies' : 'Aantal'}</TableHead>
      <TableHead className={advies ? undefined : '!px-0 text-right sm:!px-2'}>{advies ? <span className="sr-only">Toelichting</span> : <span className="hidden sm:inline">{onderweg ? 'Leverdatum' : 'Prijs'}</span>}</TableHead>
      <TableHead><span className="sr-only">Acties</span></TableHead>
    </TableRow></TableHeader>}{kinderen}
  </Table>;
}
