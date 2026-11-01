import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { maandVensters, voegDagen, type OmzetRegel } from '@/lib/omzet';

const PAGINA = 1000;
const TEGELIJK = 4;

type RuweRij = { vestiging: string; werkdag: string; omzet_excl: number | null; aantal_bonnen: number | null };

async function leesPagina(van: string, tot: string, vanaf: number): Promise<RuweRij[]> {
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
  return data ?? [];
}

/** Eén maandvenster, doorgepagineerd tot de pagina kleiner is dan 1000. */
async function leesVenster(van: string, tot: string): Promise<OmzetRegel[]> {
  const uit: OmzetRegel[] = [];
  for (let pagina = 0; pagina < 40; pagina += 1) {
    const data = await leesPagina(van, tot, pagina * PAGINA);
    for (const rij of data) {
      uit.push({
        vestiging: rij.vestiging,
        werkdag: rij.werkdag,
        omzetExcl: Number(rij.omzet_excl ?? 0),
        aantalBonnen: Number(rij.aantal_bonnen ?? 0),
      });
    }
    if (data.length < PAGINA) return voegDagen(uit);
  }
  throw new Error('Te veel kassaregels in één maand.');
}

/** Alle jaren met kassadata, per maand en in kleine groepjes, daarna tot dagen opgeteld. */
export async function leesAlleOmzet(): Promise<OmzetRegel[]> {
  const [eerste, laatste] = await Promise.all([
    supabase.from('omzet_uren').select('werkdag').eq('is_demo', false).order('werkdag', { ascending: true }).limit(1),
    supabase.from('omzet_uren').select('werkdag').eq('is_demo', false).order('werkdag', { ascending: false }).limit(1),
  ]);
  if (eerste.error) throw eerste.error;
  if (laatste.error) throw laatste.error;
  const van = eerste.data?.[0]?.werkdag;
  const tot = laatste.data?.[0]?.werkdag;
  if (!van || !tot) return [];

  const vensters = maandVensters(van, tot);
  const dagen: OmzetRegel[] = [];
  for (let i = 0; i < vensters.length; i += TEGELIJK) {
    const groep = vensters.slice(i, i + TEGELIJK);
    const stukken = await Promise.all(groep.map((venster) => leesVenster(venster.van, venster.tot)));
    dagen.push(...stukken.flat());
  }
  return voegDagen(dagen);
}

export function useOmzetUren() {
  return useQuery({
    queryKey: ['omzet-uren', 'alles'],
    queryFn: leesAlleOmzet,
    staleTime: 5 * 60 * 1000,
  });
}
