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

/** Preset uit de popover: elke shortcut geeft óók de juiste periode-mode mee,
 *  zodat de D-vergelijkingslogica correct blijft (dag/week/maand/jaar/aangepast). */
type Preset = { label: string; van: Date; tot: Date; mode: Periode };

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
    snel: [
      { label: 'Vandaag', van: today, tot: today, mode: 'vandaag' },
      { label: 'Deze week', van: thisMon, tot: today, mode: 'week' },
      { label: 'Deze maand', van: firstThisMonth, tot: today, mode: 'maand' },
      { label: 'Dit jaar', van: firstThisYear, tot: today, mode: 'jaar' },
    ],
    vergelijk: [
      { label: 'Gisteren', van: gisteren, tot: gisteren, mode: 'vandaag' },
      { label: 'Vorige week', van: prevMon, tot: prevSun, mode: 'week' },
      { label: 'Vorig weekend', van: laatsteZa, tot: laatsteZo, mode: 'aangepast' },
      { label: 'Deze maand vorig jaar', van: firstLYSameMonth, tot: lastLYSameMonth, mode: 'maand' },
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
  label, effectiveVan, effectiveTot, setVan, setTot, minDate, today, presets, setPeriode,
}: {
  label: string;
  effectiveVan: string; effectiveTot: string;
  setVan: (d: Date) => void; setTot: (d: Date) => void;
  minDate: Date; today: Date;
  presets: { snel: Preset[]; vergelijk: Preset[] };
  setPeriode: (p: Periode) => void;
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

  const apply = (from: Date, to: Date, mode: Periode) => {
    setVan(from); setTot(to);
    setPeriode(mode);
    setOpen(false);
  };

  const applyPreset = (p: Preset) => apply(p.van, p.tot, p.mode);

  const canApply = !!(range.from && range.to);
  const rangeHeader = range.from && range.to
    ? `${fmtNL(range.from)}  →  ${fmtNL(range.to)}`
    : range.from
      ? `${fmtNL(range.from)}  →  kies einddatum…`
      : 'Kies een startdatum…';

  const fromYear = minDate.getFullYear();
  const toYear = today.getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px',
            background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12,
            fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', minHeight: 40,
          }}
        >
          <CalendarIcon size={14} strokeWidth={2} className="text-muted-foreground" />
          <span className="tabular-nums">{label}</span>
          <ChevronDown size={13} strokeWidth={2} className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {/* Snelle presets — één klik naar juiste mode */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Snel</div>
          <div className="flex flex-wrap gap-1.5">
            {presets.snel.map((p) => (
              <Button
                key={p.label} variant="outline" size="sm"
                className="h-10 min-w-[80px] rounded-polar-md text-xs font-medium"
                onClick={() => applyPreset(p)}
              >{p.label}</Button>
            ))}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium pt-1">Vergelijken</div>
          <div className="flex flex-wrap gap-1.5">
            {presets.vergelijk.map((p) => (
              <Button
                key={p.label} variant="outline" size="sm"
                className="h-10 rounded-polar-md text-xs font-medium"
                onClick={() => applyPreset(p)}
              >{p.label}</Button>
            ))}
          </div>
        </div>

        {/* Live-header met van→tot */}
        <div className="px-3 py-2 border-b border-border text-xs tabular-nums text-foreground bg-muted/30">
          {rangeHeader}
        </div>

        <Calendar
          mode="range"
          selected={range as any}
          onSelect={(r: any) => setRange(r ?? {})}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          disabled={(d) => d < minDate || d > today}
          captionLayout="dropdown-buttons"
          fromYear={fromYear}
          toYear={toYear}
          fromDate={minDate}
          toDate={today}
          initialFocus locale={nl} weekStartsOn={1}
          className={cn('p-3 pointer-events-auto')}
        />

        {/* Actiebalk — geen auto-close meer, correctie mogelijk */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground">Max 12 maanden terug</span>
          <div className="flex gap-2">
            <Button
              variant="ghost" size="sm" className="h-9"
              onClick={() => setOpen(false)}
            >Annuleren</Button>
            <Button
              size="sm" className="h-9"
              disabled={!canApply}
              onClick={() => {
                if (range.from && range.to) apply(range.from, range.to, 'aangepast');
              }}
            >Toepassen</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


