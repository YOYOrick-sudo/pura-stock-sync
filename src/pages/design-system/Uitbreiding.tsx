import { useState } from 'react';
import { ClipboardList, Info, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

export function StartSectie() {
  return <div className="grid gap-4 sm:grid-cols-3">
    {[
      ['1. Basis', 'components/ui (shadcn). Knop, invoer, tabel, tabs, badge.'],
      ['2. Patronen', 'components/pura. Kaartkop, lijstkaart, overzicht, invoerbalk, lade.'],
      ['3. Nooit', 'Eigen kleuren, losse afronding (rounded-[..]), components/polar voor nieuw werk.'],
    ].map(([t, d]) => <div key={t} className="space-y-1 rounded-polar-md border border-border p-4"><p className="text-sm font-semibold text-foreground">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>)}
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

function Paar({ titel, doe, niet }: { titel: string; doe: React.ReactNode; niet: React.ReactNode }) {
  return <div className="space-y-2">
    <p className="text-sm font-semibold text-foreground">{titel}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 rounded-polar-md border border-border p-3 text-sm"><StatusDot toon="goed" label="Doe" />{doe}</div>
      <div className="space-y-2 rounded-polar-md border border-border p-3 text-sm"><StatusDot toon="fout" label="Niet" />{niet}</div>
    </div>
  </div>;
}

export function ExtraRegels() {
  return <div className="space-y-6">
    <Paar titel="Tabel in een kaart" doe={<p>Lijstkaart met kaartkop.</p>} niet={<p>Tabel los op de grijze achtergrond.</p>} />
    <Paar titel="Status in eigen kolom" doe={<div className="flex justify-between"><span>Tuinkers</span><StatusDot toon="goed" label="besteld" /></div>} niet={<div>Tuinkers <Badge variant="secondary">besteld</Badge> naast de naam</div>} />
    <Paar titel="Uitleg achter i-icoon" doe={<p className="flex items-center gap-1">Vandaag <Info className="h-4 w-4 text-muted-foreground" /></p>} niet={<p>Een alinea uitleg boven de lijst.</p>} />
    <Paar titel="Bewerken in de lade" doe={<p>Tik op rij → lade.</p>} niet={<p>Losse 'Bewerk'-knop op elke rij.</p>} />
    <Paar titel="Laden, leeg, fout altijd zichtbaar" doe={<p>Skelet · "Niets onderweg." · fout + Opnieuw.</p>} niet={<p>Lege witte kaart of stille fout.</p>} />
    <Paar titel="Getallen rechts en gelijk breed" doe={<p className="text-right tabular-nums">12,40<br />3,80</p>} niet={<p>12,40<br />3,80 links uitgelijnd</p>} />
    <Paar titel="Nul- en klaar-regels ingeklapt" doe={<p>"Geleverd (12)" dicht.</p>} niet={<p>Twaalf grijze regels open onderaan.</p>} />
    <Paar titel="Tikdoel 44px" doe={<Button size="touch-icon" variant="ghost" aria-label="voorbeeld">✓</Button>} niet={<button className="h-6 w-6 rounded-full border border-border text-xs">✓</button>} />
    <Paar titel="Bevestigen alleen bij vernietigen" doe={<p>Archiveren → bevestigen.</p>} niet={<p>"Weet je het zeker?" bij opslaan.</p>} />
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

const lijst = [
  'Geen eigen H1; titel in de app-header',
  'Eén primaire knop per pagina',
  'Lijsten in een lijstkaart, kolomkoppen één keer',
  'Groepen als tussenrij, nul/klaar ingeklapt',
  'Max. één status per rij, in eigen kolom',
  'Elk getal één keer in beeld',
  'Laden, leeg en fout aanwezig',
  'Tikdoelen ≥ 44px, geen hover-only',
  'Alleen tokens: geen #hex, geen rounded-[..]',
  'Getest op 390, 820 en 1280 breed zonder zijwaarts scrollen',
];

export function Controlelijst() {
  return <ul className="grid gap-2 sm:grid-cols-2">{lijst.map((r) => <li key={r}><label className="flex min-h-11 items-center gap-3 rounded-polar-md border border-border px-3 text-sm"><Checkbox />{r}</label></li>)}</ul>;
}
