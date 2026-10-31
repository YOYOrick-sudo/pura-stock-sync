import { ChevronDown, Info, Wine } from 'lucide-react';
import { LaadRijen, LijstKaart, SectieKop, TikIcoon } from '@/components/pura';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDrankAdvies, type DrankAdviesRegel } from '@/hooks/useOntvangstV2';

const groepen = [
  { groep: 'D1 flessen', titel: 'Flessen' },
  { groep: 'D2 koffie', titel: 'Koffie' },
  { groep: 'D3 melk', titel: 'Melk' },
] as const;
const getal = (waarde: number | null) => waarde == null ? '—' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(waarde);
const meervouden: Record<string, string> = { doos: 'dozen', krat: 'kratten', zak: 'zakken', fles: 'flessen', blik: 'blikken', pak: 'pakken' };
/** Getal plus juiste enkel/meervoudsvorm; formaat tussen haakjes ('36 pakken (1 L)'). Onbekende eenheden ongewijzigd. */
export function hoeveelheid(aantal: number | null, eenheid: string | null) {
  if (!eenheid) return getal(aantal);
  const [eerste, ...rest] = eenheid.split(' ');
  const meervoud = meervouden[eerste.toLowerCase()];
  if (!meervoud) return `${getal(aantal)} ${eenheid}`;
  const vorm = aantal === 1 ? eerste : meervoud;
  return `${getal(aantal)} ${vorm}${rest.length ? ` (${rest.join(' ')})` : ''}`;
}
/** Korte uitleg onder de stand: telling met mutaties, of schatting zonder telling. */
export function uitlegRegel(r: DrankAdviesRegel) {
  if (r.telling_aantal != null) {
    const [, mm, dd] = (r.telling_datum ?? '').split('-');
    const datum = dd && mm ? ` op ${dd}-${mm}` : '';
    return `geteld ${getal(r.telling_aantal)}${datum} · +${getal(r.ontvangen_sinds ?? 0)} besteld · −${getal(r.verbruik_sinds ?? 0)} verbruik`;
  }
  if (r.groep === 'D3 melk') return null;
  return r.advies_per_week != null || r.per_week != null ? 'geschat op weekverbruik' : null;
}
const eerstTellen = (r: DrankAdviesRegel) => !!r.toelichting?.trim().toLowerCase().startsWith('eerst tellen');

function DrankRij({ r }: { r: DrankAdviesRegel }) {
  const uitleg = uitlegRegel(r);
  const info = r.aanname || r.toelichting || r.stand != null || uitleg;
  return <div className="flex min-w-0 items-center gap-2 px-4 py-2 lg:px-6">
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 break-words text-sm font-medium">{r.artikel}</p>
      <p className="text-xs tabular-nums text-muted-foreground">{hoeveelheid(r.per_week, r.eenheid)}</p>
    </div>
    {r.bestellen
      ? <p className="shrink-0 whitespace-nowrap text-right text-sm tabular-nums">{hoeveelheid(r.advies_per_week, r.bestel_eenheid)}</p>
      : eerstTellen(r) && <Badge variant="secondary" className="shrink-0 whitespace-nowrap">eerst tellen</Badge>}
    {info && <Popover>
      <PopoverTrigger asChild><TikIcoon aria-label={`Info ${r.artikel}`} className="text-muted-foreground"><Info /></TikIcoon></PopoverTrigger>
      <PopoverContent className="space-y-1 text-sm">
        {r.stand != null && <p className="tabular-nums">stand {getal(r.stand)}</p>}
        {uitleg && <p className="text-xs tabular-nums text-muted-foreground">{uitleg}</p>}
        {r.aanname && <p className="font-medium">aanname, keuken checkt</p>}
        {r.toelichting && <p>{r.toelichting}</p>}
      </PopoverContent>
    </Popover>}
  </div>;
}

function Rijen({ regels }: { regels: DrankAdviesRegel[] }) {
  return <div className="divide-y divide-border">{regels.map((r, i) => <DrankRij key={`${r.artikel}-${i}`} r={r} />)}</div>;
}

export function DrankAdviesInhoud({ regels }: { regels: DrankAdviesRegel[] }) {
  if (!regels.length) return <p className="px-4 py-3 text-sm text-muted-foreground lg:px-6">Niets te bestellen</p>;
  return <div className="divide-y divide-border">
    {groepen.map(({ groep, titel }) => {
      const eigen = regels.filter((r) => r.groep === groep);
      const bestellen = eigen.filter((r) => r.bestellen);
      const rest = eigen.filter((r) => !r.bestellen);
      if (!eigen.length) return null;
      return <section key={groep} aria-label={titel}>
        <div className="px-4 pt-2 lg:px-6"><SectieKop titel={titel} /></div>
        {rest.length > 0 && bestellen.length > 0 && <p className="px-4 pt-1 text-xs text-muted-foreground lg:px-6">Deze week bestellen ({bestellen.length})</p>}
        {bestellen.length ? <Rijen regels={bestellen} /> : <p className="px-4 py-2 text-sm text-muted-foreground lg:px-6">Niets te bestellen</p>}
        {rest.length > 0 && <Collapsible className="group/geen">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="touch" className="w-full justify-between px-4 text-muted-foreground lg:px-6">
              <span className="truncate">Geen bestelling nodig ({rest.length})</span>
              <ChevronDown className="group-data-[state=open]/geen:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent><Rijen regels={rest} /></CollapsibleContent>
        </Collapsible>}
      </section>;
    })}
  </div>;
}

export function DrankAdvies({ vestiging }: { vestiging: string }) {
  const advies = useDrankAdvies(vestiging);
  if (advies.data === null) return null;
  return <LijstKaart><Collapsible defaultOpen className="group/drank">
    <CollapsibleTrigger asChild>
      <Button type="button" variant="ghost" size="touch" className="h-auto min-h-12 w-full justify-between px-4 py-2 lg:px-6">
        <span className="flex min-w-0 items-center gap-2"><Wine className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">Drankadvies per week</span></span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground group-data-[state=open]/drank:rotate-180" />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      {advies.isLoading ? <LaadRijen /> : advies.isError
        ? <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <p className="text-sm text-muted-foreground">Drankadvies kon niet geladen worden. Probeer het later opnieuw.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void advies.refetch()}>Opnieuw</Button>
          </div>
        : <DrankAdviesInhoud regels={advies.data ?? []} />}
    </CollapsibleContent>
  </Collapsible></LijstKaart>;
}
