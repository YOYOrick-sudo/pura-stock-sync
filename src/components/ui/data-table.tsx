import * as React from 'react';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/** Standaard tabel uit het design system: rustige kop, vaste rijhoogte, dunne lijnen. */
export function DataTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-hidden rounded-polar-lg border border-border bg-card', className)}>
      <Table className="table-fixed">{children}</Table>
    </div>
  );
}

export function DataTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50 hover:bg-muted/50">{children}</TableRow>
    </TableHeader>
  );
}

export const DataTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <TableHead ref={ref} className={cn('h-11 text-sm font-medium normal-case text-muted-foreground', className)} {...props} />
  ),
);
DataTableHead.displayName = 'DataTableHead';

export const DataTableBody = TableBody;

export const DataTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => <TableRow ref={ref} className={cn('h-14 hover:bg-muted/30', className)} {...props} />,
);
DataTableRow.displayName = 'DataTableRow';

export const DataTableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <TableCell ref={ref} className={cn('py-2 align-middle', className)} {...props} />,
);
DataTableCell.displayName = 'DataTableCell';

/** Lege cel: altijd een grijs streepje. */
export function EmptyCell() {
  return <span className="text-muted-foreground">—</span>;
}

/** Status als gekleurde stip + korte tekst. */
export function StatusDot({ tone = 'warning', children }: { tone?: 'warning' | 'success' | 'muted' | 'destructive'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium',
        tone === 'warning' && 'text-warning',
        tone === 'success' && 'text-primary',
        tone === 'muted' && 'text-muted-foreground',
        tone === 'destructive' && 'text-destructive',
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
