export type LeverancierSoort = 'extern' | 'winkel' | 'intern';

const KANALEN = ['mail', 'telefoon', 'portal', 'api'] as const;

export function alsSoort(waarde: unknown): LeverancierSoort {
  return waarde === 'winkel' || waarde === 'intern' || waarde === 'extern' ? waarde : 'extern';
}

export function soortLabel(soort: unknown): string {
  const s = alsSoort(soort);
  if (s === 'winkel') return 'Zelf halen';
  if (s === 'intern') return 'Intern';
  return 'Extern';
}

/** Alleen een echt bestelkanaal van een externe leverancier mag worden weggeschreven. */
export function kanaalVoorOpslaan(soort: unknown, kanaal: string | null | undefined): string | null {
  if (alsSoort(soort) !== 'extern') return null;
  if (!kanaal || !(KANALEN as readonly string[]).includes(kanaal)) return null;
  return kanaal;
}

export function soortKolomOntbreekt(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const tekst = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return error.code === '42703' || error.code === 'PGRST204' || tekst.includes('soort');
}

export interface RouteLeverancier {
  id: string;
  naam: string;
  kanaal: string | null;
  soort: LeverancierSoort;
}

type Rij = Record<string, unknown>;

function rijen(data: unknown): Rij[] {
  return Array.isArray(data) ? data.filter((x): x is Rij => !!x && typeof x === 'object') : [];
}

interface LeverancierQuery {
  select(kolommen: string): LeverancierQuery;
  eq(kolom: string, waarde: unknown): LeverancierQuery;
  is(kolom: string, waarde: null): LeverancierQuery;
  order(kolom: string, opties?: { ascending: boolean }): LeverancierQuery;
  then<T>(onFulfilled: (v: { data: unknown; error: { code?: string; message?: string } | null }) => T): Promise<T>;
}

/** Actieve leveranciers voor routes. Ontbreekt `soort`, dan telt iedereen als extern. Winkel en intern vallen af. */
export async function leesRouteLeveranciers(db: { from(tabel: string): LeverancierQuery }): Promise<RouteLeverancier[]> {
  const met = await db.from('leveranciers').select('id, naam, kanaal, soort').eq('actief', true).is('deleted_at', null).order('naam');
  if (!met.error) return rijen(met.data).map(naarRoute).filter((l) => l.soort === 'extern');
  if (!soortKolomOntbreekt(met.error)) throw met.error;
  const zonder = await db.from('leveranciers').select('id, naam, kanaal').eq('actief', true).is('deleted_at', null).order('naam');
  if (zonder.error) throw zonder.error;
  return rijen(zonder.data).map((l) => ({ ...naarRoute(l), soort: 'extern' as const }));
}

function naarRoute(l: Rij): RouteLeverancier {
  return {
    id: String(l.id ?? ''),
    naam: String(l.naam ?? ''),
    kanaal: l.kanaal == null ? null : String(l.kanaal),
    soort: alsSoort(l.soort),
  };
}

export function zonderWinkelIntern(regels: [string, string][], soorten?: Map<string, LeverancierSoort> | null): [string, string][] {
  return regels.filter(([id]) => {
    const soort = soorten?.get(id);
    return soort !== 'winkel' && soort !== 'intern';
  });
}

type VormVoorSub = { vorm?: string | null; leverancier_id?: string | null; leverancier_naam?: string | null };

/** Bestaande subregel, plus de naam van een winkel- of intern-leverancier als die erbij hoort. */
export function suggestieOnderschrift(
  s: { leverancier_id?: string | null; vormen?: VormVoorSub[] | null },
  soorten?: Map<string, LeverancierSoort> | null,
  namen?: Map<string, string> | null,
): string {
  const vormen = s.vormen ?? [];
  const enige = vormen.length === 1 ? vormen[0] : null;
  const naamVan = (id: string | null | undefined, eigen?: string | null) => eigen || (id ? namen?.get(id) : null) || null;
  const basis = vormen.length > 1
    ? `${vormen.length} verpakkingen`
    : [enige?.vorm, enige ? naamVan(enige.leverancier_id, enige.leverancier_naam) : null].filter(Boolean).join(' · ');
  const bijzonder = new Set<string>();
  const kandidaten: { id: string | null | undefined; naam: string | null }[] = [
    { id: s.leverancier_id, naam: naamVan(s.leverancier_id, null) },
    ...vormen.map((v) => ({ id: v.leverancier_id, naam: naamVan(v.leverancier_id, v.leverancier_naam) })),
  ];
  for (const k of kandidaten) {
    if (!k.id || !k.naam) continue;
    const soort = soorten?.get(k.id);
    if (soort === 'winkel' || soort === 'intern') bijzonder.add(k.naam);
  }
  const extra = [...bijzonder].filter((n) => !basis.includes(n));
  return [basis, ...extra].filter(Boolean).join(' · ');
}
