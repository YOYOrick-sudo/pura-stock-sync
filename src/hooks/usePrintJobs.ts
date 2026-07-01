import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  buildRecipeLabelZpl,
  buildLabelOmschrijving,
  type RecipeForLabel,
} from '@/lib/labelZpl';

export interface PrintableRecipe extends RecipeForLabel {
  id: string;
}

export function useCreatePrintJob() {
  return useMutation({
    mutationFn: async (recipe: PrintableRecipe) => {
      const zpl = buildRecipeLabelZpl(recipe);
      const label_omschrijving = buildLabelOmschrijving(recipe.name);
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
