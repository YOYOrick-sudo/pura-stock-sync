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

export interface CreateStickerJobInput extends StickerLabelInput {
  tht_dagen?: number | null;
}

export function useCreateStickerPrintJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStickerJobInput) => {
      const zpl = buildStickerZpl(input);
      const label_omschrijving = buildStickerOmschrijving(input);

      const { data: job, error: jobErr } = await supabase
        .from('print_jobs')
        .insert({
          recipe_id: null,
          zpl,
          label_omschrijving,
        })
        .select()
        .single();
      if (jobErr) throw jobErr;

      const { error: bumpErr } = await supabase.rpc('sticker_producten_bump', {
        _naam: input.naam,
        _type: input.type,
        _tht: input.type === 'vrij' ? null : (input.tht_dagen ?? null),
      });
      if (bumpErr) throw bumpErr;

      return job;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sticker-suggesties'] });
      qc.invalidateQueries({ queryKey: ['print-jobs-today'] });
    },
  });
}

export interface PrintJobToday {
  id: string;
  zpl: string;
  label_omschrijving: string | null;
  status: string;
  created_at: string;
  geprint_op: string | null;
  foutmelding: string | null;
}

export function usePrintJobsToday() {
  return useQuery({
    queryKey: ['print-jobs-today'],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('print_jobs')
        .select('id, zpl, label_omschrijving, status, created_at, geprint_op, foutmelding')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as PrintJobToday[];
    },
    refetchInterval: 5000,
  });
}

export function useReprintJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (job: Pick<PrintJobToday, 'zpl' | 'label_omschrijving'>) => {
      const { data, error } = await supabase
        .from('print_jobs')
        .insert({
          recipe_id: null,
          zpl: job.zpl,
          label_omschrijving: job.label_omschrijving,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['print-jobs-today'] });
    },
  });
}
