import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { KoelcelCheckItem } from '@/hooks/useKoelcelCheck';

const PLEKKEN: { plek: string; label: string }[] = [
  { plek: 'koelcel', label: 'Koelcel' },
  { plek: 'vriezer', label: 'Vriescel' },
  { plek: 'magazijn', label: 'Magazijn' },
];

/** Producten in koelcel, vriescel en magazijn: aan/uit, doel en omschrijving. */
export function PlekItemsBeheer({ vestiging }: { vestiging: string }) {
  const qc = useQueryClient();
  const [plek, setPlek] = useState('koelcel');

  const { data: items = [] } = useQuery({
    queryKey: ['plek-items-beheer', vestiging],
    queryFn: async (): Promise<KoelcelCheckItem[]> => {
      const { data, error } = await supabase
        .from('koelcel_check_items')
        .select('*')
        .eq('vestiging', vestiging)
        .in('plek', PLEKKEN.map((p) => p.plek))
        .order('volgorde');
      if (error) throw error;
      return (data ?? []) as unknown as KoelcelCheckItem[];
    },
  });

  const wijzig = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from('koelcel_check_items').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plek-items-beheer', vestiging] });
      qc.invalidateQueries({ queryKey: ['koelcel-check-items', vestiging] });
      toast.success('Opgeslagen');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Opslaan mislukt'),
  });

  const lijst = useMemo(
    () =>
      items
        .filter((i) => i.plek === plek)
        .sort((a, b) => (a.categorie ?? '').localeCompare(b.categorie ?? '') || a.naam.localeCompare(b.naam)),
    [items, plek],
  );

  return (
    <section className="space-y-3 rounded-[20px] border border-border bg-card p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Koelcel, vriescel en magazijn</h2>
        <p className="text-sm text-muted-foreground">
          Zet producten aan of uit (bijv. bij drukte) en pas aan hoeveel er moet liggen.
        </p>
      </div>

      <div className="flex gap-2">
        {PLEKKEN.map((p) => (
          <button
            key={p.plek}
            type="button"
            onClick={() => setPlek(p.plek)}
            className={`min-h-[44px] flex-1 rounded-[14px] border px-3 text-sm font-semibold ${
              plek === p.plek ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border">
        {lijst.map((i) => (
          <li key={i.id} className={`flex flex-wrap items-center gap-2 py-2 ${i.actief ? '' : 'opacity-60'}`}>
            <div className="min-w-[140px] flex-1">
              <div className="text-sm font-medium text-foreground">{i.naam}</div>
              <div className="text-xs text-muted-foreground">
                {i.categorie ?? '—'}
                {i.actief ? '' : ' · uit'}
              </div>
            </div>
            <Input
              key={`d-${i.id}-${i.doel_aantal}`}
              defaultValue={String(i.doel_aantal)}
              inputMode="decimal"
              aria-label={`Doel ${i.naam}`}
              className="h-11 w-16 text-center"
              onBlur={(e) => {
                const n = Number(e.target.value.replace(',', '.'));
                if (Number.isFinite(n) && n >= 0 && n !== Number(i.doel_aantal))
                  wijzig.mutate({ id: i.id, patch: { doel_aantal: n } });
              }}
            />
            <span className="text-xs text-muted-foreground w-14">{i.eenheid}</span>
            <Input
              key={`f-${i.id}-${i.formaat ?? ''}`}
              defaultValue={i.formaat ?? ''}
              placeholder="omschrijving"
              aria-label={`Omschrijving ${i.naam}`}
              className="h-11 w-full sm:w-56"
              onBlur={(e) => {
                const v = e.target.value.trim() || null;
                if (v !== (i.formaat ?? null)) wijzig.mutate({ id: i.id, patch: { formaat: v } });
              }}
            />
            <div className="flex min-h-[44px] items-center">
              <Switch
                checked={i.actief}
                aria-label={`${i.naam} ${i.actief ? 'uitzetten' : 'aanzetten'}`}
                onCheckedChange={(v) => wijzig.mutate({ id: i.id, patch: { actief: v } })}
              />
            </div>
          </li>
        ))}
        {lijst.length === 0 && <li className="py-4 text-sm text-muted-foreground">Geen producten.</li>}
      </ul>
    </section>
  );
}
