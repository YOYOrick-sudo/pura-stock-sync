/**
 * Wakker-worden-laag voor de tablets.
 *
 * iPadOS bevriest een app die naar de achtergrond gaat: openstaande verzoeken
 * geven daarna nooit meer antwoord en de inlogsleutel is na uren verlopen.
 * Deze module zorgt ervoor dat de app bij terugkomst stil en snel weer werkt,
 * zonder meldingen op het scherm.
 */
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/withTimeout';

const SESSIE_TIMEOUT_MS = 8_000;
const VERNIEUW_MARGE_S = 120;
const NOODREM_MS = 8_000;

let lopend: Promise<boolean> | null = null;
let laatsteGoed = 0;
let controller = new AbortController();

/** Signal dat wordt afgebroken zodra de app naar de achtergrond gaat. */
export function wakeSignal(): AbortSignal {
  return controller.signal;
}

/** Breekt alles af wat nog liep; aanroepen bij naar-de-achtergrond. */
export function abortAlles() {
  try {
    controller.abort();
  } catch {
    /* niets */
  }
  controller = new AbortController();
  lopend = null;
  laatsteGoed = 0;
}

async function doeHerstel(force: boolean): Promise<boolean> {
  try {
    const { data } = await withTimeout(supabase.auth.getSession(), SESSIE_TIMEOUT_MS);
    const sessie = data?.session;
    if (!sessie) return false;

    const verlooptOver = (sessie.expires_at ?? 0) - Math.floor(Date.now() / 1000);
    if (force || verlooptOver < VERNIEUW_MARGE_S) {
      // Alleen verversen als het echt nodig is — forceren logt mensen uit.
      const { error } = await withTimeout(supabase.auth.refreshSession(), SESSIE_TIMEOUT_MS);
      if (error) return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    // Live-verbinding altijd opnieuw opbouwen; faalt stil als er geen net is.
    try {
      supabase.realtime.connect();
    } catch {
      /* niets */
    }
  }
}

/**
 * Zorgt dat er een bruikbare sessie is. Gedeeld en gedebounced: tien knoppen
 * tegelijk leiden tot één verversing.
 */
export function zorgVoorSessie(force = false): Promise<boolean> {
  if (!force && lopend) return lopend;
  if (!force && Date.now() - laatsteGoed < 30_000) return Promise.resolve(true);

  const p = doeHerstel(force).then((ok) => {
    if (ok) laatsteGoed = Date.now();
    lopend = null;
    return ok;
  });
  lopend = p;
  return p;
}

/** True als er een tekstveld, dialoog of formulier openstaat dat je niet mag weggooien. */
function invoerOpen(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.querySelector('[role="dialog"], [data-state="open"][role="alertdialog"]')) return true;
  const actief = document.activeElement as HTMLElement | null;
  if (!actief) return false;
  const tag = actief.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || actief.isContentEditable;
}

/** Vraagt de service worker om een nieuwere versie op te halen (stil). */
async function checkNieuweVersie() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    await reg?.update?.();
  } catch {
    /* niets */
  }
}

/**
 * Herstelt de app na terugkomst. Lukt dat niet binnen 8 seconden, dan een
 * stille herlaadbeurt — beter een seconde wachten dan een dood scherm.
 */
export async function herstelOfHerlaad(): Promise<boolean> {
  void checkNieuweVersie();

  const noodrem = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), NOODREM_MS));
  const uitkomst = await Promise.race([zorgVoorSessie(), noodrem]);

  if (uitkomst === 'timeout') {
    if (!invoerOpen()) {
      window.location.reload();
    }
    return false;
  }
  return uitkomst === true;
}

/** Herkent fouten waarbij een tweede poging met verse sleutel zin heeft. */
export function isHerstelbareFout(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? e ?? '').toLowerCase();
  const code = String((e as { code?: string; status?: number })?.code ?? '');
  const status = (e as { status?: number })?.status;
  return (
    status === 401 ||
    code === '401' ||
    code === 'PGRST301' ||
    msg.includes('jwt') ||
    msg.includes('token') ||
    msg.includes('unauthorized') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('duurt te lang')
  );
}

/**
 * Voert een schrijfactie uit met verse sessie, harde tijdslimiet en één
 * automatische nieuwe poging. Zo blijft een knop nooit hangen.
 */
export async function metHerstel<T>(fn: () => PromiseLike<T>, ms = 15_000): Promise<T> {
  await zorgVoorSessie();
  try {
    return await withTimeout(fn(), ms);
  } catch (e) {
    if (!isHerstelbareFout(e)) throw e;
    await zorgVoorSessie(true);
    return await withTimeout(fn(), ms);
  }
}
