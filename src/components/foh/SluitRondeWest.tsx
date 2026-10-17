import { useMepKalender } from '@/hooks/useMepPlanning';
import { isTeldag } from '@/lib/sluitronde';
import { AfvinkRonde } from './AfvinkRonde';
import { VoorraadRonde } from './VoorraadRonde';

/**
 * Keuken-sluitlijst West: elke dag afvinken. Op de teldag (maandag, of de
 * eerste open dag erna) eerst koelcel, vriescel en magazijn tellen.
 */
export function SluitRondeWest({ vestiging, datum }: { vestiging: string; datum: string }) {
  const kalender = useMepKalender(vestiging);
  const tellen = isTeldag(datum, kalender.isOpen);
  return (
    <>
      {tellen && (
        <VoorraadRonde vestiging={vestiging} datum={datum} alleenPlekken={['koelcel', 'magazijn', 'vriezer']} />
      )}
      <AfvinkRonde vestiging={vestiging} datum={datum} />
    </>
  );
}
