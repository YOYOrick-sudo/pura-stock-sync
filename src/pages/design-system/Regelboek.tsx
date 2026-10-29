import { Fragment, useState } from 'react';
import { ClipboardList, Info, LayoutDashboard, ListChecks, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GroepRij, KaartKop, LijstKaart, StatusDot, segmentTabsKlasse } from '@/components/pura/patronen';
import { PaginaBalk, RijMenu, RijMeta, StatusLabel, TabelVoet, ZoekVeld } from '@/components/pura/lijst';
import { FormKaart, GenummerdeStap, InstellingRij, KengetalVerdeling, Stappen } from '@/components/pura/blokken';

/* ===================== Start: welk type pagina? ===================== */

const TYPES = [
  { id: 'lijst', icoon: ClipboardList, naam: 'Lijstpagina', voorbeeld: 'Bestellijst, Ingrediënten, Sollicitanten', blokken: 'PaginaBalk · LijstKaart · GroepRij · RijMenu · StatusLabel · TabelVoet · DetailLade' },
  { id: 'werk', icoon: ListChecks, naam: 'Werklijst (afvinken)', voorbeeld: 'Taken, MEP, Tellen', blokken: 'Tabs · LijstKaart · vinkje links · InklapGroep "Klaar"' },
  { id: 'beheer', icoon: Settings, naam: 'Instellingen / beheer', voorbeeld: 'Instellingen, templates, rollen', blokken: 'InstellingRij · FormKaart · Bevestig' },
  { id: 'overzicht', icoon: LayoutDashboard, naam: 'Overzicht', voorbeeld: 'Dashboard, Cijfers', blokken: 'KengetalVerdeling · LijstKaart (max 5 rijen) · link naar module' },
];

export function StartKeuze() {
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Kies eerst welk type pagina je bouwt. Elk type heeft één recept hieronder.</p>
    <div className="grid gap-4 sm:grid-cols-2">{TYPES.map(({ id, icoon: I, naam, voorbeeld, blokken }) => <a key={id} href={`#recept-${id}`} className="space-y-2 rounded-polar-md border border-border p-4 transition-colors hover:bg-muted/50">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><I className="h-5 w-5 text-primary" />{naam}</p>
      <p className="text-xs text-muted-foreground">{voorbeeld}</p>
      <p className="text-xs text-foreground">{blokken}</p>
    </a>)}</div>
    <div className="grid gap-4 sm:grid-cols-3">
      {[['Basis', 'components/ui (shadcn): knop, invoer, tabel, tabs, badge.'], ['Bouwblokken', 'components/pura: alles op deze pagina. Altijd eerst hier zoeken.'], ['Nooit', 'Eigen kleuren, rounded-[..], components/polar, eigen H1, hover-only uitleg.']].map(([t, d]) => <div key={t} className="space-y-1 rounded-polar-md bg-muted/50 p-4"><p className="text-sm font-semibold text-foreground">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>)}
    </div>
  </div>;
}

/* ===================== Recepten ===================== */

function Recept({ id, titel, opbouw, children }: { id: string; titel: string; opbouw: string[]; children: React.ReactNode }) {
  return <div id={`recept-${id}`} className="scroll-mt-24 space-y-3">
    <p className="text-sm font-semibold text-foreground">{titel}</p>
    <ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">{opbouw.map((o, i) => <li key={o} className="rounded-full bg-muted px-2 py-1">{i + 1}. {o}</li>)}</ol>
    <div className="rounded-polar-md bg-background p-4">{children}</div>
  </div>;
}

const rijen = [
  { lev: 'Bidfood', items: [['Tuinkers', '4', 'bak', '€ 12,40', 0], ['Courgette', '5', 'kg', '€ 9,75', 2]] },
  { lev: 'Boer & Chef', items: [['Bloemkool', '2', 'stuks', '', 0]] },
] as const;

