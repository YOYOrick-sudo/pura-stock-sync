import { useState, type ReactNode } from 'react';
import { ArrowLeftRight, CalendarClock, ClipboardList, Minus, Plus, Refrigerator, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RijMenu } from '@/components/pura/lijst';
import { segmentTabsKlasse } from '@/components/pura/patronen';
import {
  Afvinkrij, Dialoog, Formulierveld, LegeStaatBlok, Lijstrij, Paginakop, Sectiekop, Statusbadge, Telrij, Werkkaart,
} from '@/components/pura/canoniek';

export type VoorbeeldToon = 'beide' | 'nieuw' | 'huidig';

const TOKENS: { naam: string; shadcn: string; huidig: string; voorstel: string }[] = [
  { naam: 'background', shadcn: '#ffffff', huidig: '45 8% 95% · #F5F4F2', voorstel: '0 0% 100% · #ffffff' },
  { naam: 'card', shadcn: '#ffffff', huidig: '40 5% 98%', voorstel: '0 0% 100% · #ffffff' },
  { naam: 'foreground', shadcn: '#0a0a0a', huidig: '220 26% 14% · #1F2937', voorstel: '0 0% 3.9% · #0a0a0a' },
  { naam: 'muted', shadcn: '#f5f5f5', huidig: '40 5% 95%', voorstel: '0 0% 96.1% · #f5f5f5' },
  { naam: 'muted-foreground', shadcn: '#737373', huidig: '220 9% 46% · #6B7280', voorstel: '0 0% 45.1% · #737373' },
  { naam: 'border', shadcn: '1px #e5e5e5', huidig: '40 6% 88%, vaak 1.5px', voorstel: '0 0% 89.8% · #e5e5e5, 1px' },
  { naam: 'input', shadcn: '#e5e5e5', huidig: '40 6% 82%', voorstel: '0 0% 89.8% · gelijk aan border' },
  { naam: 'ring', shadcn: '#a1a1a1', huidig: 'primary groen', voorstel: '0 0% 63.1% · #a1a1a1' },
  { naam: 'secondary / accent', shadcn: '#f5f5f5', huidig: '163 30% 95% · groene tint', voorstel: '0 0% 96.1% · #f5f5f5' },
  { naam: 'primary', shadcn: '#000000', huidig: '163 65% 26% · #1B7867', voorstel: 'ongewijzigd #1B7867, één knop' },
  { naam: 'schaduw kaart', shadcn: '0 1px 2px rgb(0 0 0 / 0.05)', huidig: 'zwaarder', voorstel: '0 1px 2px rgb(0 0 0 / 0.05)' },
  { naam: 'radius', shadcn: '10px, kaart 14px', huidig: 'kaart 16, dialoog 24', voorstel: 'schaal blijft 8 / 12 / 16 / 24' },
  { naam: 'badge', shadcn: '20px, 12/500, pill, px 8', huidig: 'pill, semibold, px 10', voorstel: 'pill, 500, px 8' },
  { naam: 'rij / knop', shadcn: 'rij ~40, knop 32–36', huidig: 'rij 48, knop 44', voorstel: 'rij 48, herhaalde knop h-9, … is 32px' },
];

function Menu({ naam, acties }: { naam: string; acties: { label: string; onClick: () => void; gevaar?: boolean }[] }) {
  return <RijMenu naam={naam} acties={acties} />;
}

