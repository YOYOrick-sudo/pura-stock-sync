import { useState } from 'react';
import { ClipboardList, Info, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Bevestig, DetailLade, FilterBalk, FormSectie, FoutRegel, InklapGroep, KaartKop, LaadRijen, LegeStaat, LijstKaart, StatusDot } from '@/components/pura/patronen';

function Blok({ titel, wanneer, children }: { titel: string; wanneer: string; children: React.ReactNode }) {
  return <div className="space-y-3">
    <div><p className="text-sm font-semibold text-foreground">{titel}</p><p className="text-xs text-muted-foreground">{wanneer}</p></div>
    {children}
  </div>;
}

export function MatenSectie() {
  return <div className="space-y-6">
    <Blok titel="Hoogte bediening" wanneer="Tikken met natte handen: minimaal 44px.">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 text-center"><Button size="touch">Touch 44</Button><p className="text-xs text-muted-foreground">size="touch"</p></div>
        <div className="space-y-1 text-center"><Button>Standaard 48</Button><p className="text-xs text-muted-foreground">default</p></div>
        <div className="space-y-1 text-center"><div className="flex h-12 w-40 items-center rounded-polar-md border border-border px-3 text-sm">Rij 48</div><p className="text-xs text-muted-foreground">tabelrij</p></div>
      </div>
    </Blok>
    <Blok titel="Afronding" wanneer="Bestaande tokens; geen losse pixelwaarden.">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {[['rounded-polar-lg', 'kaart, knop, invoer'], ['rounded-polar-md', 'binnenvlak'], ['rounded-polar-2xl', 'dialog, lade'], ['rounded-full', 'stip, badge']].map(([k, d]) => <div key={k} className="space-y-1 text-center"><div className={`h-14 w-24 border border-border bg-muted ${k}`} /><p><code>{k.replace('rounded-', '')}</code></p><p>{d}</p></div>)}
      </div>
    </Blok>
    <Blok titel="Iconen" wanneer="16 in knop en rij · 20 in kaartkop · 24 alleen bij groot kengetal.">
      <div className="flex items-end gap-6 text-muted-foreground"><ClipboardList className="h-4 w-4" /><ClipboardList className="h-5 w-5" /><ClipboardList className="h-6 w-6" /></div>
    </Blok>
  </div>;
}

const demo = [['Tuinkers', '4 stuks', 'besteld'], ['Courgette', '5 stuks', 'open'], ['Bloemkool', '2 stuks', 'open']];

export function PatronenCompleet() {
  const [lade, setLade] = useState(false);
  const [bevestig, setBevestig] = useState(false);
  return <div className="space-y-8">
    <Blok titel="Lijstkaart met kaartkop en voetregel" wanneer="Elke lijst. Tabel van rand tot rand, status in eigen kolom.">
      <LijstKaart kop={<KaartKop icoon={Truck} titel="Onderweg" teller={3} rechts={<Button variant="ghost" size="sm">Alles geleverd</Button>} />} voet="3 van 3">
        <Table className="[&_td]:py-0"><TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Aantal</TableHead><TableHead className="w-28">Status</TableHead></TableRow></TableHeader>
          <TableBody>{demo.map(([n, a, s]) => <TableRow key={n} className="h-12 cursor-pointer" onClick={() => setLade(true)}><TableCell className="font-medium">{n}</TableCell><TableCell className="text-right tabular-nums">{a}</TableCell><TableCell><StatusDot toon={s === 'besteld' ? 'goed' : 'neutraal'} label={s} /></TableCell></TableRow>)}</TableBody></Table>
      </LijstKaart>
    </Blok>
    <div className="grid gap-6 lg:grid-cols-3">
      <Blok titel="Laden" wanneer="Skelet in rijhoogte, nooit alleen 'Laden…'."><LijstKaart><LaadRijen /></LijstKaart></Blok>
      <Blok titel="Fout" wanneer="Altijd zichtbaar, met één herstelactie."><LijstKaart><FoutRegel onOpnieuw={() => toast('Opnieuw geladen')} /></LijstKaart></Blok>
      <Blok titel="Leeg" wanneer="Eén korte zin, geen icoon-tegel in een lijst."><LijstKaart><LegeStaat tekst="Niets onderweg." /></LijstKaart></Blok>
    </div>
    <Blok titel="Filterbalk" wanneer="Boven een lange lijst. Max. twee filters, één actie.">
      <FilterBalk
        zoek={<div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Zoeken" className="h-11 pl-9" /></div>}
        filters={<Select defaultValue="alle"><SelectTrigger className="h-11 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="alle">Alle</SelectItem><SelectItem value="open">Open</SelectItem></SelectContent></Select>}
        actie={<Button size="touch" variant="outline">Exporteren</Button>}
      />
    </Blok>
    <Blok titel="Inklapgroep" wanneer="Geleverd, Niet nodig, Overige: standaard dicht.">
      <InklapGroep titel="Geleverd" aantal={12}><LijstKaart><LegeStaat tekst="(inhoud)" /></LijstKaart></InklapGroep>
    </Blok>
    <div className="grid gap-6 sm:grid-cols-2">
      <Blok titel="Detaillade" wanneer="Tik op een rij: details en bewerken. Rechts op iPad, onder op telefoon.">
        <Button size="touch" variant="outline" onClick={() => setLade(true)}>Open lade</Button>
      </Blok>
      <Blok titel="Bevestigen" wanneer="Alleen bij verwijderen of archiveren.">
        <Button size="touch" variant="outline" onClick={() => setBevestig(true)}>Archiveren…</Button>
      </Blok>
      <Blok titel="Melding na actie" wanneer="Kort, verleden tijd, ongedaan maken waar het kan.">
        <Button size="touch" variant="outline" onClick={() => toast('Opgeslagen', { action: { label: 'Ongedaan maken', onClick: () => undefined } })}>Toon melding</Button>
      </Blok>
    </div>
    <DetailLade open={lade} onOpenChange={setLade} titel="Courgette" voet={<Button size="touch" onClick={() => { setLade(false); toast('Opgeslagen'); }}>Opslaan</Button>}>
      <FormSectie titel="Bestelling" info={<Info className="h-4 w-4 text-muted-foreground" />}>
        <div className="space-y-1"><Label htmlFor="ds-aantal">Aantal</Label><Input id="ds-aantal" defaultValue="5" inputMode="decimal" className="h-11" /></div>
        <div className="space-y-1"><Label>Eenheid</Label><Select defaultValue="stuks"><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="stuks">stuks</SelectItem><SelectItem value="doos">doos</SelectItem></SelectContent></Select></div>
      </FormSectie>
      <FormSectie titel="Levering"><label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox />Deels geleverd</label></FormSectie>
    </DetailLade>
    <Bevestig open={bevestig} onOpenChange={setBevestig} titel="Regel archiveren?" tekst="Hij blijft in de historie staan." actie="Archiveren" onBevestig={() => toast('Gearchiveerd')} />
  </div>;
}

export function TekstToon() {
  return <div className="grid gap-4 sm:grid-cols-3">
    {[
      ['Knoppen', 'Werkwoord, kort: "Opslaan", "Op bord", "Alles geleverd". Geen "Klik hier".'],
      ['Meldingen', 'Verleden tijd, één woord of zin: "Opgeslagen", "Op bord gezet". Fout: wat en wat nu.'],
      ['Leeg', 'Feitelijk en rustig: "Niets onderweg." Geen uitroeptekens of emoji.'],
    ].map(([t, d]) => <div key={t} className="space-y-1 rounded-polar-md border border-border p-4"><p className="text-sm font-semibold text-foreground">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>)}
  </div>;
}
