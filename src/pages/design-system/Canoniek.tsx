import { useState, type ReactNode } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RijMenu } from '@/components/pura/lijst';
import { segmentTabsKlasse, StatusDot } from '@/components/pura/patronen';
import {
  Afvinkrij,
  Dialoog,
  Formulierveld,
  LegeStaatBlok,
  Lijstrij,
  Paginakop,
  Sectiekop,
  Statusbadge,
  Telrij,
  Werkkaart,
} from '@/components/pura/canoniek';
import { toast } from 'sonner';

function Paar({ titel, wanneer, doe, niet }: { titel: string; wanneer: string; doe: ReactNode; niet: ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{titel}</p>
        <p className="text-xs text-muted-foreground">{wanneer}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-polar-md border border-border p-3">
          <StatusDot toon="goed" label="Doe" />
          {doe}
        </div>
        <div className="space-y-2 rounded-polar-md border border-border p-3">
          <StatusDot toon="fout" label="Niet" />
          <div className="text-muted-foreground">{niet}</div>
        </div>
      </div>
    </div>
  );
}

const SWATCH = [
  ['bg-primary', 'primary', 'actie, goed'],
  ['bg-muted', 'muted', 'vlak, neutraal'],
  ['bg-border', 'border', 'lijn'],
  ['bg-success', 'success', 'gelukt'],
  ['bg-warning', 'warning', 'let op'],
  ['bg-destructive', 'destructive', 'fout'],
  ['bg-info', 'info', 'informatie'],
] as const;

