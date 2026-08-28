import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';

export const VESTIGINGEN = ['West', 'Midsland'] as const;
export type Vestiging = (typeof VESTIGINGEN)[number];

export type KoppelSoort = 'recept' | 'ingredient';

const CONFIG: Record<KoppelSoort, { tabel: string; fk: string }> = {
  recept: { tabel: 'recept_locaties', fk: 'recept_id' },
  ingredient: { tabel: 'artikel_locaties', fk: 'artikel_id' },
};

/** De actieve vestiging van de ingelogde gebruiker (West / Midsland), of null. */
export function useMijnVestiging() {
  const { userLocation, loading } = useUserLocation();
  return {
    data: (userLocation || null) as string | null,
    isLoading: loading,
  };
}

/**
 * Map van item-id → set met vestigingen waar het item aan staat.
 * Gedeelde bibliotheek: het item zelf is van het bedrijf, deze koppeling is per keuken.
 */
export function useVestigingKoppelingen(soort: KoppelSoort) {
  const { tabel, fk } = CONFIG[soort];
  return useQuery({
    queryKey: ['vestiging-koppeling', soort],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tabel)
        .select(`${fk}, vestiging, is_actief`);
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      (data ?? []).forEach((row: any) => {
        if (!row.is_actief) return;
        const key = row[fk] as string;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add(row.vestiging as string);
      });
      return map;
    },
  });
}

export function useSetVestigingKoppeling(soort: KoppelSoort) {
  const { tabel, fk } = CONFIG[soort];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      vestiging,
      actief,
    }: {
      id: string;
      vestiging: Vestiging;
      actief: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from(tabel)
        .upsert(
          { [fk]: id, vestiging, is_actief: actief },
          { onConflict: `${fk},vestiging` },
        );
      if (error) throw error;
    },
    onMutate: async ({ id, vestiging, actief }) => {
      const key = ['vestiging-koppeling', soort];
      await qc.cancelQueries({ queryKey: key });
      const vorige = qc.getQueryData<Map<string, Set<string>>>(key);
      if (vorige) {
        const next = new Map(vorige);
        const set = new Set(next.get(id) ?? []);
        if (actief) set.add(vestiging);
        else set.delete(vestiging);
        next.set(id, set);
        qc.setQueryData(key, next);
      }
      return { vorige };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.vorige) qc.setQueryData(['vestiging-koppeling', soort], ctx.vorige);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['vestiging-koppeling', soort] });
    },
  });
}
