import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';
import {
  buildRecipeLabelZpl,
  buildStickerOmschrijving,
  type RecipeForLabel,
} from '@/lib/labelZpl';

export interface PrintableRecipe extends RecipeForLabel {
  id: string;
  aantal?: number;
}

function fmtStickerDate(d: Date): string {
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '');
}

export function useCreatePrintJob() {
  const { userLocation } = useUserLocation();
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
      const n = Math.max(1, Math.min(50, recipe.aantal ?? 1));
      const rows = Array.from({ length: n }, () => ({
        recipe_id: recipe.id,
        zpl,
        label_omschrijving,
        vestiging: userLocation || null,
        bron: 'recept',
      }));
      const { error } = await supabase.from('print_jobs').insert(rows);
      if (error) throw error;
      return { count: n };
    },
    onSuccess: (res) => {
      toast.success(
        res.count > 1 ? `${res.count} stickers naar printer gestuurd` : 'Sticker naar printer gestuurd',
      );
    },
    onError: (e: any) => {
      toast.error(e?.message ?? 'Kon sticker niet aanmaken');
    },
  });
}
