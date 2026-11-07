// Standaard leverdag voor een bestelling op het bord.
// Spiegelt public.bestel_leverdatum_leverancier en de terugval van
// public.bestel_verwachte_levering (migratie 0062): weekdag 0 = zondag,
// kalenderdagen als yyyy-MM-dd, tijd in Europe/Amsterdam.

export interface BesteldagRegel {
  id?: string;
  leverancierId: string;
  /** null = geldt voor elke vestiging, tenzij een vestigingsrij wint. */
  vestiging: string | null;
  weekdag: number;
  /** HH:MM of HH:MM:SS. null = geen deadline. */
  deadlineTijd: string | null;
  /** Dagen na de besteldag. null telt als 1, gelijk aan COALESCE in de database. */
  offset: number | null;
  actief: boolean;
  geldigVanaf: string | null;
  geldigTot: string | null;
  updatedAt?: string | null;
}

export interface StandaardLeverdagInvoer {
  /** Besteldag, yyyy-MM-dd in Europe/Amsterdam. */
  basis: string;
  /** Tijdstip op die dag, HH:MM:SS. null = geen deadlinecheck, zoals _tijd leeg. */
  tijd: string | null;
  leverancierId: string | null;
  vestiging: string;
  regels: readonly BesteldagRegel[];
  isOpen: (dag: string) => boolean;
}

export function plusDagenYmd(dag: string, n: number): string {
  const [y, m, d] = dag.split('-').map(Number);
  const uit = new Date(Date.UTC(y, m - 1, d + n));
  return uit.toISOString().slice(0, 10);
}

export function weekdagYmd(dag: string): number {
  const [y, m, d] = dag.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function seconden(tijd: string): number {
  const [uur = '0', minuut = '0', seconde = '0'] = tijd.split(':');
  return Number(uur) * 3600 + Number(minuut) * 60 + Number(seconde);
}

/** Eerste open dag vanaf dag, maximaal 14 dagen vooruit. Blijft hij dicht, dan die laatste dag. */
function eersteOpen(dag: string, isOpen: (d: string) => boolean): string {
  let cur = dag;
  for (let i = 0; i < 14 && !isOpen(cur); i++) cur = plusDagenYmd(cur, 1);
  return cur;
}

/**
 * De ene geldende besteldagrij, zelfde volgorde als bestel_besteldag_regel:
 * vestiging-specifiek wint van leeg, een rij met datums wint van een open rij,
 * dan laatste geldig_vanaf, vroegste geldig_tot, actief, updated_at, id.
 */
function kiesRegel(regels: readonly BesteldagRegel[], leverancierId: string, vestiging: string, dag: string): BesteldagRegel | null {
  const weekdag = weekdagYmd(dag);
  const kandidaten = regels.filter((r) =>
    r.leverancierId === leverancierId
    && (r.vestiging === vestiging || r.vestiging == null)
    && r.weekdag === weekdag
    && (r.geldigVanaf == null || r.geldigVanaf <= dag)
    && (r.geldigTot == null || r.geldigTot >= dag));
  if (!kandidaten.length) return null;
  kandidaten.sort((a, b) => {
    const locatie = Number(a.vestiging == null) - Number(b.vestiging == null);
    if (locatie) return locatie;
    const openA = a.geldigVanaf == null && a.geldigTot == null;
    const openB = b.geldigVanaf == null && b.geldigTot == null;
    if (openA !== openB) return Number(openA) - Number(openB);
    if ((a.geldigVanaf == null) !== (b.geldigVanaf == null)) return a.geldigVanaf == null ? 1 : -1;
    if (a.geldigVanaf !== b.geldigVanaf) return (b.geldigVanaf ?? '').localeCompare(a.geldigVanaf ?? '');
    if ((a.geldigTot == null) !== (b.geldigTot == null)) return a.geldigTot == null ? 1 : -1;
    if (a.geldigTot !== b.geldigTot) return (a.geldigTot ?? '').localeCompare(b.geldigTot ?? '');
    if (a.actief !== b.actief) return Number(b.actief) - Number(a.actief);
    const bijgewerkt = (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    if (bijgewerkt) return bijgewerkt;
    return (a.id ?? '').localeCompare(b.id ?? '');
  });
  return kandidaten[0];
}

/**
 * Eerstvolgende leverdag. Vandaag telt alleen als de tijd nog vóór de deadline
 * ligt. Geen geldige besteldag: morgen, dichte dagen overgeslagen.
 */
export function standaardLeverdag(invoer: StandaardLeverdagInvoer): string {
  const { basis, tijd, leverancierId, vestiging, regels, isOpen } = invoer;
  let vroegste: string | null = null;
  if (leverancierId) {
    const nu = tijd == null ? null : seconden(tijd);
    for (let n = 0; n <= 7; n++) {
      const dag = plusDagenYmd(basis, n);
      const regel = kiesRegel(regels, leverancierId, vestiging, dag);
      if (!regel?.actief) continue;
      if (n === 0 && nu != null && regel.deadlineTijd != null && nu >= seconden(regel.deadlineTijd)) continue;
      const levering = plusDagenYmd(dag, regel.offset ?? 1);
      if (!vroegste || levering < vroegste) vroegste = levering;
    }
  }
  return eersteOpen(vroegste ?? plusDagenYmd(basis, 1), isOpen);
}