/** Huidige opbouw: kaart op kaart. Blijft staan zodat het verschil zichtbaar is. */
function HuidigScherm({ id }: { id: string }) {
  const [tab, setTab] = useState('bord');
  const [klaar, setKlaar] = useState(true);
  const [wortel, setWortel] = useState(1);
  const [granola, setGranola] = useState(1);
  const [yoghurt, setYoghurt] = useState(6);
  const [hummus, setHummus] = useState(2);
  const [open, setOpen] = useState(false);
  const menu = (naam: string) => (
    <Menu
      naam={naam}
      acties={[
        { label: 'Bewerken', onClick: () => toast('Bewerken') },
        { label: 'Vervallen', onClick: () => toast('Vervallen'), gevaar: true },
      ]}
    />
  );
  return (
    <div className="space-y-4">
      <Paginakop
        links={(
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className={segmentTabsKlasse}>
              <TabsTrigger value="bord">Bord</TabsTrigger>
              <TabsTrigger value="onderweg">Onderweg</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        actie={<Button type="button" size="touch" onClick={() => toast('Product toevoegen')}><Plus className="h-4 w-4" />Product</Button>}
      />

      <Werkkaart icoon={ClipboardList} titel="Bestelbord" teller={2} voet="2 producten">
        <Sectiekop titel="Op het bord" teller="2" />
        <Lijstrij
          naam="Bloemkool"
          meta={<span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" aria-hidden />di 4 nov</span>}
          status={<Statusbadge toon="fout" icoon>2d te laat</Statusbadge>}
          actie={menu('Bloemkool')}
        />
        <Lijstrij naam="Tuinkers" meta="4 bak" actie={menu('Tuinkers')} />
      </Werkkaart>

      <Werkkaart icoon={ArrowLeftRight} titel="Intern uit Midsland" teller={2}>
        <Telrij naam="Wortelspread" meta="3,2 kg per bak" waarde={wortel} eenheid="bak" onChange={setWortel} actieLabel="Bestellen" onActie={() => toast('Besteld')} />
        <Telrij naam="Granola" meta="—" waarde={granola} eenheid="emmer" onChange={setGranola} actieLabel="Bestellen" onActie={() => toast('Besteld')} />
      </Werkkaart>

      <Werkkaart titel="Sluitlijst West" teller={3}>
        <Sectiekop titel="Sluiten" teller="1/3" />
        <Afvinkrij naam="Terras klaarzetten" meta="Buiten" klaar={klaar} onKlaar={setKlaar} status={klaar ? <Statusbadge toon="goed" icoon>Klaar</Statusbadge> : undefined} />
        <Afvinkrij
          naam="Koelcel"
          meta={<span className="inline-flex items-center gap-2"><Refrigerator className="h-4 w-4" aria-hidden />Temperatuur</span>}
          status={<Statusbadge toon="let-op" icoon>Te laat</Statusbadge>}
        />
        <Afvinkrij naam="Vloer dweilen" meta="Zaal" />
      </Werkkaart>

      <Werkkaart icoon={Refrigerator} titel="Tellen koelcel" teller={2}>
        <Sectiekop titel="Open producten" teller="2" />
        <Telrij naam="Yoghurt Grieks" meta="koelcel" waarde={yoghurt} eenheid="st" onChange={setYoghurt} />
        <Telrij naam="Hummus" meta="koelcel" waarde={hummus} eenheid="bak" onChange={setHummus} />
      </Werkkaart>

      <Werkkaart titel="Onderweg">
        <LegeStaatBlok tekst="Niets onderweg." actie={<Button type="button" size="touch" variant="outline" onClick={() => setTab('bord')}>Filter wissen</Button>} />
      </Werkkaart>

      <Werkkaart titel="Notitie">
        <div className="space-y-4 px-4 py-4 lg:px-6">
          <Formulierveld id={`${id}-notitie`} label="Voor de volgende dienst" hint="Zichtbaar voor West.">
            <Input id={`${id}-notitie`} defaultValue="Wortelspread staat klaar in Midsland." />
          </Formulierveld>
          <div className="flex justify-end">
            <Button type="button" size="touch" variant="outline" onClick={() => setOpen(true)}>Regel archiveren…</Button>
          </div>
        </div>
      </Werkkaart>

      <Dialoog
        open={open}
        onOpenChange={setOpen}
        titel="Regel archiveren?"
        tekst="De notitie blijft in de historie van West staan."
        bevestigen="Archiveren"
        gevaar
        onBevestig={() => { setOpen(false); toast('Gearchiveerd'); }}
      />
    </div>
  );
}

function CompactStapper({ waarde, eenheid, onChange, label }: { waarde: number; eenheid: string; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex h-9 items-center rounded-polar-md border border-border bg-background">
      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 px-0" aria-label={`Minder ${label}`} onClick={() => onChange(Math.max(1, waarde - 1))}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="flex min-w-[4.5rem] items-center justify-center gap-2 leading-none">
        <span className="text-sm font-medium tabular-nums leading-none">{waarde}</span>
        <span className="text-xs leading-none text-muted-foreground">{eenheid}</span>
      </span>
      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 px-0" aria-label={`Meer ${label}`} onClick={() => onChange(waarde + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Sectie({ titel, teller, children, lijn = false }: { titel: string; teller?: string; children: ReactNode; lijn?: boolean }) {
  return (
    <section className={lijn ? 'space-y-4 border-t border-border pt-6' : 'space-y-4'}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{titel}</h2>
        {teller ? <span className="text-xs tabular-nums text-muted-foreground">{teller}</span> : null}
      </div>
      {children}
    </section>
  );
}

const BORD = [
  { naam: 'Bloemkool', datum: 'di 4 nov', aantal: '', status: 'laat' as const },
  { naam: 'Tuinkers', datum: '', aantal: '4 bak', status: '' as const },
];

/** Voorstel: hiërarchie van tasks. Eén titel, secties zonder extra kaart, tabel vanaf tablet. */
export function VoorstelScherm({ id }: { id: string }) {
  const [zoek, setZoek] = useState('');
  const [klaar, setKlaar] = useState(true);
  const [wortel, setWortel] = useState(1);
  const [granola, setGranola] = useState(1);
  const [yoghurt, setYoghurt] = useState(6);
  const [hummus, setHummus] = useState(2);
  const [open, setOpen] = useState(false);
  const q = zoek.trim().toLowerCase();
  const bord = BORD.filter((rij) => !q || rij.naam.toLowerCase().includes(q));
  const menu = (naam: string, archief = false) => (
    <Menu
      naam={naam}
      acties={[
        { label: 'Bewerken', onClick: () => toast('Bewerken') },
        ...(archief ? [{ label: 'Archiveren…', onClick: () => setOpen(true) }] : []),
        { label: 'Vervallen', onClick: () => toast('Vervallen'), gevaar: true },
      ]}
    />
  );
  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">West</h1>
          <p className="text-sm text-muted-foreground">Vandaag op het bord, intern uit Midsland en sluiten.</p>
        </div>
        <Button type="button" size="sm" onClick={() => toast('Product toevoegen')}><Plus className="h-4 w-4" />Product</Button>
      </div>

      <Sectie titel="Bestelbord" teller="2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoeken" aria-label="Zoeken op het bord" className="h-9 pl-9" />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => toast('Filter status')}><Plus className="h-4 w-4" />Status</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => toast('Filter locatie')}><Plus className="h-4 w-4" />Locatie</Button>
        </div>
        <div className="hidden overflow-hidden rounded-polar-lg border border-border md:block">
          <div className="grid h-10 grid-cols-[minmax(0,1fr)_7.5rem_8.5rem_2rem] items-center gap-3 border-b border-border px-4 text-xs font-medium text-muted-foreground">
            <span>Product</span><span>Datum</span><span>Status</span><span className="sr-only">Acties</span>
          </div>
          {bord.map((rij) => (
            <div key={rij.naam} className="grid min-h-12 grid-cols-[minmax(0,1fr)_7.5rem_8.5rem_2rem] items-center gap-3 border-b border-border px-4 last:border-0">
              <p className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-sm font-medium text-foreground">{rij.naam}</span>
                {rij.aantal ? <span className="shrink-0 text-xs text-muted-foreground">{rij.aantal}</span> : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">{rij.datum}</p>
              <div>{rij.status === 'laat' ? <Statusbadge toon="fout" icoon>2d te laat</Statusbadge> : null}</div>
              {menu(rij.naam, rij.naam === 'Bloemkool')}
            </div>
          ))}
          {bord.length === 0 ? <p className="px-4 py-4 text-sm text-muted-foreground">Niets gevonden.</p> : null}
        </div>
        <div className="md:hidden">
          {bord.map((rij) => (
            <div key={rij.naam} className="flex min-h-12 items-center gap-3 border-b border-border py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{rij.naam}</span>
                  {rij.status === 'laat' ? <Statusbadge toon="fout" icoon>2d te laat</Statusbadge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{[rij.datum, rij.aantal].filter(Boolean).join(' · ')}</p>
              </div>
              {menu(rij.naam, rij.naam === 'Bloemkool')}
            </div>
          ))}
          {bord.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Niets gevonden.</p> : null}
        </div>
      </Sectie>

      <div className="border-t border-border" />

      <Sectie titel="Intern uit Midsland" teller="2">
        <div>
          <TelRegel naam="Wortelspread" meta="3,2 kg per bak" waarde={wortel} eenheid="bak" onChange={setWortel} />
          <TelRegel naam="Granola" meta="gewicht nog niet ingesteld" waarde={granola} eenheid="emmer" onChange={setGranola} />
        </div>
      </Sectie>

      <div className="border-t border-border" />

      <Sectie titel="Sluitlijst West" teller="1/3">
        <div>
          <Vink naam={`${id}-terras`} label="Terras klaarzetten" meta="Buiten" klaar={klaar} onKlaar={setKlaar} status={klaar ? <Statusbadge toon="goed" icoon>Klaar</Statusbadge> : undefined} />
          <Vink naam={`${id}-koel`} label="Koelcel" meta="Temperatuur" status={<Statusbadge toon="let-op" icoon>Te laat</Statusbadge>} />
          <Vink naam={`${id}-vloer`} label="Vloer dweilen" meta="Zaal" />
        </div>
      </Sectie>

      <div className="border-t border-border" />

      <Sectie titel="Tellen koelcel" teller="2">
        <div>
          <TelRegel naam="Yoghurt Grieks" meta="koelcel" waarde={yoghurt} eenheid="st" onChange={setYoghurt} bestellen={false} />
          <TelRegel naam="Hummus" meta="koelcel" waarde={hummus} eenheid="bak" onChange={setHummus} bestellen={false} />
        </div>
      </Sectie>

      <div className="border-t border-border" />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-polar-lg border border-dashed border-border bg-muted px-4 py-3">
        <p className="text-sm text-muted-foreground">Niets onderweg.</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setZoek(''); toast('Filter gewist'); }}>Filter wissen</Button>
      </div>

      <Dialoog
        open={open}
        onOpenChange={setOpen}
        titel="Regel archiveren?"
        tekst="Bloemkool blijft in de historie van West staan."
        bevestigen="Archiveren"
        gevaar
        onBevestig={() => { setOpen(false); toast('Gearchiveerd'); }}
      />
    </div>
  );
}

function TelRegel({ naam, meta, waarde, eenheid, onChange, bestellen = true }: { naam: string; meta: string; waarde: number; eenheid: string; onChange: (n: number) => void; bestellen?: boolean }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-border py-2 last:border-0">
      <div className="min-w-0 flex-1 basis-full sm:basis-0">
        <p className="truncate text-sm font-medium text-foreground">{naam}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <CompactStapper waarde={waarde} eenheid={eenheid} label={naam} onChange={onChange} />
        {bestellen ? <Button type="button" variant="outline" size="sm" onClick={() => toast('Besteld')}>Bestellen</Button> : null}
      </div>
    </div>
  );
}