export function Canoniek() {
  const [klaar, setKlaar] = useState(false);
  const [aantal, setAantal] = useState(1);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-8">
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
          <div className="space-y-1 text-center"><div className="flex h-12 w-40 items-center rounded-polar-lg border border-border px-3 text-sm text-foreground">Rij 48</div><p>min-h-12</p></div>
          <div className="space-y-1 text-center"><Button size="touch">Knop 44</Button><p>h-11 · size=&quot;touch&quot;</p></div>
          <div className="space-y-1 text-center"><div className="h-14 w-24 rounded-polar-lg border border-border bg-card" /><p>kaart 16</p></div>
          <div className="space-y-1 text-center"><div className="h-14 w-24 rounded-polar-xl border border-border bg-card" /><p>dialoog 20</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SWATCH.map(([bg, naam, rol]) => (
            <span key={naam} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`h-4 w-4 rounded-polar-sm ${bg}`} />{naam} · {rol}
            </span>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Kaarttitel</p>
          <p className="text-sm font-medium text-foreground">Rijnaam</p>
          <p className="text-sm text-foreground">Body</p>
          <p className="text-xs text-muted-foreground">Meta</p>
        </div>
      </div>

      <Paar
        titel="Paginakop"
        wanneer="Onder de app-header. Tabs of filters links, hooguit één primaire knop rechts."
        doe={<Paginakop links={<Tabs defaultValue="bord"><TabsList className={segmentTabsKlasse}><TabsTrigger value="bord">Bord</TabsTrigger><TabsTrigger value="onderweg">Onderweg</TabsTrigger></TabsList></Tabs>} actie={<Button size="touch"><Plus className="h-4 w-4" />Product</Button>} />}
        niet={<div className="space-y-2"><p className="text-2xl font-bold text-foreground">Bestellijst</p><div className="flex gap-2"><Button size="touch">Opslaan</Button><Button size="touch">Delen</Button></div><p className="text-sm">Een alinea uitleg boven de lijst.</p></div>}
      />

      <Paar
        titel="Werkkaart"
        wanneer="Elk blok met een onderwerp. Zelfde zijmarge als de rijen: 16, vanaf desktop 24."
        doe={<Werkkaart icoon={ClipboardList} titel="Op het bord" teller={2} voet="2 producten"><Lijstrij naam="Tuinkers" meta="4 bak" actie={<RijMenu naam="Tuinkers" acties={[{ label: 'Bewerken', onClick: () => toast('Bewerken') }]} />} /><Lijstrij naam="Courgette" meta="5 kg" status={<Statusbadge toon="let-op">Geen prijs</Statusbadge>} /></Werkkaart>}
        niet={<div className="rounded-polar-lg border border-border p-5 shadow-sm"><p className="mb-3 text-base font-semibold">Op het bord</p><p className="text-sm">Losse tekst 20px van de rand, andere kaart ernaast met p-4.</p></div>}
      />

      <Paar
        titel="Sectiekop"
        wanneer="Groep binnen een kaart. Zin met teller, geen kapitalen."
        doe={<Werkkaart titel="Vandaag"><Sectiekop titel="Klaar" teller="2/5" groep /><Lijstrij naam="Koffie" meta="Ochtend" /></Werkkaart>}
        niet={<p className="px-5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider">Klaar</p>}
      />

      <Paar
        titel="Lijstrij met actie"
        wanneer="Naam op regel 1, meta altijd op regel 2, actie in een vaste kolom rechts. Rij 48px."
        doe={<Werkkaart titel="Onderweg"><Lijstrij naam="Bloemkool" meta="di 4 nov · 2 stuks" status={<Statusbadge toon="fout">2d te laat</Statusbadge>} onTik={() => toast('Lade')} actie={<RijMenu naam="Bloemkool" acties={[{ label: 'Bewerken', onClick: () => toast('Bewerken') }, { label: 'Vervallen', onClick: () => toast('Vervallen'), gevaar: true }]} />} /></Werkkaart>}
        niet={<div className="flex items-center justify-between gap-2 py-1"><span className="font-medium">Bloemkool <span className="rounded-full bg-destructive px-2 text-xs text-white">●</span></span><span className="flex gap-1"><Button size="sm">Bewerk</Button><Button size="sm" variant="destructive">Wis</Button></span></div>}
      />

      <Paar
        titel="Afvinkrij"
        wanneer="Werklijst. Vinkje links is 44px. Klaar = doorgestreept. Eén status rechts."
        doe={<Werkkaart titel="Sluit"><Afvinkrij naam="Terras klaarzetten" meta="Buiten" klaar={klaar} onKlaar={setKlaar} status={klaar ? <Statusbadge toon="goed">Klaar</Statusbadge> : undefined} /><Afvinkrij naam="Koelcel" meta="Temperatuur" status={<Statusbadge toon="let-op">Te laat</Statusbadge>} /></Werkkaart>}
        niet={<div className="flex items-center gap-1.5 rounded-[14px] border border-border px-2 py-1"><span className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border-2" /><span className="text-[16px]">Terras</span><span className="ml-auto text-[13px]">Naar MEP</span></div>}
      />

      <Paar
        titel="Telrij met stapper"
        wanneer="Stapper en knop allebei 44px. Cijfer semibold, eenheid text-xs op dezelfde lijn. Herhaalde rijknop is outline."
        doe={<Werkkaart titel="Intern uit Midsland"><Telrij naam="Wortelspread" meta="3,2 kg per bak" waarde={aantal} eenheid="bak" onChange={setAantal} actieLabel="Bestellen" /><Telrij naam="Granola" meta="—" waarde={1} eenheid="emmer" onChange={() => undefined} actieLabel="Bestellen" /></Werkkaart>}
        niet={<div className="flex flex-wrap items-center gap-2"><span className="font-medium">Granola</span><span className="inline-flex items-baseline gap-1 rounded-polar-lg border px-2"><span className="text-lg font-semibold">1</span><span className="text-sm">emmer</span></span><Button size="sm">Bestellen</Button><Button size="touch">Nog een</Button></div>}
      />

      <Paar
        titel="Statusbadge"
        wanneer="Maximaal één per rij, altijd met een woord. Kleur nooit alleen."
        doe={<div className="flex flex-wrap gap-2"><Statusbadge toon="goed">Op bord</Statusbadge><Statusbadge toon="let-op">Onzeker</Statusbadge><Statusbadge toon="fout">2d te laat</Statusbadge><Statusbadge>Onbekend</Statusbadge></div>}
        niet={<span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /><span className="h-2 w-2 rounded-full bg-destructive" />2d</span>}
      />

      <Paar
        titel="Formulierveld"
        wanneer="Label boven het veld. Veld 44px. Annuleren en Opslaan rechtsonder, één groene knop."
        doe={<div className="space-y-4"><Formulierveld id="c-naam" label="Naam" hint="Zoals op de verpakking."><Input id="c-naam" defaultValue="Bidfood" /></Formulierveld><div className="flex justify-end gap-2"><Button variant="ghost" size="touch">Annuleren</Button><Button size="touch">Opslaan</Button></div></div>}
        niet={<div className="flex items-center gap-3"><span className="w-24 text-sm">Naam</span><Input className="h-9" defaultValue="Bidfood" /><Button size="sm">Opslaan</Button></div>}
      />

      <Paar
        titel="Dialoog"
        wanneer="Korte vraag. Annuleren is ghost, bevestigen is de enige gevulde knop. Gevaar is rood, niet groen."
        doe={<><Button size="touch" variant="outline" onClick={() => setOpen(true)}>Regel archiveren…</Button><Dialoog open={open} onOpenChange={setOpen} titel="Regel archiveren?" tekst="Hij blijft in de historie staan." bevestigen="Archiveren" gevaar onBevestig={() => { setOpen(false); toast('Gearchiveerd'); }} /></>}
        niet={<div className="space-y-2 rounded-[10px] border p-5"><p className="text-lg font-semibold">Weet je het zeker?</p><div className="flex gap-2"><Button size="sm">Ja</Button><Button size="sm">Nee</Button><Button size="sm">Later</Button></div></div>}
      />

      <Paar
        titel="Lege staat"
        wanneer="In een lijst: één feitelijke zin, geen icoon en geen uitroep."
        doe={<Werkkaart titel="Onderweg"><LegeStaatBlok tekst="Niets onderweg." /></Werkkaart>}
        niet={<div className="flex flex-col items-center px-6 py-10 text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-polar-xl bg-primary/10 text-2xl">✓</div><p className="text-[15px] font-semibold text-foreground">Helemaal leeg!</p><p className="text-sm">Er is nog niets te doen 🎉</p></div>}
      />
    </div>
  );
}
