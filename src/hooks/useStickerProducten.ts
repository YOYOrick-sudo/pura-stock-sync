import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  buildStickerZpl,
  buildStickerOmschrijving,
  type StickerLabelInput,
  type StickerType,
} from '@/lib/labelZpl';

export interface StickerProduct {
  id: string;
  naam: string;
  laatst_type: StickerType | null;
  laatst_tht_dagen: number | null;
  keer_geprint: number;
}

function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useStickerSuggesties(term: string) {
  const q = useDebounced(term.trim(), 200);
  return useQuery({
    queryKey: ['sticker-suggesties', q.toLowerCase()],
    queryFn: async () => {
      let query = supabase
        .from('sticker_producten')
        .select('id, naam, laatst_type, laatst_tht_dagen, keer_geprint')
        .order('keer_geprint', { ascending: false })
        .limit(8);
      if (q.length >= 1) {
        query = query.ilike('naam', `%${q}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StickerProduct[];
    },
  });
}

export function useTopStickerProducten(limit = 9) {
  return useQuery({
    queryKey: ['sticker-top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sticker_producten')
        .select('id, naam, laatst_type, laatst_tht_dagen, keer_geprint')
        .order('keer_geprint', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as StickerProduct[];
    },
    staleTime: 30_000,
  });
}

export interface CreateStickerJobInput extends StickerLabelInput {
  tht_dagen?: number | null;
  aantal?: number;
  /** Waar de sticker vandaan komt: snel_printen | mep */
  bron?: string;
}

export function useCreateStickerPrintJob() {
  const qc = useQueryClient();
  const { userLocation } = useUserLocation();
  return useMutation({
    mutationFn: async (input: CreateStickerJobInput) => {
      const zpl = buildStickerZpl(input);
      const label_omschrijving = buildStickerOmschrijving(input);
      const n = Math.max(1, Math.min(50, input.aantal ?? 1));

      const rows = Array.from({ length: n }, () => ({
        recipe_id: null,
        zpl,
        label_omschrijving,
        vestiging: userLocation || null,
        bron: input.bron ?? 'snel_printen',
      }));
      const { error: jobErr } = await supabase.from('print_jobs').insert(rows);
      if (jobErr) throw jobErr;

      const { error: bumpErr } = await supabase.rpc('sticker_producten_bump', {
        _naam: input.naam,
        _type: input.type,
        _tht: input.type === 'vrij' ? null : (input.tht_dagen ?? null),
      });
      if (bumpErr) throw bumpErr;

      return { count: n };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sticker-suggesties'] });
      qc.invalidateQueries({ queryKey: ['sticker-top'] });
    },
  });
}