function Vink({ naam, label, meta, klaar = false, onKlaar, status }: { naam: string; label: string; meta: string; klaar?: boolean; onKlaar?: (v: boolean) => void; status?: ReactNode }) {
  return (
    <label htmlFor={naam} className="flex min-h-12 items-center gap-3 border-b border-border py-2 last:border-0">
      <Checkbox id={naam} checked={klaar} onCheckedChange={(v) => onKlaar?.(v === true)} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${klaar ? 'text-muted-foreground line-through' : 'font-medium text-foreground'}`}>{label}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </span>
      {status ? <span className="shrink-0">{status}</span> : null}
    </label>
  );
}

function Kolom({ label, thema, id, kader }: { label: string; thema?: boolean; id: string; kader: boolean }) {
  const volgorde = kader ? (thema ? 'order-1 xl:order-2' : 'order-2 xl:order-1') : '';
  return (
    <div className={`min-w-0 ${volgorde} ${kader ? 'space-y-2' : ''}`}>
      {kader ? <p className="text-xs text-muted-foreground">{label}</p> : null}
      <div className={kader ? 'rounded-polar-lg border border-border bg-background p-4 lg:p-6' : ''}>
        {thema ? <VoorstelScherm id={id} /> : <HuidigScherm id={id} />}
      </div>
    </div>
  );
}

/** Oude opbouw naast de nieuwe. Kleuren komen uit :root. */
export function ShadcnVergelijking({ toon = 'beide', tokens = false }: { toon?: VoorbeeldToon; tokens?: boolean }) {
  return (
    <div className="space-y-4">
      <div className={`grid items-start gap-4 ${toon === 'beide' ? 'xl:grid-cols-2' : ''}`}>
        {toon !== 'nieuw' && <Kolom label="Oude opbouw" id="huidig" kader={toon === 'beide'} />}
        {toon !== 'huidig' && <Kolom label="Nieuwe opbouw" thema id="nieuw" kader={toon === 'beide'} />}
      </div>
      {tokens && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Voorgestelde tokens</p>
          <p className="text-xs text-muted-foreground">Voor stap 2, app-breed. Nog niet op :root. Gemeten op ui.shadcn.com, 6 nov 2026.</p>
          <div className="overflow-hidden rounded-polar-lg border border-border">
            {TOKENS.map((rij) => (
              <div key={rij.naam} className="space-y-2 border-b border-border px-4 py-3 last:border-0 lg:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{rij.naam}</p>
                  <p className="text-xs text-foreground">{rij.voorstel}</p>
                </div>
                <p className="text-xs text-muted-foreground">Shadcn {rij.shadcn} · Huidig {rij.huidig}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>Bewust anders dan shadcn: rij 48, knop 44, radius 16 en dialoog 24, groen #1B7867 in plaats van zwart, Inter in plaats van Geist.</li>
            <li>Overgenomen: wit vlak, haarlijn 1px, neutral-grijs, bijna geen schaduw, groen alleen op Product.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
