// Gastherkenning voor Eilandbezorger: één Lightspeed-klantprofiel per gast (besluit Yorick 21-11-2026).
// Alleen in livemodus, vlak voor verzenden. Testmodus komt hier nooit.
// Het telefoonnummer uit het aanleverbericht is van Eilandbezorger zelf en wordt nooit gebruikt.

export type Gast = { voornaam: string; achternaam: string; email: string; klantcode: string | null };
export type KlantKoppeling = { id: string; vestiging: string; email: string; klantcode: string | null; voornaam: string; achternaam: string; lightspeed_klant_id: string | null; status: 'bezig' | 'gekoppeld' | 'onzeker' | 'nieuw' };
export type Treffer = { id: string; voornaam: string; achternaam: string; email: string };
export type Keuze = { actie: 'gebruik'; id: string } | { actie: 'aanmaken' } | { actie: 'beoordelen'; reden: string };

const n = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Gast uit het opgeslagen aanleverbericht; null als naam of e-mail ontbreekt (oude berichten met alleen klant.naam). */
export function gastVan(invoer: any): Gast | null {
  const k = invoer?.klant ?? {};
  const voornaam = String(k.voornaam ?? '').trim(), achternaam = String(k.achternaam ?? '').trim(), email = n(k.email);
  if (!voornaam || !achternaam || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return { voornaam, achternaam, email, klantcode: k.klantcode ? String(k.klantcode).trim() : null };
}

const zelfdeNaam = (a: { voornaam: string; achternaam: string }, b: { voornaam: string; achternaam: string }) => n(a.voornaam) === n(b.voornaam) && n(a.achternaam) === n(b.achternaam);

/** Bestaande koppeling: klantcode, e-mail en naam mogen elkaar niet tegenspreken. */
export function toetsKoppeling(gast: Gast, viaCode: KlantKoppeling | null, viaEmail: KlantKoppeling | null): { ok: true; koppeling: KlantKoppeling | null } | { ok: false; reden: string } {
  if (viaCode && viaEmail && viaCode.id !== viaEmail.id) return { ok: false, reden: 'Klantcode en e-mail horen bij verschillende gasten' };
  const k = viaCode ?? viaEmail;
  if (!k) return { ok: true, koppeling: null };
  if (n(k.email) !== gast.email) return { ok: false, reden: 'Klantcode hoort bij een ander e-mailadres' };
  if (k.klantcode && gast.klantcode && k.klantcode !== gast.klantcode) return { ok: false, reden: 'E-mailadres hoort bij een andere klantcode' };
  if (!zelfdeNaam(k, gast)) return { ok: false, reden: 'Naam wijkt af van eerder gekoppelde gast' };
  return { ok: true, koppeling: k };
}

/** Beslissing na zoeken in Lightspeed op exact e-mailadres. */
export function kiesKlant(gast: Gast, treffers: Treffer[]): Keuze {
  const exact = treffers.filter((t) => n(t.email) === gast.email);
  if (exact.length > 1) return { actie: 'beoordelen', reden: `Meerdere Lightspeed-klanten met dit e-mailadres (${exact.length})` };
  if (exact.length === 1) return zelfdeNaam(exact[0], gast) ? { actie: 'gebruik', id: exact[0].id } : { actie: 'beoordelen', reden: 'Lightspeed-klant met dit e-mailadres heeft een andere naam' };
  return { actie: 'aanmaken' };
}

/** Numeriek klant-ID uit het antwoord op aanmaken; anders null (= onzeker). */
export function klantIdUit(body: string): string | null {
  try {
    const j = JSON.parse(body);
    const id = typeof j === 'number' ? j : j?.id ?? j?.customerId;
    return Number.isInteger(Number(id)) && Number(id) > 0 ? String(Number(id)) : null;
  } catch { return /^\d+$/.test(body.trim()) ? body.trim() : null; }
}