export function Recepten() {
  const [aan, setAan] = useState(true);
  return <div className="space-y-10">
    <Recept id="lijst" titel="Lijstpagina" opbouw={['Paginabalk: tabs links, één primaire knop rechts', 'Lijstkaart met kop', 'Kolomkoppen één keer', 'Groepen als tussenrij', 'Voetregel met totaal', 'Rij tikken = lade, rest in …']}>
      <div className="space-y-4">
        <PaginaBalk links={<Tabs defaultValue="a"><TabsList className={segmentTabsKlasse}><TabsTrigger value="a">Op het bord <span className="tabular-nums text-muted-foreground">3</span></TabsTrigger><TabsTrigger value="b">Onderweg</TabsTrigger></TabsList></Tabs>} actie={<Button size="touch" className="gap-1"><Plus className="h-4 w-4" />Product</Button>} />
        <LijstKaart kop={<KaartKop icoon={ClipboardList} titel="Op het bord" />}>
          <Table className="table-fixed [&_td]:px-2 [&_td]:py-1 [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs">
            <TableHeader><TableRow><TableHead className="w-12 text-center">Besteld</TableHead><TableHead>Product</TableHead><TableHead className="w-20 text-right sm:w-24">Aantal</TableHead><TableHead className="hidden w-28 text-right sm:table-cell">Prijs</TableHead><TableHead className="w-12"><span className="sr-only">Acties</span></TableHead></TableRow></TableHeader>
            <TableBody>{rijen.map((g) => <Fragment key={g.lev}>
              <GroepRij kolommen={5} naam={g.lev} aantal={g.items.length} />
              {g.items.map(([n, a, e, p, laat]) => <TableRow key={n} className="cursor-pointer" onClick={() => toast(`${n}: lade opent`)}>
                <TableCell className="!px-0" onClick={(ev) => ev.stopPropagation()}><label className="mx-auto flex h-11 w-11 items-center justify-center"><Checkbox aria-label={`${n} besteld`} /></label></TableCell>
                <TableCell><div className="flex min-h-11 flex-col justify-center"><span className="truncate font-medium">{n}</span><RijMeta altijd={laat > 0}>{laat > 0 && <StatusLabel toon="fout">{laat}d te laat</StatusLabel>}<span className="sm:hidden">{p || <StatusDot toon="let-op" label="geen prijs" />}</span></RijMeta></div></TableCell>
                <TableCell className="text-right tabular-nums"><span className="font-medium">{a}</span> <span className="text-xs text-muted-foreground">{e}</span></TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{p || <StatusDot toon="let-op" verborgenLabel="geen prijs" />}</TableCell>
                <TableCell className="!px-0" onClick={(ev) => ev.stopPropagation()}><RijMenu naam={n} acties={[{ label: 'Bewerken', onClick: () => toast('Bewerken') }, { label: 'Vervallen', onClick: () => toast('Vervallen'), gevaar: true }]} /></TableCell>
              </TableRow>)}
            </Fragment>)}</TableBody>
          </Table>
          <TabelVoet links="3 producten · 1 zonder prijs" rechts="€ 22,15" />
        </LijstKaart>
      </div>
    </Recept>

    <Recept id="werk" titel="Werklijst (afvinken)" opbouw={['Tabs per fase', 'Kaart per groep', 'Vinkje links, naam, één status rechts', 'Klaar-regels ingeklapt']}>
      <LijstKaart kop={<KaartKop icoon={ListChecks} titel="Open" rechts={<span className="text-sm tabular-nums text-muted-foreground">1/3</span>} />}>
        {[['Koffiemachine aanzetten', true, ''], ['Terras klaarzetten', false, ''], ['Koelcel temperatuur', false, 'Te laat']].map(([n, klaar, s]) => <label key={n as string} className="flex min-h-12 items-center gap-3 border-b border-border px-4 last:border-0">
          <Checkbox defaultChecked={klaar as boolean} /><span className={klaar ? 'flex-1 text-sm text-muted-foreground line-through' : 'flex-1 text-sm font-medium'}>{n}</span>{s && <StatusLabel toon="let-op">{s}</StatusLabel>}
        </label>)}
      </LijstKaart>
    </Recept>

    <Recept id="beheer" titel="Instellingen / beheer" opbouw={['Kaart per onderwerp', 'Tekst links, bediening rechts', 'Formulier: label boven veld', 'Annuleren + Opslaan rechtsonder']}>
      <div className="grid gap-4 lg:grid-cols-2">
        <LijstKaart kop={<KaartKop icoon={Settings} titel="Meldingen" />}>
          <InstellingRij titel="Levering te laat" uitleg="Melding naar de manager"><Switch checked={aan} onCheckedChange={setAan} aria-label="Levering te laat" /></InstellingRij>
          <InstellingRij titel="Dagrapport" uitleg="Elke ochtend om 07:00"><Switch aria-label="Dagrapport" /></InstellingRij>
        </LijstKaart>
        <FormKaart titel="Leverancier" knoppen={<><Button variant="ghost" size="touch">Annuleren</Button><Button size="touch" onClick={() => toast('Opgeslagen')}>Opslaan</Button></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="r-naam">Naam</Label><Input id="r-naam" defaultValue="Bidfood" className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="r-dag">Leverdag</Label><Input id="r-dag" defaultValue="Dinsdag" className="h-11" /></div>
          </div>
        </FormKaart>
      </div>
    </Recept>

    <Recept id="overzicht" titel="Overzicht" opbouw={['Max. 4 kengetallen in een rij', 'Elk getal één keer', 'Daaronder korte lijsten met link naar de module']}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KengetalVerdeling label="Open bestellingen" waarde="€ 184,27" regels={[{ naam: 'Bidfood', waarde: '€ 120,10', toon: 'goed' }, { naam: 'Boer & Chef', waarde: '€ 64,17', toon: 'goed' }, { naam: 'Zonder prijs', waarde: '4', toon: 'let-op' }]} />
        <KengetalVerdeling label="Taken vandaag" waarde="18/24" regels={[{ naam: 'Open', waarde: '12' }, { naam: 'Sluit', waarde: '6' }]} />
      </div>
    </Recept>
  </div>;
}

/* ===================== Nieuwe bouwblokken ===================== */

export function NieuweBlokken() {
  const [zoek, setZoek] = useState('');
  return <div className="grid gap-6 lg:grid-cols-2">
    <Blokje titel="StatusLabel" wanneer="Eén per rij, altijd met tekst.">
      <div className="flex flex-wrap gap-2"><StatusLabel toon="goed">Op bord</StatusLabel><StatusLabel toon="let-op">Onzeker</StatusLabel><StatusLabel toon="fout">2d te laat</StatusLabel><StatusLabel>Onbekend</StatusLabel></div>
    </Blokje>
    <Blokje titel="RijMenu" wanneer="Alle rij-acties op één plek; gevaar onderaan, rood."><RijMenu naam="voorbeeld" acties={[{ label: 'Bewerken', onClick: () => toast('Bewerken') }, { label: 'Vervallen', onClick: () => toast('Vervallen'), gevaar: true }]} /></Blokje>
    <Blokje titel="Stappen" wanneer="Bovenaan een lade: waar staat dit proces?"><Stappen stappen={['Op bord', 'Besteld', 'Geleverd']} huidig={1} /></Blokje>
    <Blokje titel="ZoekVeld" wanneer="Boven lijsten van 15+ regels."><ZoekVeld waarde={zoek} onChange={setZoek} /></Blokje>
    <Blokje titel="GenummerdeStap" wanneer="Instructies: kassa tellen, sluiten."><div className="space-y-3"><GenummerdeStap nummer={1} titel="Tel de munten">Per soort, hoogste eerst.</GenummerdeStap><GenummerdeStap nummer={2} titel="Vul het totaal in" /></div></Blokje>
    <Blokje titel="TabelVoet" wanneer="Onder elke lijst met bedragen."><div className="rounded-polar-md border border-border"><TabelVoet links="12 producten" rechts="€ 184,27" /></div></Blokje>
  </div>;
}

function Blokje({ titel, wanneer, children }: { titel: string; wanneer: string; children: React.ReactNode }) {
  return <div className="space-y-3"><div><p className="text-sm font-semibold text-foreground">{titel}</p><p className="text-xs text-muted-foreground">{wanneer}</p></div>{children}</div>;
}

/* ===================== Regels ===================== */

type Regel = { groep: string; regel: string; doe: React.ReactNode; niet: React.ReactNode };
export const REGELS: Regel[] = [
  { groep: 'Opbouw', regel: 'Paginabalk, dan werkvlak; rechts op groot scherm één overzichtskaart', doe: 'Tabs links, "+ Product" rechts, daaronder de lijst.', niet: 'Eigen H1, uitlegblok en drie knoppen bovenaan.' },
  { groep: 'Opbouw', regel: 'Afstand 16 tussen blokken, 12 in kaarten, 8 tussen kleine delen', doe: 'space-y-4 · p-4 · gap-2', niet: 'space-y-5, p-6, gap-3 door elkaar.' },
  { groep: 'Opbouw', regel: 'Eén primaire (groene) knop per pagina, op een vaste plek', doe: <Button size="touch">Opslaan</Button>, niet: <div className="flex gap-2"><Button size="touch">Opslaan</Button><Button size="touch">Delen</Button></div> },
  { groep: 'Lijsten', regel: 'Elke lijst: kaartkop → kolomkoppen één keer → groepsrijen → voetregel', doe: 'Eén tabel, leveranciers als tussenrij.', niet: 'Per leverancier een losse tabel met eigen koppen.' },
  { groep: 'Lijsten', regel: 'Getallen rechts, gelijk breed, eenheid klein erachter', doe: <p className="text-right tabular-nums">12 <span className="text-xs text-muted-foreground">kg</span><br />4 <span className="text-xs text-muted-foreground">bak</span></p>, niet: <p>12kg<br />4 bak</p> },
  { groep: 'Lijsten', regel: 'Telefoon: nooit zijwaarts scrollen; tweede regel draagt verborgen kolommen', doe: 'Naam, daaronder "di 4 nov".', niet: 'Datum verdwijnt of tabel schuift opzij.' },
  { groep: 'Lijsten', regel: 'Laden, leeg en fout altijd zichtbaar', doe: 'Skelet · "Niets onderweg." · fout + Opnieuw', niet: 'Lege witte kaart.' },
  { groep: 'Lijsten', regel: 'Nul-, klaar- en historieregels ingeklapt onderaan', doe: '"Geleverd (12)" dicht.', niet: 'Twaalf grijze regels open.' },
  { groep: 'Acties', regel: 'Rij tikken = details in de lade; overige acties in …', doe: 'Tik → lade; … → Vervallen.', niet: 'Bewerk-, wis- en kopieerknop op elke rij.' },
  { groep: 'Acties', regel: 'Vinkje links = klaar met deze stap; de kolomkop zegt welke', doe: 'Kolom "Besteld" / "Binnen".', niet: 'Naamloze vinkjes met andere betekenis per tabel.' },
  { groep: 'Acties', regel: 'Knoppen: primair, rand, stil, gevaar — altijd 44px op werkschermen', doe: <Button size="touch" variant="outline">Alles geleverd</Button>, niet: <Button size="sm" variant="ghost">Alles</Button> },
  { groep: 'Status', regel: 'Max. één statuslabel per rij, met tekst', doe: <StatusLabel toon="fout">2d te laat</StatusLabel>, niet: <span className="text-destructive">2d ● ●</span> },
  { groep: 'Status', regel: 'Groen = goed, oranje = let op, rood = fout; kleur nooit alleen', doe: <StatusLabel toon="let-op">Onzeker</StatusLabel>, niet: <span className="inline-block h-2 w-2 rounded-full bg-warning" /> },
  { groep: 'Status', regel: 'Een getal staat maar op één plek in beeld', doe: 'Teller in de tab, niet ook in de kaartkop.', niet: '"Op het bord 18" in tab én kaart.' },
  { groep: 'Status', regel: 'Kengetal: label, groot getal, hooguit drie uitsplitsingen', doe: 'Open € 184 · 3 regels eronder.', niet: 'Zes kleine kaarten met elk één getal.' },
  { groep: 'Tekst', regel: 'Geen uitleg in beeld en geen hover: info-icoon opent op tik', doe: <p className="flex items-center gap-1">Vandaag <Info className="h-4 w-4 text-muted-foreground" /></p>, niet: 'Een alinea boven de lijst of een tooltip die alleen met muis werkt.' },
  { groep: 'Tekst', regel: 'Tabs altijd met korte tekst, ook op telefoon', doe: 'Bord · Advies · Tellen · Onderweg', niet: 'Alleen icoontjes met cijfers.' },
  { groep: 'Tekst', regel: 'Formulier: label boven veld, Annuleren + Opslaan rechtsonder', doe: 'Label → veld; knoppen rechtsonder.', niet: 'Label links naast veld, Opslaan bovenaan.' },
];

export function Regels() {
  const groepen = [...new Set(REGELS.map((r) => r.groep))];
  let nr = 0;
  return <div className="space-y-8">{groepen.map((g) => <div key={g} className="space-y-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>
    {REGELS.filter((r) => r.groep === g).map((r) => { nr += 1; return <div key={r.regel} className="space-y-2">
      <p className="text-sm font-semibold text-foreground"><span className="mr-2 tabular-nums text-muted-foreground">{nr}.</span>{r.regel}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2 rounded-polar-md border border-border p-3 text-sm"><StatusDot toon="goed" label="Goed" /><div>{r.doe}</div></div>
        <div className="space-y-2 rounded-polar-md border border-border p-3 text-sm"><StatusDot toon="fout" label="Fout" /><div className="text-muted-foreground">{r.niet}</div></div>
      </div>
    </div>; })}
  </div>)}</div>;
}

const CONTROLE = [
  'Paginatype gekozen en recept gevolgd',
  'Geen eigen H1; titel in de app-header',
  'Eén primaire knop per pagina',
  'Lijsten in een lijstkaart, kolomkoppen één keer',
  'Rij tikken opent lade; rest in …',
  'Max. één statuslabel per rij, met tekst',
  'Elk getal één keer in beeld',
  'Laden, leeg en fout aanwezig',
  'Nul/klaar-regels ingeklapt',
  'Tikdoelen ≥ 44px, geen hover-only',
  'Alleen tokens en components/pura; geen #hex, rounded-[..] of polar',
  'Getest op 390, 834 en 1280 breed zonder zijwaarts scrollen',
];

export function Controle() {
  return <ul className="grid gap-2 sm:grid-cols-2">{CONTROLE.map((r) => <li key={r}><label className="flex min-h-11 items-center gap-3 rounded-polar-md border border-border px-3 text-sm"><Checkbox />{r}</label></li>)}</ul>;
}

