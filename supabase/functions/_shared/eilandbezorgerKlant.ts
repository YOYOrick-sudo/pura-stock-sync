// Alleen orderspecifieke gastnaam; geen gastprofielen of contactgegevens.
export function gastNaam(invoer: unknown): string {
  if (!invoer || typeof invoer !== 'object' || !('klant' in invoer)) return '';
  const k = invoer.klant;
  if (!k || typeof k !== 'object') return '';
  const tekst = (v: unknown) => typeof v === 'string' ? v.trim() : '';
  const voor = 'voornaam' in k ? tekst(k.voornaam) : '';
  const achter = 'achternaam' in k ? tekst(k.achternaam) : '';
  return voor && achter ? `${voor} ${achter}` : 'naam' in k ? tekst(k.naam) : '';
}

/** Positief numeriek vaste-klant-ID; nooit een gast zoeken of aanmaken. */
export function vasteKlantId(v: unknown): string | null {
  const id = typeof v === 'string' ? v.trim() : '';
  return /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0 ? id : null;
}
