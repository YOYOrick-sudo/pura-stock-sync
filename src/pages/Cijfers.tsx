import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { PageSubheader } from '@/components/pura/PageSubheader';
import { SegmentedTabs } from '@/components/pura/SegmentedTabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DemoBanner } from '@/components/cijfers/DemoBanner';
import { CijfersStatCards } from '@/components/cijfers/CijfersStatCards';
import { CijfersHoofdgrafiek } from '@/components/cijfers/CijfersHoofdgrafiek';
import { CijfersHeatmap } from '@/components/cijfers/CijfersHeatmap';
import { CijfersWeekdagVergelijk } from '@/components/cijfers/CijfersWeekdagVergelijk';
import { BronnenBlok } from '@/components/cijfers/BronnenBlok';
import { periodeRange, toISO, type Periode, type VestKeuze } from '@/components/cijfers/types';
import { useRole } from '@/hooks/useRole';

type Preset = { label: string; van: Date; tot: Date };

function buildPresets(): Preset[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const gisteren = new Date(today); gisteren.setDate(today.getDate() - 1);
  // Vorige week (ma-zo)
  const dow = (today.getDay() + 6) % 7;
  const thisMon = new Date(today); thisMon.setDate(today.getDate() - dow);
  const prevMon = new Date(thisMon); prevMon.setDate(thisMon.getDate() - 7);
  const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6);
  // Vorig weekend (za-zo)
  const daysSinceSat = (today.getDay() + 1) % 7 || 7; // dagen sinds laatste za
  const laatsteZa = new Date(today); laatsteZa.setDate(today.getDate() - daysSinceSat);
  const laatsteZo = new Date(laatsteZa); laatsteZo.setDate(laatsteZa.getDate() + 1);
  // Deze maand vorig jaar
  const firstThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstLYSameMonth = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const sameDayLY = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  return [
    { label: 'Gisteren', van: gisteren, tot: gisteren },
    { label: 'Vorige week', van: prevMon, tot: prevSun },
    { label: 'Vorig weekend', van: laatsteZa, tot: laatsteZo },
    { label: 'Deze maand vorig jaar', van: firstLYSameMonth, tot: sameDayLY < firstLYSameMonth ? firstLYSameMonth : sameDayLY },
  ];
}

const MAX_TERUG_DAGEN = 366;

export default function Cijfers() {
  const { isOwner } = useRole();
  const [periode, setPeriode] = useState<Periode>('week');
  const [vestKeuze, setVestKeuze] = useState<VestKeuze>('Beide');

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const minDate = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() - MAX_TERUG_DAGEN); return d; }, [today]);
  const [customVan, setCustomVan] = useState<Date>(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; });
  const [customTot, setCustomTot] = useState<Date>(new Date());

  const range = useMemo(() => {
    if (periode === 'aangepast') {
      let van = customVan < minDate ? minDate : customVan;
      let tot = customTot > today ? today : customTot;
      if (van > tot) van = tot;
      return { van: toISO(van), tot: toISO(tot) };
    }
    return periodeRange(periode);
  }, [periode, customVan, customTot, minDate, today]);

  const demoQ = useQuery({
    queryKey: ['heeft-demo-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_heeft_demo_data');
      if (error) throw error;
      return Boolean(data);
    },
    refetchOnWindowFocus: true,
  });

  const presets = useMemo(buildPresets, []);

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-8">
        <PageSubheader description="Omzet, bonnen en patronen — realtime, per vestiging." />

        {demoQ.data && <DemoBanner canWipe={isOwner} />}

        <div className="sticky top-0 z-10 -mx-2 px-2 py-3 bg-background/80 backdrop-blur-sm space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <SegmentedTabs
              value={periode}
              onValueChange={(v) => setPeriode(v as Periode)}
              options={[
                { value: 'vandaag', label: 'Vandaag' },
                { value: 'week', label: 'Week' },
                { value: 'maand', label: 'Maand' },
                { value: 'jaar', label: 'Jaar' },
                { value: 'aangepast', label: 'Aangepast' },
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

          {periode === 'aangepast' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <DateBtn label="Van" value={customVan} onChange={setCustomVan} min={minDate} max={customTot} />
              <span className="text-muted-foreground text-sm">→</span>
              <DateBtn label="Tot" value={customTot} onChange={setCustomTot} min={customVan} max={today} />
              <div className="h-6 w-px bg-border mx-1" />
              {presets.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-polar-lg"
                  onClick={() => { setCustomVan(p.van); setCustomTot(p.tot); }}
                >
                  {p.label}
                </Button>
              ))}
              <div className="ml-auto text-xs text-muted-foreground">
                Max 12 maanden terug
              </div>
            </div>
          )}
        </div>

        <CijfersStatCards periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
        <CijfersHoofdgrafiek periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <CijfersHeatmap periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
          </div>
          <div>
            <CijfersWeekdagVergelijk periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
          </div>
        </div>

        <BronnenBlok />
      </div>
    </SidebarLayout>
  );
}

function DateBtn({
  label, value, onChange, min, max,
}: { label: string; value: Date; onChange: (d: Date) => void; min: Date; max: Date }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-9 rounded-polar-lg gap-2 justify-start font-normal')}
        >
          <CalendarIcon className="w-4 h-4 opacity-70" />
          <span className="text-muted-foreground">{label}:</span>
          <span>{format(value, 'd MMM yyyy', { locale: nl })}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          disabled={(d) => d < min || d > max}
          initialFocus
          locale={nl}
          weekStartsOn={1}
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}
