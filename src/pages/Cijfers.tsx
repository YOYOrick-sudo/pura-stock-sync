import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CijfersMetricsBar } from '@/components/cijfers/CijfersMetricsBar';
import { CijfersHoofdgrafiek } from '@/components/cijfers/CijfersHoofdgrafiek';
import { CijfersHeatmap } from '@/components/cijfers/CijfersHeatmap';
import { CijfersLozeUren } from '@/components/cijfers/CijfersLozeUren';
import { CijfersWeekdagVergelijk } from '@/components/cijfers/CijfersWeekdagVergelijk';
import { CijfersUurverloop } from '@/components/cijfers/CijfersUurverloop';
import { CijfersVestigingSplit } from '@/components/cijfers/CijfersVestigingSplit';

import { BijgewerktRegel } from '@/components/cijfers/BijgewerktRegel';
import { CijfersLoonkostenBar } from '@/components/cijfers/CijfersLoonkostenBar';
import { CijfersLoonkostenGrafiek } from '@/components/cijfers/CijfersLoonkostenGrafiek';
import { CijfersLoonkostenDoelGrafiek } from '@/components/cijfers/CijfersLoonkostenDoelGrafiek';
import { CijfersUrenVergelijk } from '@/components/cijfers/CijfersUrenVergelijk';
import { periodeRange, toISO, vergelijkModeVan, type Periode, type VergelijkMode, type VestKeuze } from '@/components/cijfers/types';
import { useRole } from '@/hooks/useRole';
import { useMagLoonkostenZien } from '@/hooks/useMagLoonkostenZien';

/** Preset uit de popover: elke shortcut geeft periode én optionele mode-override mee,
 *  zodat de D-vergelijkingslogica correct blijft (dag/week/maand/jaar/custom). */
type Preset = {
  label: string;
  van: Date; tot: Date;
  periode: Periode;
  override: VergelijkMode | null;
};

function buildPresets(): { snel: Preset[]; vergelijk: Preset[] } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const gisteren = new Date(today); gisteren.setDate(today.getDate() - 1);

  const dow = (today.getDay() + 6) % 7;
  const thisMon = new Date(today); thisMon.setDate(today.getDate() - dow);
  const prevMon = new Date(thisMon); prevMon.setDate(thisMon.getDate() - 7);
  const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6);

  const daysSinceSat = (today.getDay() + 1) % 7 || 7;
  const laatsteZa = new Date(today); laatsteZa.setDate(today.getDate() - daysSinceSat);
  const laatsteZo = new Date(laatsteZa); laatsteZo.setDate(laatsteZa.getDate() + 1);

  // Volledige maand vorig jaar (1e t/m laatste van diezelfde maand LY).
  const firstLYSameMonth = new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const lastLYSameMonth = new Date(today.getFullYear() - 1, today.getMonth() + 1, 0);

  const firstThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstThisYear = new Date(today.getFullYear(), 0, 1);

  return {
    // Snelle presets — 1-op-1 met de periode-pill; geen override nodig.
    snel: [
      { label: 'Vandaag',    van: today,          tot: today,  periode: 'vandaag', override: null },
      { label: 'Deze week',  van: thisMon,        tot: today,  periode: 'week',    override: null },
      { label: 'Deze maand', van: firstThisMonth, tot: today,  periode: 'maand',   override: null },
      { label: 'Dit jaar',   van: firstThisYear,  tot: today,  periode: 'jaar',    override: null },
    ],
    // Vergelijk-shortcuts — datums vast, mode gedwongen via override.
    vergelijk: [
      { label: 'Gisteren',              van: gisteren,        tot: gisteren,       periode: 'aangepast', override: 'dag' },
      { label: 'Vorige week',           van: prevMon,         tot: prevSun,        periode: 'aangepast', override: 'week' },
      { label: 'Vorig weekend',         van: laatsteZa,       tot: laatsteZo,      periode: 'aangepast', override: null }, // custom
      { label: 'Deze maand vorig jaar', van: firstLYSameMonth, tot: lastLYSameMonth, periode: 'aangepast', override: 'maand' },
    ],
  };
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
  const [periode, setPeriodeRaw] = useState<Periode>('week');
  const [vestKeuze, setVestKeuze] = useState<VestKeuze>('Beide');
  const [modeOverride, setModeOverride] = useState<VergelijkMode | null>(null);
  const magLoon = useMagLoonkostenZien();

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const minDate = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() - MAX_TERUG_DAGEN); return d; }, [today]);
  const [customVan, setCustomVan] = useState<Date>(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; });
  const [customTot, setCustomTot] = useState<Date>(new Date());

  // Elke handmatige periode-verandering wist een override.
  const setPeriode = (p: Periode) => { setPeriodeRaw(p); setModeOverride(null); };

  // Preset-toepassing: zet periode + optionele mode-override (voor "Deze maand vorig jaar" etc.).
  const applyPresetMode = (p: Periode, override: VergelijkMode | null) => {
    setPeriodeRaw(p);
    setModeOverride(override);
  };

  const range = useMemo(() => {
    if (periode === 'aangepast') {
      let van = customVan < minDate ? minDate : customVan;
      let tot = customTot > today ? today : customTot;
      if (van > tot) van = tot;
      return { van: toISO(van), tot: toISO(tot) };
    }
    return periodeRange(periode);
  }, [periode, customVan, customTot, minDate, today]);

  const effectiveMode: VergelijkMode = modeOverride ?? vergelijkModeVan(periode);

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
          effectiveVan={range.van} effectiveTot={range.tot}
          setCustomVan={setCustomVan} setCustomTot={setCustomTot}
          minDate={minDate} today={today} presets={presets}
          applyPresetMode={applyPresetMode}
        />

        <CijfersMetricsBar periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} mode={effectiveMode} />

        {magLoon && (
          <CijfersLoonkostenBar periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} mode={effectiveMode} />
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

        {magLoon && (
          <CijfersLoonkostenDoelGrafiek periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
        )}


        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
          <CijfersUurverloop periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
          <CijfersVestigingSplit periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} mode={effectiveMode} />
        </div>

        <CijfersHeatmap periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />

        {magLoon && (
          <CijfersLozeUren periode={periode} vestigingKeuze={vestKeuze} van={range.van} tot={range.tot} />
        )}

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
  effectiveVan: string; effectiveTot: string;
  setCustomVan: (d: Date) => void; setCustomTot: (d: Date) => void;
  minDate: Date; today: Date;
  presets: { snel: Preset[]; vergelijk: Preset[] };
  applyPresetMode: (p: Periode, override: VergelijkMode | null) => void;
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
          effectiveVan={props.effectiveVan}
          effectiveTot={props.effectiveTot}
          setVan={props.setCustomVan} setTot={props.setCustomTot}
          minDate={props.minDate} today={props.today}
          presets={props.presets}
          setPeriode={props.setPeriode}
          applyPresetMode={props.applyPresetMode}
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

