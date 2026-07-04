import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { SegmentedTabs } from '@/components/pura/SegmentedTabs';
import { DemoBanner } from '@/components/cijfers/DemoBanner';
import { CijfersStatCards } from '@/components/cijfers/CijfersStatCards';
import { CijfersHoofdgrafiek } from '@/components/cijfers/CijfersHoofdgrafiek';
import { CijfersHeatmap } from '@/components/cijfers/CijfersHeatmap';
import { CijfersWeekdagVergelijk } from '@/components/cijfers/CijfersWeekdagVergelijk';
import { BronnenBlok } from '@/components/cijfers/BronnenBlok';
import type { Periode, VestKeuze } from '@/components/cijfers/types';
import { useRole } from '@/hooks/useRole';

export default function Cijfers() {
  const { isOwner } = useRole();
  const canWipe = isOwner;


  const [periode, setPeriode] = useState<Periode>('week');
  const [vestKeuze, setVestKeuze] = useState<VestKeuze>('Beide');

  const demoQ = useQuery({
    queryKey: ['heeft-demo-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_heeft_demo_data');
      if (error) throw error;
      return Boolean(data);
    },
    refetchOnWindowFocus: true,
  });

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cijfers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Omzet, bonnen en patronen — realtime, per vestiging.
          </p>
        </div>

        {demoQ.data && <DemoBanner canWipe={canWipe} />}

        <div className="sticky top-0 z-10 -mx-2 px-2 py-3 bg-background/80 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4">
            <SegmentedTabs
              value={periode}
              onValueChange={(v) => setPeriode(v as Periode)}
              options={[
                { value: 'vandaag', label: 'Vandaag' },
                { value: 'week', label: 'Week' },
                { value: 'maand', label: 'Maand' },
                { value: 'jaar', label: 'Jaar' },
              ]}
            />
            <div className="h-6 w-px bg-border hidden md:block" />
            <SegmentedTabs
              value={vestKeuze}
              onValueChange={(v) => setVestKeuze(v as VestKeuze)}
              options={[
                { value: 'Midsland', label: 'Midsland' },
                { value: 'West', label: 'West' },
                { value: 'Beide', label: 'Beide' },
              ]}
            />
          </div>
        </div>

        <CijfersStatCards periode={periode} vestigingKeuze={vestKeuze} />

        <CijfersHoofdgrafiek periode={periode} vestigingKeuze={vestKeuze} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <CijfersHeatmap periode={periode} vestigingKeuze={vestKeuze} />
          </div>
          <div>
            <CijfersWeekdagVergelijk periode={periode} vestigingKeuze={vestKeuze} />
          </div>
        </div>

        <BronnenBlok />
      </div>
    </SidebarLayout>
  );
}
