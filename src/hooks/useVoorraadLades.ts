import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Eén lade van de koelwerkbank: een fysiek vak dat je opentrekt. */
export interface VoorraadLade {
  id: string;
  vestiging: string;
  plek: string;
  naam: string;
  kolom: number;
  rij: number;
  volgorde: number;
  actief: boolean;
  /** 'reserve' = hier staan de reservebakjes; die lades tel je eerst. */
  rol?: 'werk' | 'reserve';
}

export const KOLOM_LABEL: Record<number, string> = { 1: 'Links', 2: 'Midden', 3: 'Rechts' };
export const RIJ_LABEL: Record<number, string> = { 1: 'boven', 2: 'midden', 3: 'onder' };

export function positieLabel(lade: Pick<VoorraadLade, 'kolom' | 'rij'>): string {
  return `${KOLOM_LABEL[lade.kolom] ?? ''} ${RIJ_LABEL[lade.rij] ?? ''}`.trim();
}

/** Alle lades van een vestiging, in looproutevolgorde. */
export function useVoorraadLades(vestiging: string | null | undefined, plek = 'werkbank') {
  return useQuery({
    queryKey: ['voorraad-lades', vestiging, plek],
    enabled: !!vestiging,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<VoorraadLade[]> => {
      const { data, error } = await supabase
        .from('voorraad_lades')
        .select('*')
        .eq('vestiging', vestiging!)
        .eq('plek', plek)
        .order('volgorde');
      if (error) throw error;
      return (data ?? []) as unknown as VoorraadLade[];
    },
  });
}

/** Lades hernoemen, aan/uit zetten en producten erin plaatsen. */
export function useLadeMutaties(vestiging: string) {
  const qc = useQueryClient();
  const ververs = () => {
    qc.invalidateQueries({ queryKey: ['voorraad-lades', vestiging] });
    qc.invalidateQueries({ queryKey: ['koelcel-check-items', vestiging] });
  };

  const hernoem = useMutation({
    mutationFn: async ({ id, naam }: { id: string; naam: string }) => {
      const { error } = await supabase.from('voorraad_lades').update({ naam }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: ververs,
  });

  const zetActief = useMutation({
    mutationFn: async ({ id, actief }: { id: string; actief: boolean }) => {
      const { error } = await supabase.from('voorraad_lades').update({ actief }).eq('id', id);
      if (error) throw error;
      if (!actief) {
        // Producten uit een uitgezette lade komen terug bij "nog niet ingedeeld".
        const { error: e2 } = await supabase
          .from('koelcel_check_items')
          .update({ lade_id: null })
          .eq('lade_id', id);
        if (e2) throw e2;
      }
    },
    onSuccess: ververs,
  });

  /** Eén product naar een lade verplaatsen (of eruit halen met null). */
  const verplaatsItem = useMutation({
    mutationFn: async ({
      itemId,
      ladeId,
      volgorde,
    }: {
      itemId: string;
      ladeId: string | null;
      volgorde?: number;
    }) => {
      const patch: Record<string, unknown> = { lade_id: ladeId };
      if (volgorde !== undefined) patch.volgorde = volgorde;
      const { error } = await supabase.from('koelcel_check_items').update(patch).eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async ({ itemId, ladeId }) => {
      const key = ['koelcel-check-items', vestiging];
      await qc.cancelQueries({ queryKey: key });
      const vorige = qc.getQueryData<any[]>(key);
      qc.setQueryData<any[]>(key, (oud) =>
        (oud ?? []).map((i) => (i.id === itemId ? { ...i, lade_id: ladeId } : i)),
      );
      return { vorige, key };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.vorige) qc.setQueryData(ctx.key, ctx.vorige);
    },
    onSettled: ververs,
  });

  /** Volgorde binnen een lade opslaan. */
  const zetVolgorde = useMutation({
    mutationFn: async (regels: { id: string; volgorde: number }[]) => {
      for (const r of regels) {
        const { error } = await supabase
          .from('koelcel_check_items')
          .update({ volgorde: r.volgorde })
          .eq('id', r.id);
        if (error) throw error;
      }
    },
    onSuccess: ververs,
  });

  /** Lade aanwijzen als werklade of reservelade. */
  const zetRol = useMutation({
    mutationFn: async ({ id, rol }: { id: string; rol: 'werk' | 'reserve' }) => {
      const { error } = await supabase.from('voorraad_lades').update({ rol }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: ververs,
  });

  /** Hoeveel reservebakjes er van een product achter de hand horen te staan. */
  const zetReserveDoel = useMutation({
    mutationFn: async ({ itemId, aantal }: { itemId: string; aantal: number }) => {
      const { error } = await supabase
        .from('koelcel_check_items')
        .update({ reserve_doel: Math.max(Math.round(aantal), 0) })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: ververs,
  });

  /** Tot hoever het werkbakje gevuld hoort te zijn: vol of half. */
  const zetVulnorm = useMutation({
    mutationFn: async ({ itemId, vulnorm }: { itemId: string; vulnorm: 'vol' | 'half' }) => {
      const { error } = await supabase
        .from('koelcel_check_items')
        .update({ vulnorm })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: ververs,
  });

  return { hernoem, zetActief, verplaatsItem, zetVolgorde, zetRol, zetReserveDoel, zetVulnorm };
}
