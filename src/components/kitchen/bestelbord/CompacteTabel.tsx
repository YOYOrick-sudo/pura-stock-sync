import type { ReactNode } from 'react';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** Eén tabelkop voor bord, onderweg en advies. Op telefoon blijven vinkje, product, aantal en menu. */
export function CompacteTabel({ kinderen, onderweg = false, advies = false, vinkKop }: { kinderen: ReactNode; onderweg?: boolean; advies?: boolean; vinkKop?: string }) {
  return <Table className="table-fixed [&_td]:px-2 [&_td]:py-1 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs">
    <TableHeader><TableRow>
      {!advies && <TableHead className="w-16 text-center">{vinkKop ?? <span className="sr-only">Status</span>}</TableHead>}
      <TableHead>Product</TableHead>
      <TableHead className="w-20 text-right sm:w-24">{advies ? 'Advies' : 'Aantal'}</TableHead>
      <TableHead className={advies ? 'w-12' : 'w-0 !px-0 text-right sm:w-28 sm:!px-2'}>{advies ? <span className="sr-only">Toelichting</span> : <span className="hidden sm:inline">{onderweg ? 'Leverdatum' : 'Prijs'}</span>}</TableHead>
      <TableHead className={advies ? 'w-24' : 'w-12'}><span className="sr-only">Acties</span></TableHead>
    </TableRow></TableHeader>{kinderen}
  </Table>;
}
