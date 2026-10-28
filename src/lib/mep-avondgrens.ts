/** Vanaf dit uur (Amsterdam) gaan nieuwe Midsland-taken naar de volgende open dag. */
export const AVONDGRENS_UUR = 17;

function amsterdamUur(nu: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hourCycle: 'h23' }).format(nu),
  );
}

/** True als een nieuwe taak voor "vandaag" naar de volgende open dag moet. */
export function naarVolgendeDag(vestiging: string, bekekenDatum: string, vandaag: string, nu: Date): boolean {
  return vestiging === 'Midsland' && bekekenDatum === vandaag && amsterdamUur(nu) >= AVONDGRENS_UUR;
}
