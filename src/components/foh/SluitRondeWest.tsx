import { useMepKalender } from '@/hooks/useMepPlanning';
import { isTeldag } from '@/lib/sluitronde';
import { AfvinkRonde } from './AfvinkRonde';
import { VoorraadRonde } from './VoorraadRonde';

/**
 * De weekse telronde (maandag: koelcel, vriescel, magazijn) staat nu uit.
 * Zet deze vlag op true om hem weer te laten verschijnen — de code en de
 * telling zelf blijven ongewijzigd in VoorraadRonde.tsx staan.
 */
const TELRONDE_ZICHTBAAR: boolean = false;

/**
 * Keuken-sluitlijst West: elke dag afvinken. Op de teldag (maandag, of de
 * eerste open dag erna) eerst koelcel, vriescel en magazijn tellen.
 */
export function SluitRondeWest({ vestiging, datum }: { vestiging: string; datum: string }) {
  const kalender = useMepKalender(vestiging);
  const tellen = TELRONDE_ZICHTBAAR && isTeldag(datum, kalender.isOpen);
  return (
    <>
      {tellen && (
        <VoorraadRonde vestiging={vestiging} datum={datum} alleenPlekken={['koelcel', 'magazijn', 'vriezer']} />
      )}
      <AfvinkRonde vestiging={vestiging} datum={datum} />
    </>
  );
}
