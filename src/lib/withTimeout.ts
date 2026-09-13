/**
 * Voert een belofte uit met een harde tijdslimiet.
 * Voorkomt schermen die eindeloos blijven hangen bij slechte wifi of
 * een auth-laag die na achtergrond-tijd op de iPad niet meer antwoordt.
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 15000,
  melding = 'Duurt te lang — controleer je verbinding en probeer opnieuw',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(melding)), ms);
    Promise.resolve(promise).then(
      (waarde) => {
        clearTimeout(timer);
        resolve(waarde);
      },
      (fout) => {
        clearTimeout(timer);
        reject(fout);
      },
    );
  });
}

/** Haalt de ingelogde gebruiker op zonder te kunnen blijven hangen. */
export async function getUserIdMetTimeout(
  supabase: { auth: { getSession: () => PromiseLike<any>; getUser: () => PromiseLike<any> } },
  ms = 15000,
): Promise<string | null> {
  try {
    const { data } = await withTimeout(supabase.auth.getSession(), ms);
    const id = data?.session?.user?.id;
    if (id) return id;
  } catch {
    // valt door naar getUser
  }
  const { data } = await withTimeout(supabase.auth.getUser(), ms);
  return data?.user?.id ?? null;
}
