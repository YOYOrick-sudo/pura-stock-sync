import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OmzetRegel } from '@/lib/omzet';

const PAGINA = 1000;
const MAX_PAGINAS = 100;

/** Leest omzet_uren. Geen schrijfactie. Demo-rijen blijven buiten de totalen. */
export async function leesOmzetUren(van: string, tot: string): Promise<OmzetRegel[]> {
  const uit: OmzetRegel[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const vanaf = pagina * PAGINA;
    const { data, error } = await supabase
      .from('omzet_uren')
      .select('vestiging, werkdag, omzet_excl, aantal_bonnen')
      .eq('is_demo', false)
      .gte('werkdag', van)
      .lte('werkdag', tot)
      .order('werkdag', { ascending: true })
      .order('vestiging', { ascending: true })
      .order('uur', { ascending: true })
      .range(vanaf, vanaf + PAGINA - 1);
    if (error) throw error;
    for (const rij of data ?? []) {
      uit.push({
        vestiging: rij.vestiging,
        werkdag: rij.werkdag,
        omzetExcl: Number(rij.omzet_excl ?? 0),
        aantalBonnen: Number(rij.aantal_bonnen ?? 0),
      });
    }
    if (!data || data.length < PAGINA) return uit;
  }
  throw new Error('Te veel kassaregels om in één keer te lezen.');
}

export function useOmzetUren(jaar: number) {
  const van = `${jaar - 1}-01-01`;
  const tot = `${jaar}-12-31`;
  return useQuery({
    queryKey: ['omzet-uren', van, tot],
    queryFn: () => leesOmzetUren(van, tot),
    staleTime: 5 * 60 * 1000,
  });
}
