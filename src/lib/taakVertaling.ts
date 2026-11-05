import { supabase } from '@/integrations/supabase/client';

export type TeVertalen = { title: string; description?: string | null };
export type Vertaling = { title_en: string | null; description_en: string | null };

// Onthoudt per taak de laatste automatische vertaling (deze sessie), zodat handwerk nooit overschreven wordt.
const laatsteAuto = new Map<string, string>();

export function onthoudAuto(id: string, titleEn: string | null) {
  if (titleEn) laatsteAuto.set(id, titleEn);
}

/** Mag de app de Engelse titel automatisch (opnieuw) invullen? Alleen als hij leeg is of door de app zelf is gezet. */
export function magAutoVertalen(huidigEn: string | null | undefined, vorigeAuto: string | undefined): boolean {
  const en = (huidigEn ?? '').trim();
  if (!en) return true;
  return vorigeAuto !== undefined && en === vorigeAuto;
}

export function magAutoVertalenVoor(id: string, huidigEn: string | null | undefined) {
  return magAutoVertalen(huidigEn, laatsteAuto.get(id));
}

export async function vertaalTaken(items: TeVertalen[]): Promise<Vertaling[] | null> {
  if (items.length === 0) return [];
  const { data, error } = await supabase.functions.invoke('translate-task', { body: { items } });
  if (error || !Array.isArray(data?.items)) {
    console.warn('Vertalen mislukt', error);
    return null;
  }
  return data.items as Vertaling[];
}
