import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowLeftRight, CalendarClock, CircleAlert, CircleCheck, ClipboardList,
  Info, ListChecks, MoreVertical, Plus, Refrigerator, Search, Snowflake, Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RijMenu } from '@/components/pura/lijst';
import { DetailLade, FoutRegel, LaadRijen, segmentTabsKlasse } from '@/components/pura/patronen';
import {
  Afvinkrij, Dialoog, Formulierveld, LegeStaatBlok, Lijstrij, Paginakop, Sectiekop, Statusbadge,
  Telrij, VoortgangBalk, VoortgangRing, Werkkaart,
} from '@/components/pura/canoniek';

function Paar({ titel, wanneer, doe, niet }: { titel: string; wanneer: string; doe: ReactNode; niet: ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{titel}</p>
        <p className="text-xs text-muted-foreground">{wanneer}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-polar-md border border-border p-3">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" aria-hidden />Doe</span>
          {doe}
        </div>
        <div className="space-y-2 rounded-polar-md border border-border p-3">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-destructive" aria-hidden />Niet</span>
          <div className="text-muted-foreground">{niet}</div>
        </div>
      </div>
    </div>
  );
}

const ROLLEN = [
  ['bg-primary', 'primary', 'de ene actie'],
  ['bg-success', 'success', 'goed'],
  ['bg-warning', 'warning', 'let op'],
  ['bg-destructive', 'destructive', 'fout'],
  ['bg-info', 'info', 'informatie'],
  ['bg-muted', 'muted', 'rust, leeg'],
  ['bg-border', 'border', 'lijn'],
] as const;

const ICONEN = [
  [ClipboardList, 'Bestelbord'],
  [ArrowLeftRight, 'Intern'],
  [Refrigerator, 'Koelcel'],
  [Snowflake, 'Vriezer'],
  [Warehouse, 'Magazijn'],
  [ListChecks, 'MEP'],
  [CalendarClock, 'Datum'],
  [AlertTriangle, 'Let op'],
  [CircleAlert, 'Fout'],
  [CircleCheck, 'Goed'],
  [Plus, 'Toevoegen'],
  [MoreVertical, 'Opties'],
  [Search, 'Zoeken'],
  [Info, 'Info'],
] as const;

