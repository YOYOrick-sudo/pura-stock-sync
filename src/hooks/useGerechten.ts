import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GerechtLabel } from '@/lib/gerecht-labels';

export interface Gerecht {
  id: string;
  naam: string;
  categorie: string;
  groep: 'standaard' | 'special';
  prijs: number | null;
  labels: GerechtLabel[];
  gecontroleerd: boolean;
  notitie: string | null;
  is_gearchiveerd: boolean;
  sort_order: number;
  vestiging: string | null;
}

export type GerechtInput = Omit<Gerecht, 'id'> & { id?: string };

export function useGerechten(categorie: string, toonGearchiveerd = false) {
  return useQuery({
    queryKey: ['gerechten', categorie, toonGearchiveerd],
    queryFn: async () => {
      let q = (supabase as any)
        .from('gerechten')
        .select('*')
        .eq('categorie', categorie)
        .order('groep', { ascending: true })
        .order('sort_order', { ascending: true });
      if (!toonGearchiveerd) q = q.eq('is_gearchiveerd', false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Gerecht[];
    },
  });
}

export function useUpsertGerecht() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GerechtInput) => {
      const payload = {
        naam: input.naam.trim(),
        categorie: input.categorie,
        groep: input.groep,
        prijs: input.prijs,
        labels: input.labels,
        gecontroleerd: input.gecontroleerd,
        notitie: input.notitie?.trim() || null,
        is_gearchiveerd: input.is_gearchiveerd,
        sort_order: input.sort_order,
        vestiging: input.vestiging,
      };
      const q = input.id
        ? (supabase as any).from('gerechten').update(payload).eq('id', input.id)
        : (supabase as any).from('gerechten').insert(payload);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gerechten'] }),
  });
}

export function useArchiveerGerecht() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archiveren }: { id: string; archiveren: boolean }) => {
      const { error } = await (supabase as any)
        .from('gerechten')
        .update({ is_gearchiveerd: archiveren })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gerechten'] }),
  });
}
