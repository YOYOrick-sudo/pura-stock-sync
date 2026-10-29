import { Fragment } from 'react';
import { AlertCircle, Building2, Calculator, Check, ClipboardList, MoreVertical, Sparkles, Truck, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GroepRij, Invoerbalk, Kengetal, LegeStaat, OverzichtKaart, SectieKop, StatusDot, segmentTabsKlasse } from './Paginapatronen';

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

export function PaginapatroonVoorbeelden() {
  return <div className="space-y-8">
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Paginaopbouw: tabs + één primaire knop, lijst links, overzicht rechts</p>
      <Tabs defaultValue="bord">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className={segmentTabsKlasse}>
            {[['bord', ClipboardList, 18], ['advies', Sparkles, 3], ['tellen', Calculator, 3], ['onderweg', Truck, 1]].map(([id, I, n]) => { const Icoon = I as typeof Truck; return <TabsTrigger key={id as string} value={id as string}><Icoon className="h-4 w-4" /><span className="hidden sm:inline capitalize">{id as string}</span><span className="tabular-nums text-muted-foreground">{n as number}</span></TabsTrigger>; })}
          </TabsList>
          <Button className="min-h-11 gap-1"><Plus className="h-4 w-4" />Product</Button>
        </div>
      </Tabs>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <Invoerbalk>
            <Input placeholder="Wat is op?" className="h-11 min-w-0 flex-1 basis-full sm:basis-auto" />
            <Button variant="ghost" className="h-11 w-11 p-0" aria-label="Minder"><Minus className="h-4 w-4" /></Button>
            <span className="w-8 text-center font-semibold tabular-nums">1</span>
            <Button variant="ghost" className="h-11 w-11 p-0" aria-label="Meer"><Plus className="h-4 w-4" /></Button>
            <Button variant="secondary" className="ml-auto h-11 w-11 p-0" aria-label="Erbij"><Check className="h-4 w-4" /></Button>
          </Invoerbalk>
          <VoorbeeldTabel />
        </div>
        <OverzichtKaart kengetallen={<><Kengetal icoon={Building2} label="Open" waarde="€ 184" /><Kengetal icoon={Truck} label="Checken" waarde={1} /><Kengetal icoon={AlertCircle} label="Geen prijs" waarde={4} toon="let-op" /></>} />
      </div>
    </div>
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-2"><p className="text-sm font-semibold text-foreground">Sectiekop</p><SectieKop titel="Vandaag te checken" teller={3} /></div>
      <div className="space-y-2"><p className="text-sm font-semibold text-foreground">Lege staat</p><div className="rounded-polar-md border border-border"><LegeStaat tekst="Niets onderweg." /></div></div>
    </div>
  </div>;
}

export function RegelVoorbeelden() {
  return <div className="space-y-6">
    <DoeNiet titel="Kolomkoppen één keer" doe={<p className="text-sm">Eén tabel, leveranciers als tussenrij.</p>} niet={<p className="text-sm">Per groep opnieuw "Product · Aantal · Prijs".</p>} />
    <DoeNiet titel="Hooguit één status per rij" doe={<div className="flex items-center justify-between text-sm"><span>Courgette</span><StatusDot toon="let-op" label="tellen" /></div>} niet={<div className="flex items-center justify-between gap-1 text-sm"><span>Courgette</span><span className="flex gap-1"><Badge variant="warning">tellen</Badge><Badge variant="secondary">onzeker</Badge><Badge>nieuw</Badge></span></div>} />
    <DoeNiet titel="Elk getal één keer in beeld" doe={<p className="text-sm">18 alleen in de tab.</p>} niet={<p className="text-sm">18 in de tab én in een kaart ernaast.</p>} />
    <DoeNiet titel="Alleen tokens" doe={<p className="text-sm"><code>text-warning</code>, <code>bg-muted</code></p>} niet={<p className="flex items-center gap-1 text-sm"><X className="h-4 w-4" /><code>text-[#e85d3a]</code>, <code>bg-yellow-100</code></p>} />
    <DoeNiet titel="Eén primaire knop" doe={<Button size="sm">Product</Button>} niet={<div className="flex gap-1"><Button size="sm">Erbij</Button><Button size="sm">Opslaan</Button><Button size="sm">Product</Button></div>} />
  </div>;
}
