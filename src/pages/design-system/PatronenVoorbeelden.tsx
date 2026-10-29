import { Fragment } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GroepRij, StatusDot } from '@/components/pura/patronen';

const rijen = [
  { lev: 'Boer & Chef', items: [['Tuinkers', '4 stuks', '€ 3,80'], ['Courgette', '5 stuks', '€ 3,20'], ['Aubergine', '1 doos', '']] },
  { lev: 'Bidfood', items: [['Vloerreiniger 5 L', '1 stuks', '€ 12,40']] },
];

function VoorbeeldTabel() {
  return <Table className="table-fixed [&_td]:px-2 [&_td]:py-0 [&_th]:h-9 [&_th]:px-2">
    <TableHeader><TableRow><TableHead className="w-14" /><TableHead>Product</TableHead><TableHead className="w-24 text-right">Aantal</TableHead><TableHead className="w-24 text-right">Prijs</TableHead><TableHead className="w-14" /></TableRow></TableHeader>
    <TableBody>{rijen.map((g) => <Fragment key={g.lev}>
      <GroepRij kolommen={5} naam={g.lev} aantal={g.items.length} totaal={g.lev === 'Bidfood' ? '€ 12,40' : '€ 7,00'} />
      {g.items.map(([n, a, p]) => <TableRow key={n}>
        <TableCell><span className="flex h-11 w-11 items-center justify-center"><Checkbox aria-label={n} /></span></TableCell>
        <TableCell className="truncate font-medium">{n}</TableCell>
        <TableCell className="text-right tabular-nums">{a}</TableCell>
        <TableCell className="text-right tabular-nums">{p || <StatusDot toon="let-op" verborgenLabel="Geen prijs" />}</TableCell>
        <TableCell><Button variant="ghost" className="h-11 w-11 p-0" aria-label="Opties"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
      </TableRow>)}
    </Fragment>)}</TableBody>
  </Table>;
}

function DoeNiet({ titel, doe, niet }: { titel: string; doe: React.ReactNode; niet: React.ReactNode }) {
  return <div className="space-y-2">
    <p className="text-sm font-semibold text-foreground">{titel}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 rounded-polar-md border border-border p-3"><StatusDot toon="goed" label="Doe" />{doe}</div>
      <div className="space-y-2 rounded-polar-md border border-border p-3"><StatusDot toon="fout" label="Niet" />{niet}</div>
    </div>
  </div>;
}

export function BasisVoorbeelden() {
  return <div className="space-y-6">
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Tekst: vier niveaus</p>
      <div className="space-y-1 rounded-polar-md border border-border p-3">
        <p className="text-lg font-semibold text-foreground">Paginatitel <span className="text-xs font-normal text-muted-foreground">alleen in de app-header</span></p>
        <p className="text-sm font-semibold text-foreground">Sectiekop <span className="text-xs font-normal text-muted-foreground">text-sm semibold</span></p>
        <p className="text-sm text-foreground">Rij <span className="text-xs text-muted-foreground">text-sm</span></p>
        <p className="text-xs text-muted-foreground">Meta <span>text-xs muted</span></p>
      </div>
    </div>
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Afstand</p>
      <div className="flex items-end gap-4">{[1, 2, 3, 4].map((n) => <div key={n} className="space-y-1 text-center"><div className="bg-primary/20" style={{ width: n * 16, height: n * 16 }} /><span className="text-xs text-muted-foreground">{n * 4}px</span></div>)}</div>
    </div>
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">Statuskleur</p>
      <div className="flex flex-wrap gap-4"><StatusDot toon="goed" label="goed" /><StatusDot toon="let-op" label="let op" /><StatusDot toon="fout" label="fout" /><StatusDot toon="neutraal" label="neutraal" /></div>
    </div>
  </div>;
}
