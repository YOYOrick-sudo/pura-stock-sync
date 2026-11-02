import { useEffect, useState, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeverancierSoorten, type ArtikelVorm, type BordSuggestie, type LeverancierKeuze } from '@/hooks/useBestelbord';
import { suggestieOnderschrift } from '@/lib/leverancierSoort';
import { bouwAanmaakVelden, leverancierKeuzeLabel, planKoppelZoek, type AanmaakVelden } from './koppelActies';

const INHOUD_EENHEDEN = ['g', 'ml', 'stuk'] as const;

function vormLeverancier(v: ArtikelVorm, leveranciers?: Map<string, string>) {
  return v.leverancier_naam ?? (v.leverancier_id ? leveranciers?.get(v.leverancier_id) : null) ?? 'leverancier';
}

export interface NieuwArtikelStart {
  leverancierId?: string;
  eenheid?: string | null;
  vorm?: string;
  inhoud?: string;
  inhoudEenheid?: 'g' | 'ml' | 'stuk' | null;
  artikelnummer?: string;
  prijs?: string;
}

/** Lade-inhoud voor een open regel zonder artikel: koppelen of nieuw artikel. */
export function KoppelPaneel({
  vestiging, beginNaam, leveranciers, leveranciersKeuze, isManager, zoek, bereidVormen,
  renderVormKeuze, renderSoortKeuze, onKoppel, onAanmaken, kanOpslaan = true, bezig = false,
  startTab = 'koppel', startGekozen = null, beginNieuw,
}: {
  vestiging: string;
  beginNaam: string;
  leveranciers?: Map<string, string>;
  leveranciersKeuze: LeverancierKeuze[];
  isManager: boolean;
  zoek: (vestiging: string, tekst: string) => Promise<BordSuggestie[]>;
  bereidVormen: (vormen: ArtikelVorm[]) => ArtikelVorm[];
  renderVormKeuze: (vormen: ArtikelVorm[], gekozen: string | null, onKies: (v: ArtikelVorm) => void) => ReactNode;
  renderSoortKeuze: (waarde: string | null, onChange: (s: string) => void) => ReactNode;
  onKoppel: (keuze: { artikelId: string; artikelVormId: string; leverancierNaam: string; artikelNaam: string }) => Promise<void> | void;
  onAanmaken: (velden: AanmaakVelden) => Promise<void> | void;
  kanOpslaan?: boolean;
  bezig?: boolean;
  startTab?: 'koppel' | 'nieuw';
  startGekozen?: BordSuggestie | null;
  beginNieuw?: NieuwArtikelStart;
}) {
  const startVormen = startGekozen ? bereidVormen(startGekozen.vormen) : [];
  const startEnige = startVormen.length === 1 && !startVormen[0].geblokkeerd ? startVormen[0].id : null;
  const [tab, setTab] = useState(startTab);
  const [zoekTekst, setZoekTekst] = useState(startGekozen?.naam ?? beginNaam);
  const [suggesties, setSuggesties] = useState<BordSuggestie[]>([]);
  const [gekozen, setGekozen] = useState<BordSuggestie | null>(startGekozen);
  const [vormId, setVormId] = useState<string | null>(startEnige);
  const [nieuwNaam, setNieuwNaam] = useState(beginNaam);
  const [leverancierId, setLeverancierId] = useState(beginNieuw?.leverancierId ?? '');
  const [eenheid, setEenheid] = useState<string | null>(beginNieuw?.eenheid ?? null);
  const [vormTekst, setVormTekst] = useState(beginNieuw?.vorm ?? '');
  const [inhoud, setInhoud] = useState(beginNieuw?.inhoud ?? '');
  const [inhoudEenheid, setInhoudEenheid] = useState<'g' | 'ml' | 'stuk' | null>(beginNieuw?.inhoudEenheid ?? null);
  const [artikelnummer, setArtikelnummer] = useState(beginNieuw?.artikelnummer ?? '');
  const [prijs, setPrijs] = useState(beginNieuw?.prijs ?? '');
  const { data: soorten } = useLeverancierSoorten();

  useEffect(() => planKoppelZoek(zoekTekst, vestiging, !!gekozen, zoek, setSuggesties), [zoekTekst, vestiging, gekozen, zoek]);

  const gekozenVorm = gekozen && vormId ? bereidVormen(gekozen.vormen).find((v) => v.id === vormId) ?? null : null;
  const gebouwd = bouwAanmaakVelden({
    naam: nieuwNaam, leverancierId, eenheid, vorm: vormTekst, inhoud, inhoudEenheid, artikelnummer, prijs, metPrijs: isManager,
  });
  const inhoudScheef = (inhoud.trim() !== '') !== !!inhoudEenheid;

  const kies = (s: BordSuggestie) => {
    const vormen = bereidVormen(s.vormen);
    const enige = vormen.length === 1 && !vormen[0].geblokkeerd ? vormen[0] : null;
    setZoekTekst(s.naam);
    setGekozen({ ...s, vormen });
    setVormId(enige?.id ?? null);
    setSuggesties([]);
  };

  return <Tabs value={tab} onValueChange={(v) => setTab(v as 'koppel' | 'nieuw')}>
    <TabsList className="grid h-auto w-full grid-cols-2 p-1 [&>button]:min-h-11 [&>button]:min-w-0 [&>button]:px-2">
      <TabsTrigger value="koppel" className="whitespace-normal text-center leading-tight">Koppel aan artikel</TabsTrigger>
      <TabsTrigger value="nieuw" className="whitespace-normal text-center leading-tight">Nieuw artikel</TabsTrigger>
    </TabsList>
    <TabsContent value="koppel" className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">Zoek een artikel dat je al kent.</p>
      <div className="space-y-2">
        <Label htmlFor="koppel-zoek">Zoek artikel</Label>
        <Input
          id="koppel-zoek"
          value={zoekTekst}
          onChange={(e) => {
            const v = e.target.value;
            setZoekTekst(v);
            if (gekozen && v !== gekozen.naam) { setGekozen(null); setVormId(null); }
          }}
          className="h-11 text-base"
          placeholder="Naam van het artikel"
          aria-label="Zoek artikel"
        />
        {suggesties.length > 0 && <div role="listbox" aria-label="Suggesties" className="overflow-hidden rounded-polar-md border border-border">
          {suggesties.map((s) => {
            const sub = suggestieOnderschrift(s, soorten, leveranciers);
            return <Button variant="ghost" key={s.artikel_id} type="button" role="option" onClick={() => kies(s)} className="block h-auto min-h-11 w-full justify-start rounded-none px-3 py-2 text-left">
              <span className="block text-sm font-medium text-foreground">{s.naam}</span>
              {sub && <span className="block text-xs font-normal text-muted-foreground">{sub}</span>}
            </Button>;
          })}
        </div>}
      </div>
      {gekozen && gekozen.vormen.length > 1 && renderVormKeuze(bereidVormen(gekozen.vormen), vormId, (v) => setVormId(v.id))}
      {gekozenVorm && <p className="text-sm text-muted-foreground">{gekozen.naam} · {vormLeverancier(gekozenVorm, leveranciers)}</p>}
      <Button className="h-12 w-full" disabled={!kanOpslaan || bezig || !gekozen || !gekozenVorm || !!gekozenVorm.geblokkeerd} onClick={() => {
        if (!gekozen || !gekozenVorm) return;
        void onKoppel({ artikelId: gekozen.artikel_id, artikelVormId: gekozenVorm.id, leverancierNaam: vormLeverancier(gekozenVorm, leveranciers), artikelNaam: gekozen.naam });
      }}>Koppelen</Button>
    </TabsContent>
    <TabsContent value="nieuw" className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">Maak een artikel en koppel het meteen.</p>
      <div className="space-y-2">
        <Label htmlFor="nieuw-naam">Naam</Label>
        <Input id="nieuw-naam" value={nieuwNaam} onChange={(e) => setNieuwNaam(e.target.value)} className="h-11 text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nieuw-leverancier">Leverancier</Label>
        <Select value={leverancierId || undefined} onValueChange={setLeverancierId}>
          <SelectTrigger id="nieuw-leverancier" className="h-11 text-base" aria-label="Leverancier"><SelectValue placeholder="Kies leverancier" /></SelectTrigger>
          <SelectContent>
            {leveranciersKeuze.map((l) => <SelectItem key={l.id} value={l.id} className="min-h-11">{leverancierKeuzeLabel(l)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Eenheid</Label>
        {renderSoortKeuze(eenheid, setEenheid)}
      </div>
      <div className="space-y-2">
        <Label htmlFor="nieuw-vorm">Omschrijving van de verpakking</Label>
        <Input id="nieuw-vorm" value={vormTekst} onChange={(e) => setVormTekst(e.target.value)} placeholder="bijv. bakje 125 g" className="h-11 text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nieuw-inhoud">Inhoud</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input id="nieuw-inhoud" value={inhoud} inputMode="decimal" onChange={(e) => setInhoud(e.target.value.replace(/[^0-9.,]/g, ''))} className="h-11 w-28 text-base" aria-label="Inhoud" />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Inhoud-eenheid">
            {INHOUD_EENHEDEN.map((e) => <Button key={e} type="button" variant={inhoudEenheid === e ? 'default' : 'outline'} className="h-11 px-3.5" onClick={() => setInhoudEenheid(inhoudEenheid === e ? null : e)}>{e}</Button>)}
          </div>
        </div>
        {inhoudScheef && <p className="text-sm text-muted-foreground">Vul getal en eenheid allebei in, of laat allebei leeg.</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="nieuw-nummer">Artikelnummer</Label>
        <Input id="nieuw-nummer" value={artikelnummer} onChange={(e) => setArtikelnummer(e.target.value)} className="h-11 text-base" />
      </div>
      {isManager && <div className="space-y-2">
        <Label htmlFor="nieuw-prijs">Prijs</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
          <Input id="nieuw-prijs" value={prijs} inputMode="decimal" aria-label="Prijs" placeholder="0,00" className="h-11 pl-8 text-base" onChange={(e) => {
            const v = e.target.value.replace('.', ',');
            if (v === '' || /^\d+,?\d{0,2}$/.test(v)) setPrijs(v);
          }} />
        </div>
      </div>}
      <Button className="h-12 w-full" disabled={!kanOpslaan || bezig || !gebouwd.ok} onClick={() => { if (gebouwd.ok) void onAanmaken(gebouwd.velden); }}>Aanmaken en koppelen</Button>
    </TabsContent>
  </Tabs>;
}
