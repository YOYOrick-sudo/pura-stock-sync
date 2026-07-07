import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CijfersMetricsBar } from '@/components/cijfers/CijfersMetricsBar';
import { CijfersHoofdgrafiek } from '@/components/cijfers/CijfersHoofdgrafiek';
import { CijfersHeatmap } from '@/components/cijfers/CijfersHeatmap';
import { CijfersWeekdagVergelijk } from '@/components/cijfers/CijfersWeekdagVergelijk';
import { CijfersUurverloop } from '@/components/cijfers/CijfersUurverloop';
import { CijfersVestigingSplit } from '@/components/cijfers/CijfersVestigingSplit';
import { BronnenBlok } from '@/components/cijfers/BronnenBlok';
import { BijgewerktRegel } from '@/components/cijfers/BijgewerktRegel';
import { CijfersLoonkostenBar } from '@/components/cijfers/CijfersLoonkostenBar';
import { CijfersLoonkostenGrafiek } from '@/components/cijfers/CijfersLoonkostenGrafiek';
import { CijfersUrenVergelijk } from '@/components/cijfers/CijfersUrenVergelijk';
import { periodeRange, toISO, type Periode, type VestKeuze } from '@/components/cijfers/types';
import { useRole } from '@/hooks/useRole';
import { useMagLoonkostenZien } from '@/hooks/useMagLoonkostenZien';

type Preset = { label: string; van: Date; tot: Date };

function buildPresets(): Preset[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const gisteren = new Date(today); gisteren.setDate(today.getDate() - 1);
  const dow = (today.getDay() + 6) % 7;
  const thisMon = new Date(today); thisMon.setDate(today.getDate() - dow);
  const prevMon = new Date(thisMon); prevMon.setDate(thisMon.getDate() - 7);
  const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6);
  const daysSinceSat = (today.getDay() + 1) % 7 || 7;
  const laatsteZa = new Date(today); laatsteZa.setDate(today.getDate() - daysSinceSat);
  const laatsteZo = new Date(laatsteZa); laatsteZo.setDate(laatsteZa.getDate() + 1);
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

function rangeLabel(periode: Periode, van: string, tot: string): string {
  const dv = new Date(van); const dt = new Date(tot);
  if (periode === 'vandaag') return format(dv, 'EEE d MMM yyyy', { locale: nl });
  if (periode === 'jaar')    return `jan – dec ${dv.getFullYear()}`;
  if (periode === 'maand')   return format(dv, 'LLLL yyyy', { locale: nl });
  if (dv.getFullYear() === dt.getFullYear() && dv.getMonth() === dt.getMonth()) {
    return `${format(dv, 'd', { locale: nl })} – ${format(dt, 'd MMM yyyy', { locale: nl })}`;
  }
  return `${format(dv, 'd MMM', { locale: nl })} – ${format(dt, 'd MMM yyyy', { locale: nl })}`;
}

