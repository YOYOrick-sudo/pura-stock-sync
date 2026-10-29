import type { ReactNode } from 'react';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CompacteTabel({ kinderen, onderweg = false, advies = false }: { kinderen: ReactNode; onderweg?: boolean; advies?: boolean }) {
  return <Table className="table-fixed [&_td]:px-2 [&_td]:py-0 [&_th]:px-2 [&_th]:h-9">
    <TableHeader><TableRow>
      {!advies && <TableHead className="w-12"><span className="sr-only">Status</span></TableHead>}
      <TableHead>Product</TableHead>
      <TableHead className="w-24 text-right">{advies ? 'Advies' : 'Aantal'}</TableHead>
      <TableHead className="hidden w-28 text-right sm:table-cell">{onderweg ? 'Leverdatum' : advies ? '' : 'Prijs'}</TableHead>
      <TableHead className="w-12"><span className="sr-only">Acties</span></TableHead>
    </TableRow></TableHeader>{kinderen}
  </Table>;
}