function fmtNL(d?: Date): string {
  if (!d) return '—';
  return format(d, 'd MMM yyyy', { locale: nl });
}

function DateRangePopover({
  label, effectiveVan, effectiveTot, setVan, setTot, minDate, today, presets, setPeriode, applyPresetMode,
}: {
  label: string;
  effectiveVan: string; effectiveTot: string;
  setVan: (d: Date) => void; setTot: (d: Date) => void;
  minDate: Date; today: Date;
  presets: { snel: Preset[]; vergelijk: Preset[] };
  setPeriode: (p: Periode) => void;
  applyPresetMode: (p: Periode, override: VergelijkMode | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const parseISO = (s: string) => { const d = new Date(s); d.setHours(0,0,0,0); return d; };
  const [range, setRange] = useState<{ from?: Date; to?: Date }>(
    () => ({ from: parseISO(effectiveVan), to: parseISO(effectiveTot) })
  );
  const [month, setMonth] = useState<Date>(() => parseISO(effectiveVan));

  // Bij OPENEN: altijd huidige effectieve selectie tonen (P1-fix voor stale highlight).
  useEffect(() => {
    if (open) {
      const from = parseISO(effectiveVan);
      const to = parseISO(effectiveTot);
      setRange({ from, to });
      setMonth(from);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const applyPreset = (p: Preset) => {
    setVan(p.van); setTot(p.tot);
    applyPresetMode(p.periode, p.override);
    setOpen(false);
  };

  const applyCustom = (from: Date, to: Date) => {
    setVan(from); setTot(to);
    setPeriode('aangepast'); // reset override → mode='custom'
    setOpen(false);
  };


  const canApply = !!(range.from && range.to);
  const rangeHeader = range.from && range.to
    ? `${fmtNL(range.from)}  →  ${fmtNL(range.to)}`
    : range.from
      ? `${fmtNL(range.from)}  →  kies einddatum…`
      : 'Kies een startdatum…';

  const fromYear = minDate.getFullYear();
  const toYear = today.getFullYear();

  const isActive = (p: Preset) => {
    const pv = toISO(p.van), pt = toISO(p.tot);
    return pv === effectiveVan && pt === effectiveTot;
  };

  const PresetRow = ({ p }: { p: Preset }) => {
    const active = isActive(p);
    return (
      <button
        type="button"
        onClick={() => applyPreset(p)}
        className={cn(
          'w-full text-left px-2.5 h-8 rounded-md text-[12.5px] transition-colors',
          active
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )}
      >{p.label}</button>
    );
  };

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
          <ChevronDown size={13} strokeWidth={2} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-auto">
        <div className="flex" style={{ minHeight: 320 }}>
          {/* Presets — smalle kolom links */}
          <div className="w-[148px] border-r border-border p-1.5 flex flex-col gap-0.5 bg-muted/20">
            {presets.snel.map((p) => <PresetRow key={p.label} p={p} />)}
            <div className="h-px bg-border my-1.5 mx-1" />
            {presets.vergelijk.map((p) => <PresetRow key={p.label} p={p} />)}
          </div>

          {/* Kalender-kolom */}
          <div className="flex flex-col">
            <div className="px-3 pt-2 pb-1 text-[11px] tabular-nums text-muted-foreground">
              {rangeHeader}
            </div>
            <Calendar
              mode="range"
              selected={range as any}
              onSelect={(r: any) => setRange(r ?? {})}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={1}
              disabled={(d) => d < minDate || d > today}
              captionLayout="dropdown-buttons"
              fromYear={fromYear}
              toYear={toYear}
              fromDate={minDate}
              toDate={today}
              initialFocus locale={nl} weekStartsOn={1}
              className="p-2 pointer-events-auto"
              classNames={{
                caption_label: 'hidden',
                head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-[0.72rem]',
                cell: 'h-8 w-8 text-center text-[12.5px] p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground',
              }}
            />
            <div className="flex items-center justify-end gap-1.5 px-2 py-1.5 border-t border-border">
              <Button
                variant="ghost" size="sm" className="h-7 px-2.5 text-xs"
                onClick={() => setOpen(false)}
              >Annuleren</Button>
              <Button
                size="sm" className="h-7 px-3 text-xs"
                disabled={!canApply}
                onClick={() => { if (range.from && range.to) applyCustom(range.from, range.to); }}
              >Toepassen</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}