export function Canoniek() {
  const [klaar, setKlaar] = useState(false);
  const [aantal, setAantal] = useState(1);
  const [open, setOpen] = useState(false);
  const [lade, setLade] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Eén groene knop per pagina. Op een werkscherm is de herhaalde rij-actie outline. Deze naslag toont elk patroon apart.</p>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Vaste maten</p>
        <div className="flex flex-wrap items-end gap-4">
          {[[8, 'w-2'], [12, 'w-3'], [16, 'w-4'], [24, 'w-6']].map(([px, w]) => (
            <div key={String(px)} className="space-y-1 text-center">
              <div className={`${w} bg-primary/30`} style={{ height: Number(px) }} />
              <p className="text-xs text-muted-foreground">{px}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4 text-xs text-muted-foreground">
          <div className="space-y-1 text-center"><div className="flex h-12 w-36 items-center rounded-polar-lg border border-border px-3 text-sm text-foreground">Rij 48</div><p>min-h-12</p></div>
          <div className="space-y-1 text-center"><Button size="touch">Knop 44</Button><p>h-11</p></div>
          <div className="space-y-1 text-center"><div className="h-12 w-16 rounded-polar-lg border border-border" /><p>kaart 16</p></div>
          <div className="space-y-1 text-center"><div className="h-12 w-16 rounded-polar-2xl border border-border" /><p>dialoog 24</p></div>
          <div className="space-y-1 text-center"><div className="h-12 w-16 rounded-full border border-border" /><p>pill</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLLEN.map(([bg, naam, rol]) => (
            <span key={naam} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-4 w-4 rounded-polar-sm ${bg}`} />{naam} · {rol}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-muted-foreground">
          {ICONEN.map(([I, naam]) => (
            <span key={naam} className="inline-flex items-center gap-2 text-xs"><I className="h-4 w-4" aria-hidden />{naam}</span>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Kaarttitel</p>
          <p className="text-sm font-medium text-foreground">Rijnaam</p>
          <p className="text-sm text-foreground">Body</p>
          <p className="text-xs text-muted-foreground">Meta</p>
          <p className="text-lg font-semibold text-foreground">Dialoogtitel</p>
        </div>
      </div>

      <Paar
        titel="Paginakop"
        wanneer="Onder de app-header. Tabs met tekst, rechts hooguit één primaire knop."
        doe={<Paginakop links={<Tabs defaultValue="bord"><TabsList className={segmentTabsKlasse}><TabsTrigger value="bord">Bord</TabsTrigger><TabsTrigger value="onderweg">Onderweg</TabsTrigger></TabsList></Tabs>} actie={<Button size="touch"><Plus className="h-4 w-4" />Product</Button>} />}
        niet={<div className="space-y-2"><p className="text-2xl font-bold text-foreground">Bestellijst</p><div className="flex flex-wrap gap-2"><Button size="touch">Opslaan</Button><Button size="touch">Delen</Button></div></div>}
      />

      <Paar
        titel="Werkkaart"
        wanneer="Eén onderwerp. Voortgang is een balk van 4px, geen tweede kader."
        doe={<Werkkaart icoon={ClipboardList} titel="Op het bord" teller={2} voortgang={40} voet="2 producten"><Lijstrij naam="Tuinkers" meta="4 bak" actie={<RijMenu naam="Tuinkers" acties={[{ label: 'Bewerken', onClick: () => toast('Bewerken') }]} />} /></Werkkaart>}
        niet={<div className="rounded-polar-lg border border-border p-5 shadow-sm"><p className="mb-3 text-base font-semibold">Op het bord</p><p className="text-sm">Losse tekst, andere padding dan de rij eronder.</p></div>}
      />

      <Paar
        titel="Sectiekop"
        wanneer="48px, zelfde zijmarge als de rij. Ring voor procenten, geen kapitalen."
        doe={<Werkkaart titel="Vandaag"><Sectiekop titel="Klaar" teller="2/5" voortgang={40} groep /><Lijstrij naam="Koffie" meta="Ochtend" /></Werkkaart>}
        niet={<p className="px-5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider">Klaar</p>}
      />

      <Paar
        titel="Lijstrij met actie"
        wanneer="Naam, één status, meta op regel 2, actie in de rechterkolom. Rij 48px."
        doe={<Werkkaart titel="Onderweg"><Lijstrij naam="Bloemkool" meta={<span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" aria-hidden />di 4 nov</span>} status={<Statusbadge toon="fout" icoon>2d te laat</Statusbadge>} onTik={() => setLade(true)} actie={<RijMenu naam="Bloemkool" acties={[{ label: 'Bewerken', onClick: () => toast('Bewerken') }, { label: 'Vervallen', onClick: () => toast('Vervallen'), gevaar: true }]} />} /></Werkkaart>}
        niet={<div className="flex flex-wrap items-center justify-between gap-2 py-1"><span className="font-medium">Bloemkool</span><span className="flex gap-2"><Button size="sm">Bewerk</Button><Button size="sm" variant="destructive">Wis</Button></span></div>}
      />

      <Paar
        titel="Afvinkrij"
        wanneer="Vinkje in 44px. Klaar is doorgestreept. Eén status, met icoon én woord."
        doe={<Werkkaart titel="Sluit"><Afvinkrij naam="Terras klaarzetten" meta="Buiten" klaar={klaar} onKlaar={setKlaar} status={klaar ? <Statusbadge toon="goed" icoon>Klaar</Statusbadge> : undefined} /><Afvinkrij naam="Koelcel" meta={<span className="inline-flex items-center gap-2"><Refrigerator className="h-4 w-4" aria-hidden />Temperatuur</span>} status={<Statusbadge toon="let-op" icoon>Te laat</Statusbadge>} /></Werkkaart>}
        niet={<div className="flex items-center gap-2 rounded-[14px] border border-border px-2 py-1"><span className="h-[26px] w-[26px] rounded-[6px] border-2" /><span className="text-[16px]">Terras</span></div>}
      />

      <Paar
        titel="Telrij met stapper"
        wanneer="De stapper is AantalStapper. Knop ernaast is outline, ook 44px. Op 390 blijft het woord heel."
        doe={<Werkkaart titel="Intern uit Midsland" icoon={ArrowLeftRight}><Telrij naam="Wortelspread" meta="3,2 kg per bak" waarde={aantal} eenheid="bak" onChange={setAantal} actieLabel="Bestellen" /><Telrij naam="Granola" meta="—" waarde={1} eenheid="emmer" onChange={() => undefined} actieLabel="Bestellen" bezig /></Werkkaart>}
        niet={<div className="flex flex-wrap items-end gap-2"><span className="inline-flex items-baseline gap-1 rounded-polar-lg border px-2"><span className="text-lg font-semibold">1</span><span className="text-sm">emmer</span></span><Button size="sm">Bestellen</Button><Button size="touch">Nog een</Button></div>}
      />

      <Paar
        titel="Statusbadge"
        wanneer="Pill met woord. Goed gebruikt success, niet primary. Stip alleen naast tekst."
        doe={<div className="flex flex-wrap gap-2"><Statusbadge toon="goed" icoon>Op bord</Statusbadge><Statusbadge toon="let-op" icoon>Onzeker</Statusbadge><Statusbadge toon="fout" icoon>2d te laat</Statusbadge><Statusbadge>Onbekend</Statusbadge></div>}
        niet={<span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /><span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Gelukt</span></span>}
      />

      <Paar
        titel="Formulierveld"
        wanneer="Label boven het veld. Het veld is 44px, ook al is de invoer standaard 40px. Fout onder het veld."
        doe={<div className="space-y-4"><Formulierveld id="c-naam" label="Naam" hint="Zoals op de verpakking."><Input id="c-naam" defaultValue="Bidfood" /></Formulierveld><Formulierveld id="c-fout" label="Code" fout="Vul een code in."><Input id="c-fout" aria-invalid defaultValue="" /></Formulierveld><div className="flex justify-end gap-2"><Button variant="ghost" size="touch">Annuleren</Button><Button size="touch">Opslaan</Button></div></div>}
        niet={<div className="flex flex-wrap items-center gap-3"><span className="text-sm">Naam</span><Input className="h-9 w-32" defaultValue="Bidfood" /><Button size="sm">Opslaan</Button></div>}
      />

      <Paar
        titel="Dialoog"
        wanneer="Radius 24 en titel text-lg, zoals Dialog zelf. Annuleren ghost, één bevestiging. Gevaar is rood."
        doe={<><Button size="touch" variant="outline" onClick={() => setOpen(true)}>Regel archiveren…</Button><Dialoog open={open} onOpenChange={setOpen} titel="Regel archiveren?" tekst="Hij blijft in de historie staan." bevestigen="Archiveren" gevaar onBevestig={() => { setOpen(false); toast('Gearchiveerd'); }} /></>}
        niet={<div className="space-y-2 rounded-[10px] border p-5"><p className="text-sm font-semibold">Weet je het zeker?</p><div className="flex flex-wrap gap-2"><Button size="sm">Ja</Button><Button size="sm">Nee</Button><Button size="sm">Later</Button></div></div>}
      />

      <Paar
        titel="Lege staat"
        wanneer="Alleen als laden klaar is en er niets is. Eén zin. Geen illustratie."
        doe={<Werkkaart titel="Onderweg"><LegeStaatBlok tekst="Niets onderweg." actie={<Button size="touch" variant="outline">Filter wissen</Button>} /></Werkkaart>}
        niet={<div className="flex flex-col items-center px-6 py-10 text-center"><p className="text-[15px] font-semibold text-foreground">Helemaal leeg</p><p className="text-sm">Er is nog niets te doen.</p></div>}
      />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Staten</p>
        <p className="text-xs text-muted-foreground">Laden, leeg en fout zijn drie verschillende momenten. Disabled blijft 44px. Focus toont de ring.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <Werkkaart titel="Laden"><LaadRijen aantal={2} /><div className="px-4 py-3 lg:px-6"><Skeleton className="h-4 w-2/3 rounded-polar-md" /></div></Werkkaart>
          <Werkkaart titel="Fout"><FoutRegel onOpnieuw={() => toast('Opnieuw')} /></Werkkaart>
          <Werkkaart titel="Uit"><Telrij naam="Granola" meta="—" waarde={1} eenheid="emmer" onChange={() => undefined} actieLabel="Bestellen" bezig /><div className="space-y-2 px-4 py-3 lg:px-6"><Formulierveld id="uit-naam" label="Naam"><Input id="uit-naam" disabled defaultValue="Bidfood" /></Formulierveld><Button size="touch" disabled>Opslaan</Button></div></Werkkaart>
          <Werkkaart titel="Focus">
            <div className="space-y-2 px-4 py-3 lg:px-6">
              <Formulierveld id="focus-naam" label="Naam"><Input id="focus-naam" defaultValue="Bidfood" className="ring-2 ring-ring ring-offset-2 ring-offset-background" /></Formulierveld>
              <Button size="touch" variant="outline" className="ring-2 ring-ring ring-offset-2 ring-offset-background">Zichtbare ring</Button>
            </div>
          </Werkkaart>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Ondersteunend</p>
        <div className="flex flex-wrap items-center gap-2">
          <VoortgangRing waarde={60} label="60 procent" />
          <div className="w-40"><VoortgangBalk waarde={60} label="60 procent" /></div>
          <Button size="touch" variant="outline" onClick={() => setLade(true)}>Open lade</Button>
          <Button size="touch" variant="outline" onClick={() => toast('Opgeslagen')}>Toon melding</Button>
        </div>
      </div>

      <DetailLade open={lade} onOpenChange={setLade} titel="Bloemkool" voet={<Button size="touch" onClick={() => { setLade(false); toast('Opgeslagen'); }}>Opslaan</Button>}>
        <Formulierveld id="lade-aantal" label="Aantal"><Input id="lade-aantal" defaultValue="2" /></Formulierveld>
      </DetailLade>
    </div>
  );
}
