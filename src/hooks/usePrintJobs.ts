import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  buildRecipeLabelZpl,
  buildStickerOmschrijving,
  type RecipeForLabel,
} from '@/lib/labelZpl';

export interface PrintableRecipe extends RecipeForLabel {
  id: string;
}

function fmtStickerDate(d: Date): string {
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '');
}

export function useCreatePrintJob() {
  return useMutation({
    mutationFn: async (recipe: PrintableRecipe) => {
      const zpl = buildRecipeLabelZpl(recipe);
      const dagen = recipe.tht_dagen ?? 3;
      const today = new Date();
      const later = new Date(today);
      later.setDate(later.getDate() + dagen);
      const label_omschrijving = buildStickerOmschrijving({
        type: 'bereid',
        naam: recipe.name,
        datum1: fmtStickerDate(today),
        datum2: fmtStickerDate(later),
      });
      const { data, error } = await supabase
        .from('print_jobs')
        .insert({
          recipe_id: recipe.id,
          zpl,
          label_omschrijving,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Sticker naar printer gestuurd');
    },
    onError: (e: any) => {
      toast.error(e?.message ?? 'Kon sticker niet aanmaken');
    },
  });
}
