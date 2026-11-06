/** Zelfde weekdag vorig jaar: 52 weken (364 dagen) terug. ISO-datum in, ISO-datum uit. */
export function zelfdeWeekdagVorigJaar(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 364);
  return d.toISOString().slice(0, 10);
}
