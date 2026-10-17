import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useKoelcelCheckItems,
  vervolgactieVoorRegel,
  diepsteBron,
  type KoelcelCheckItem,
} from '@/hooks/useKoelcelCheck';
import { bronVoorSoort, soortVanBron, SOORT_LABEL, type SluitSoort } from '@/lib/sluitronde';

const PLEK_KORT: Record<string, string> = {
  werkbank: 'Lade',
  werkblad: 'Toppings',
  koelcel: 'Koelcel',
  magazijn: 'Magazijn',
  vriezer: 'Vriescel',
};

const EIND_KORT: Record<string, string> = {
  mep: 'MEP',
  bestelbord: 'Bestelbord',
  midsland: 'Midsland',
};

/** "Lade → Koelcel → Magazijn → Bestelbord" */
function ketenStappen(item: KoelcelCheckItem, alle: KoelcelCheckItem[]): string[] {
  const stappen = [PLEK_KORT[item.plek] ?? item.plek];
  // Snijwerk en zelf maken gaan altijd rechtstreeks naar de MEP.
  if (soortVanBron(item.bron) !== 'pakken') return [...stappen, 'MEP'];
  let huidig = item;
  for (let i = 0; i < 5; i++) {
    const v = vervolgactieVoorRegel(huidig, alle);
    if (v.soort !== 'niveau') break;
    huidig = v.onderItem;
    stappen.push(PLEK_KORT[huidig.plek] ?? huidig.plek);
  }
  stappen.push(EIND_KORT[diepsteBron(item, alle).bestemming.soort] ?? '');
  return stappen;
}

const SOORTEN: SluitSoort[] = ['pakken', 'snijden', 'maken'];
const VULNORMEN = [
  { waarde: 'vol', label: 'Vol' },
  { waarde: 'half', label: 'Half' },
  { waarde: 'bodem', label: 'Bodempje' },
];

/** Per product in de lades en toppings: soort, wat genoeg is en de keten. */
export function KetenPerProduct({ vestiging }: { vestiging: string }) {
  const qc = useQueryClient();
  const { data: items = [] } = useKoelcelCheckItems(vestiging);
  const [zoek, setZoek] = useState('');

  const wijzig = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from('koelcel_check_items').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['koelcel-check-items', vestiging] });
      qc.invalidateQueries({ queryKey: ['plek-items-beheer', vestiging] });
      toast.success('Opgeslagen');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Opslaan mislukt'),
  });

  const lijst = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return items
      .filter((i) => (i.plek === 'werkbank' || i.plek === 'werkblad') && i.actief)
      .filter((i) => !q || i.naam.toLowerCase().includes(q))
      .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  }, [items, zoek]);

  return (
    <section className="space-y-3 rounded-[20px] border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Keten per product</h2>
        <p className="text-sm text-muted-foreground">
          Bepaalt de knop in de sluitronde: pakken uit de keten geeft "Bron op", snijden of maken geeft "Naar MEP".
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek product" className="h-11 pl-9" />
      </div>

      <ul className="divide-y divide-border">
        {lijst.map((i) => {
          const soort = soortVanBron(i.bron);
          const stappen = ketenStappen(i, items);
          const onvolledig = soort === 'pakken' && stappen.length <= 2;
          return (
            <li key={i.id} className="space-y-2 py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[15px] font-medium text-foreground">{i.naam}</span>
                <span className="text-xs text-muted-foreground">{PLEK_KORT[i.plek]}</span>
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {onvolledig && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                {stappen.join(' → ')}
                {onvolledig && <span className="text-warning"> · keten niet compleet</span>}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {SOORTEN.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      s !== soort && wijzig.mutate({ id: i.id, patch: { bron: bronVoorSoort(s, i.bron) } })
                    }
                    className={cn(
                      'min-h-[44px] rounded-[14px] border px-2 text-xs font-semibold',
                      s === soort ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {SOORT_LABEL[s]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Genoeg bij</span>
                {VULNORMEN.map((v) => (
                  <button
                    key={v.waarde}
                    type="button"
                    onClick={() => wijzig.mutate({ id: i.id, patch: { vulnorm: v.waarde } })}
                    className={cn(
                      'min-h-[44px] rounded-[14px] border px-3 text-xs font-semibold',
                      (i.vulnorm ?? 'vol') === v.waarde ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
                {soort !== 'pakken' && (
                  <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    MEP-aantal
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      defaultValue={i.batch_aantal ?? 1}
                      className="h-11 w-20"
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (n > 0 && n !== Number(i.batch_aantal ?? 1)) {
                          wijzig.mutate({ id: i.id, patch: { batch_aantal: n } });
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
