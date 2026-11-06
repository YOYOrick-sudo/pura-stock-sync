/** PostgREST levert standaard hoogstens 1000 rijen. Vraag verderop door tot de pagina korter is. */
export const PAGINA_GROOTTE = 1000;
const MAX_PAGINAS = 50;

export async function allesOphalen<T>(
  ophalen: (van: number, tot: number) => Promise<T[]>,
  paginaGrootte = PAGINA_GROOTTE,
): Promise<T[]> {
  const alles: T[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const van = pagina * paginaGrootte;
    const rij = await ophalen(van, van + paginaGrootte - 1);
    // Range genegeerd: de server stuurde meteen alles terug.
    if (rij.length > paginaGrootte) return rij;
    alles.push(...rij);
    if (rij.length < paginaGrootte) return alles;
  }
  return alles;
}
