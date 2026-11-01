import { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { OmzetInhoud } from '@/components/omzet/OmzetInhoud';
import { controleRegels } from '@/lib/omzet.fixture';
import { jarenUit, type VestigingKeuze } from '@/lib/omzet';

const VANDAAG = '2026-11-01';

function start(): { tab: 'maanden' | 'maand' | 'jaar'; keuze: VestigingKeuze } {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const keuze = params.get('keuze');
  return {
    tab: tab === 'maand' || tab === 'jaar' || tab === 'maanden' ? tab : 'maanden',
    keuze: keuze === 'Midsland' || keuze === 'West' || keuze === 'Totaal' ? keuze : 'Totaal',
  };
}

/** Alleen voor een lokale schermafdruk. De route wordt niet in productie geregistreerd. */
export function OmzetVoorbeeld() {
  const begin = useMemo(start, []);
  const regels = useMemo(() => controleRegels(), []);
  const [jaar, setJaar] = useState(2026);
  const [keuze, setKeuze] = useState<VestigingKeuze>(begin.keuze);

  return (
    <SidebarLayout>
      <div className="page-stack">
        <OmzetInhoud
          regels={regels}
          jaar={jaar}
          jaren={jarenUit(VANDAAG)}
          onJaar={setJaar}
          keuze={keuze}
          onKeuze={setKeuze}
          vandaag={VANDAAG}
          startTab={begin.tab}
          melding="Nagebootste data van 1 november 2026, t/m oktober. Dit zijn niet de live kassacijfers."
        />
      </div>
    </SidebarLayout>
  );
}
