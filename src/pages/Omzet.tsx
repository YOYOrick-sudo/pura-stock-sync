import { useEffect, useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { OmzetInhoud } from '@/components/omzet/OmzetInhoud';
import { useOmzetUren } from '@/hooks/useOmzetUren';
import { amsterdamDatum, jarenUit, type VestigingKeuze } from '@/lib/omzet';

export default function Omzet() {
  const vandaag = useMemo(() => amsterdamDatum(), []);
  const [jaar, setJaar] = useState(() => Number(amsterdamDatum().slice(0, 4)));
  const [keuze, setKeuze] = useState<VestigingKeuze>('Totaal');
  const query = useOmzetUren();
  const jaren = useMemo(() => jarenUit(query.data ?? []), [query.data]);
  useEffect(() => {
    if (jaren.length > 0 && !jaren.includes(jaar)) setJaar(jaren[0]);
  }, [jaren, jaar]);

  return (
    <SidebarLayout>
      <div className="page-stack">
        <OmzetInhoud
          regels={query.data ?? []}
          jaar={jaar}
          jaren={jaren}
          onJaar={setJaar}
          keuze={keuze}
          onKeuze={setKeuze}
          vandaag={vandaag}
          laden={query.isPending}
          fout={query.isError}
          onOpnieuw={() => { void query.refetch(); }}
        />
      </div>
    </SidebarLayout>
  );
}
