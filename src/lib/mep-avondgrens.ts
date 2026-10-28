/** Vanaf dit uur (Amsterdam) schuift MEP werk voor "vandaag" door naar de volgende open dag. */
export const AVONDGRENS_UUR = 17;

function amsterdamUur(nu: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hourCycle: 'h23' }).format(nu),
  );
}

/** True als taakwerk voor "vandaag" na de avondgrens naar de volgende open dag moet (West en Midsland). */
export function naarVolgendeDag(bekekenDatum: string, vandaag: string, nu: Date): boolean {
  return bekekenDatum === vandaag && amsterdamUur(nu) >= AVONDGRENS_UUR;
}
