const STATUS_LABELS: Record<string, string> = {
  nieuw: 'Nieuw',
  in_notion: 'In Notion',
  op_agenda: 'Op de agenda',
  besproken: 'Besproken',
  doorgeschoven: 'Doorgeschoven',
  afgevallen: 'Afgevallen',
  test: 'Test',
};

export function mtStatusLabel(status: string | null | undefined): string {
  if (!status) return '';
  return STATUS_LABELS[status] ?? status;
}

/** Routes die een account zonder rol (alleen MT-lid) mag openen. */
export const MT_ROUTES = ['/mt-punt'];

export function formatNlDatumTijd(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Vandaag (Europe/Amsterdam) als YYYY-MM-DD. */
export function vandaagAmsterdam(now: Date = new Date()): string {
  return now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
}

export function isVerlopen(deadline: string | null, vandaag: string): boolean {
  return !!deadline && deadline < vandaag;
}

/** Deadline oplopend, zonder deadline onderaan. */
export function sorteerOpDeadline<T extends { deadline: string | null }>(rijen: T[]): T[] {
  return [...rijen].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
}
