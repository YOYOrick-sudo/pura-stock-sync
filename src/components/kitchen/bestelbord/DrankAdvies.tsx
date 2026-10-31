import { ChevronDown, Info, Wine } from 'lucide-react';
import { LaadRijen, LijstKaart, SectieKop, TikIcoon } from '@/components/pura';
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

export function DrankAdviesInhoud({ regels }: { regels: DrankAdviesRegel[] }) {
  return <div className="divide-y divide-border">
    {groepen.map(({ groep, titel }) => <section key={groep} aria-label={titel}>
      <div className="px-4 pt-2 lg:px-6"><SectieKop titel={titel} /></div>
      <div className="divide-y divide-border">
        {regels.filter((r) => r.groep === groep).map((r, i) => <div key={`${r.artikel}-${i}`} className="flex min-w-0 items-center gap-2 px-4 py-2 lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words text-sm font-medium">{r.artikel}</p>
            <p className="text-xs tabular-nums text-muted-foreground">{getal(r.per_week)} {r.eenheid}</p>
          </div>
          <p className="max-w-32 break-words text-right text-sm tabular-nums">{getal(r.advies_per_week)} × {r.bestel_eenheid}</p>
          {(r.aanname || r.toelichting) && <Popover>
            <PopoverTrigger asChild><TikIcoon aria-label={`Info ${r.artikel}`} className="text-muted-foreground"><Info /></TikIcoon></PopoverTrigger>
            <PopoverContent className="space-y-1 text-sm">
              {r.aanname && <p className="font-medium">aanname, keuken checkt</p>}
              {r.toelichting && <p>{r.toelichting}</p>}
            </PopoverContent>
          </Popover>}
        </div>)}
      </div>
    </section>)}
  </div>;
}

export function DrankAdvies({ vestiging }: { vestiging: string }) {
  const advies = useDrankAdvies(vestiging);
  if (advies.isError || (!advies.isLoading && !advies.data?.length)) return null;
  return <LijstKaart><Collapsible className="group/drank">
    <CollapsibleTrigger asChild>
      <Button type="button" variant="ghost" size="touch" className="h-auto min-h-12 w-full justify-between px-4 py-2 lg:px-6">
        <span className="flex min-w-0 items-center gap-2"><Wine className="size-4 shrink-0 text-muted-foreground" /><span className="truncate">Drankadvies per week</span></span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground group-data-[state=open]/drank:rotate-180" />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>{advies.isLoading ? <LaadRijen /> : <DrankAdviesInhoud regels={advies.data ?? []} />}</CollapsibleContent>
  </Collapsible></LijstKaart>;
}