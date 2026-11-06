import { useState } from 'react';
import { ArrowLeftRight, CalendarClock, ClipboardList, Plus, Refrigerator } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RijMenu } from '@/components/pura/lijst';
import { segmentTabsKlasse } from '@/components/pura/patronen';
import {
  Afvinkrij, Dialoog, Formulierveld, LegeStaatBlok, Lijstrij, Paginakop, Sectiekop, Statusbadge, Telrij, Werkkaart,
} from '@/components/pura/canoniek';

/** Klassenaam van het voorbeeldthema. Nooit op :root zetten. */
export const PURA_THEME_V3 = 'pura-theme-v3';

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
  { naam: 'schaduw kaart', shadcn: '0 1px 2px rgb(0 0 0 / 0.05)', huidig: 'shadow-soft, iets dikker', voorstel: '0 1px 2px rgb(0 0 0 / 0.05)' },
  { naam: 'radius', shadcn: '10px, kaart 14px', huidig: 'kaart 16, dialoog 24', voorstel: 'schaal blijft 8 / 12 / 16 / 24' },
  { naam: 'badge', shadcn: '20px, 12/500, pill, px 8', huidig: 'pill, semibold, px 10', voorstel: 'pill, 500, px 8' },
  { naam: 'rij / knop', shadcn: 'rij ~40, knop 32–36', huidig: 'rij 48, knop 44', voorstel: 'rij 48, knop 44' },
];

function Scherm({ id, thema = false }: { id: string; thema?: boolean }) {
  const [tab, setTab] = useState('bord');
  const [klaar, setKlaar] = useState(true);
  const [wortel, setWortel] = useState(1);
  const [granola, setGranola] = useState(1);
  const [yoghurt, setYoghurt] = useState(6);
  const [hummus, setHummus] = useState(2);
  const [open, setOpen] = useState(false);
  const portaal = thema ? PURA_THEME_V3 : undefined;
  const menu = (naam: string) => (
    <RijMenu
      naam={naam}
      className={portaal}
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
        className={portaal}
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

function Kolom({ label, thema, id, kader }: { label: string; thema?: boolean; id: string; kader: boolean }) {
  const volgorde = kader ? (thema ? 'order-1 xl:order-2' : 'order-2 xl:order-1') : '';
  return (
    <div className={`min-w-0 ${volgorde} ${kader ? 'space-y-2' : ''}`}>
      {kader ? <p className="text-xs text-muted-foreground">{label}</p> : null}
      <div className={`${thema ? `${PURA_THEME_V3} js-voorbeeld-nieuw` : ''} ${kader ? 'rounded-polar-lg border border-border bg-background p-4 lg:p-6' : ''}`}>
        <Scherm id={id} thema={thema} />
      </div>
    </div>
  );
}

/** Zelfde West-scherm in het huidige thema en in .pura-theme-v3. */
export function ShadcnVergelijking({ toon = 'beide', tokens = false }: { toon?: VoorbeeldToon; tokens?: boolean }) {
  return (
    <div className="space-y-4">
      <div className={`grid items-start gap-4 ${toon === 'beide' ? 'xl:grid-cols-2' : ''}`}>
        {toon !== 'nieuw' && <Kolom label="Huidig" id="huidig" kader={toon === 'beide'} />}
        {toon !== 'huidig' && <Kolom label="Voorstel" thema id="nieuw" kader={toon === 'beide'} />}
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