export default function Cijfers() {
  const [periode, setPeriode] = useState<Periode>('week');
  const [vestKeuze, setVestKeuze] = useState<VestKeuze>('Beide');
  const magLoon = useMagLoonkostenZien();


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


  const presets = useMemo(buildPresets, []);
  const label = rangeLabel(periode, range.van, range.tot);

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-8">
        {/* Filters */}
        <StickyFilters
          label={label}
          periode={periode} setPeriode={setPeriode}
          vestKeuze={vestKeuze} setVestKeuze={setVestKeuze}
          customVan={customVan} setCustomVan={setCustomVan}
          customTot={customTot} setCustomTot={setCustomTot}
          minDate={minDate} today={today} presets={presets}
        />

        <CijfersMetricsBar periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />

        {magLoon && (
          <CijfersLoonkostenBar periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-5">
          <CijfersHoofdgrafiek periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
          <CijfersWeekdagVergelijk periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
        </div>

        {magLoon && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-5">
            <CijfersLoonkostenGrafiek periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
            <CijfersUrenVergelijk periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <CijfersUurverloop periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
          <CijfersVestigingSplit periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
        </div>

        <CijfersHeatmap periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />


        <BronnenBlok />

        <BijgewerktRegel />
      </div>
    </SidebarLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Filters — segmented pills matching reference                        */
/* ------------------------------------------------------------------ */

function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function Segment<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'hsl(var(--chart-track))',
      borderRadius: 12, padding: 4, gap: 2,
    }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '7px 15px', borderRadius: 9, fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              background: active ? 'hsl(var(--card))' : 'transparent',
              border: 'none', cursor: 'pointer',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

function StickyFilters(props: {
  label: string;
  periode: Periode; setPeriode: (p: Periode) => void;
  vestKeuze: VestKeuze; setVestKeuze: (v: VestKeuze) => void;
  customVan: Date; setCustomVan: (d: Date) => void;
  customTot: Date; setCustomTot: (d: Date) => void;
  minDate: Date; today: Date; presets: Preset[];
}) {
  const scrolled = useScrolled();
  return (
    <div
      className={cn(
        'sticky top-0 z-10 -mx-2 px-2 py-3 space-y-3 transition-all',
        'bg-background/70 backdrop-blur-md',
        scrolled ? 'border-b border-border/60' : 'border-b border-transparent',
      )}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <DateRangePopover
          label={props.label}
          van={props.customVan} tot={props.customTot}
          setVan={props.setCustomVan} setTot={props.setCustomTot}
          minDate={props.minDate} today={props.today}
          presets={props.presets}
          setPeriode={props.setPeriode}
        />
        <Segment
          value={props.periode}
          onChange={(v) => props.setPeriode(v as Periode)}
          options={[
            { value: 'vandaag', label: 'Vandaag' },
            { value: 'week', label: 'Week' },
            { value: 'maand', label: 'Maand' },
            { value: 'jaar', label: 'Jaar' },
            { value: 'aangepast', label: 'Aangepast' },
          ]}
        />
        <div style={{ width: 1, height: 22, background: 'hsl(var(--border))' }} className="hidden md:block" />
        <Segment
          value={props.vestKeuze}
          onChange={(v) => props.setVestKeuze(v as VestKeuze)}
          options={[
            { value: 'Midsland', label: 'Midsland' },
            { value: 'West', label: 'West' },
            { value: 'Beide', label: 'Beide' },
          ]}
        />
        <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'hsl(var(--muted-foreground))' }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%', background: '#2DB37D',
              boxShadow: '0 0 0 3px rgba(45,179,125,0.18)',
              animation: 'cj-pulseDot 2s ease-in-out infinite',
            }}
          />
          Live · gesynchroniseerd
        </div>
      </div>

    </div>
  );
}

function DateRangePopover({
  label, van, tot, setVan, setTot, minDate, today, presets, setPeriode,
}: {
  label: string;
  van: Date; tot: Date;
  setVan: (d: Date) => void; setTot: (d: Date) => void;
  minDate: Date; today: Date;
  presets: Preset[];
  setPeriode: (p: Periode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({ from: van, to: tot });

  // Sync when parent state changes
  useEffect(() => { setRange({ from: van, to: tot }); }, [van, tot]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px',
            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12,
            fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <CalendarIcon size={14} strokeWidth={2} className="text-muted-foreground" />
          <span className="tabular-nums">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="p-2 flex flex-wrap gap-1.5 border-b border-border">
          {presets.map((p) => (
            <Button
              key={p.label} variant="outline" size="sm" className="h-8 rounded-polar-md text-xs"
              onClick={() => {
                setVan(p.van); setTot(p.tot);
                setPeriode('aangepast');
                setRange({ from: p.van, to: p.tot });
                setOpen(false);
              }}
            >{p.label}</Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range as any}
          onSelect={(r: any) => {
            setRange(r ?? {});
            if (r?.from && r?.to) {
              setVan(r.from);
              setTot(r.to);
              setPeriode('aangepast');
              setOpen(false);
            }
          }}
          numberOfMonths={2}
          disabled={(d) => d < minDate || d > today}
          initialFocus locale={nl} weekStartsOn={1}
          className={cn('p-3 pointer-events-auto')}
        />
        <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
          Max 12 maanden terug
        </div>
      </PopoverContent>
    </Popover>
  );
}
