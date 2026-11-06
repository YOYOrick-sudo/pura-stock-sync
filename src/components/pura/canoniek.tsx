import { AlertTriangle, CircleAlert, CircleCheck, Minus, Plus, type LucideIcon } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { PaginaBalk, RijMeta, StatusLabel, type StatusToon } from '@/components/pura/lijst';
import { klemAantal, stapperBevestig, stapperTekst } from '@/hooks/useInterneLevering';
import { cn } from '@/lib/utils';

/**
 * Gesloten maten. Nieuwe schermen gebruiken alleen deze waarden.
 * Afstand 8/12/16/24. Rij en sectiekop 48px. Bediening 44px.
 * Dialoog-radius is die van DialogContent (24). primary is alleen de actie.
 */
export const CANONIEK = {
  rij: 'min-h-12',
  control: 'h-11',
  ruimte: [8, 12, 16, 24] as const,
  radius: {
    pill: 'rounded-full',
    klein: 'rounded-polar-sm',
    binnen: 'rounded-polar-md',
    kaart: 'rounded-polar-lg',
    dialoog: 'rounded-polar-2xl',
  },
} as const;

/** Vaste lucide-betekenis. Nieuwe metaforen horen eerst in de stylinggids. */
export const ICOON = {
  bestelbord: 'ClipboardList',
  intern: 'ArrowLeftRight',
  koelcel: 'Refrigerator',
  vriezer: 'Snowflake',
  magazijn: 'Warehouse',
  mep: 'ListChecks',
  datum: 'CalendarClock',
  letOp: 'AlertTriangle',
  fout: 'CircleAlert',
  goed: 'CircleCheck',
  toevoegen: 'Plus',
  opties: 'MoreVertical',
  zoeken: 'Search',
  info: 'Info',
} as const;

const statusIcoon: Partial<Record<StatusToon, LucideIcon>> = {
  goed: CircleCheck,
  'let-op': AlertTriangle,
  fout: CircleAlert,
};

/**
 * De ene stapper. Zelfde veld op het bord en in Telrij.
 * 44px, cijfer text-sm, eenheid text-xs, items-center leading-none.
 */
export function AantalStapper({ waarde, min, max, eenheid, onChange, label = 'Aantal' }: {
  waarde: number;
  min: number;
  max: number | null;
  eenheid?: string;
  onChange: (n: number) => void;
  label?: string;
}) {
  const conceptRef = useRef<string | null>(null);
  const [concept, setConcept] = useState<string | null>(null);
  const toon = (tekst: string | null) => {
    conceptRef.current = tekst;
    setConcept(tekst);
  };
  const lees = () => conceptRef.current == null ? waarde : stapperBevestig(conceptRef.current, min, max);
  const getoond = concept ?? String(waarde);
  const zet = (n: number) => {
    toon(null);
    onChange(klemAantal(n, min, max));
  };
  return (
    <div className="flex h-11 shrink-0 items-center rounded-polar-lg border border-border bg-background">
      <Button type="button" variant="ghost" size="touch-icon" className="rounded-none" aria-label="Minder" disabled={lees() <= min} onClick={() => zet(lees() - 1)}>
        <Minus className="h-4 w-4" />
      </Button>
      <label className="flex h-11 min-w-[5.5rem] cursor-text items-center justify-center gap-2 px-1 leading-none">
        <input
          value={getoond}
          onChange={(e) => {
            const tekst = stapperTekst(e.target.value);
            toon(tekst);
            if (tekst) onChange(klemAantal(Number(tekst), min, max));
          }}
          onBlur={() => {
            if (conceptRef.current === '') onChange(min);
            toon(null);
          }}
          inputMode="numeric"
          aria-label={label}
          style={{ width: `${Math.max(1, getoond.length)}ch` }}
          className="bg-transparent p-0 text-center text-sm font-semibold tabular-nums leading-none text-foreground outline-none"
        />
        {eenheid && <span className="text-xs leading-none text-muted-foreground">{eenheid}</span>}
      </label>
      <Button type="button" variant="ghost" size="touch-icon" className="rounded-none" aria-label="Meer" disabled={max != null && lees() >= max} onClick={() => zet(lees() + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Paginakop is PaginaBalk: geen titel. Links tabs, rechts hooguit één primaire actie. */
export function Paginakop({ links, actie }: { links: ReactNode; actie?: ReactNode }) {
  return <PaginaBalk links={links} actie={actie} />;
}

/** Dunne voortgangsbalk. De primitive is h-4; in een kaart blijft hij h-1. */
export function VoortgangBalk({ waarde, label }: { waarde: number; label: string }) {
  return <Progress value={waarde} aria-label={label} className="h-1 rounded-none" />;
}

/** Ring voor een teller in de sectiekop. Kleur is de actie-accent, niet de goed-status. */
export function VoortgangRing({ waarde, label }: { waarde: number; label: string }) {
  const v = Math.max(0, Math.min(100, waarde));
  const r = 7;
  const omtrek = 2 * Math.PI * r;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" role="img" aria-label={label} className="shrink-0">
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="2" className="stroke-border" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-primary"
        strokeDasharray={omtrek}
        strokeDashoffset={omtrek * (1 - v / 100)}
        transform="rotate(-90 10 10)"
      />
    </svg>
  );
}

/** Werkkaart: één onderwerp. Zijmarge zit in de kop en de rijen. Geen extra kader. */
export function Werkkaart({
  icoon,
  titel,
  teller,
  actie,
  voortgang,
  children,
  voet,
}: {
  icoon?: LucideIcon;
  titel: ReactNode;
  teller?: number;
  actie?: ReactNode;
  voortgang?: number;
  children: ReactNode;
  voet?: ReactNode;
}) {
  return (
    <LijstKaart
      kop={<KaartKop icoon={icoon} titel={titel} teller={teller} rechts={actie} />}
      voet={voet}
    >
      {voortgang != null && <VoortgangBalk waarde={voortgang} label="Voortgang" />}
      {children}
    </LijstKaart>
  );
}

/** Sectiekop: 48px, zin, zelfde zijmarge als de rijen. `groep` zet alleen een lijn. */
export function Sectiekop({
  titel,
  teller,
  actie,
  voortgang,
  groep = false,
}: {
  titel: ReactNode;
  teller?: ReactNode;
  actie?: ReactNode;
  voortgang?: number;
  groep?: boolean;
}) {
  return (
    <div className={cn('flex min-h-12 items-center justify-between gap-3 px-4 lg:px-6', groep && 'border-t border-border')}>
      <div className="flex min-w-0 items-center gap-3 text-base font-semibold tracking-tight text-foreground">
        {voortgang != null && <VoortgangRing waarde={voortgang} label="Voortgang" />}
        <span className="truncate">{titel}</span>
        {teller != null && <span className="tabular-nums font-normal text-muted-foreground">{teller}</span>}
      </div>
      {actie ? <div className="shrink-0">{actie}</div> : null}
    </div>
  );
}

/** Lijstrij: naam, meta altijd op regel 2, hooguit één status, actie rechts. */
export function Lijstrij({
  naam,
  meta,
  status,
  actie,
  onTik,
}: {
  naam: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
  actie?: ReactNode;
  onTik?: () => void;
}) {
  return (
    <div
      role={onTik ? 'button' : undefined}
      tabIndex={onTik ? 0 : undefined}
      onClick={onTik}
      onKeyDown={onTik ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTik(); } } : undefined}
      className={cn('flex min-h-12 items-center gap-3 border-b border-border px-4 text-left last:border-0 lg:px-6', onTik && 'cursor-pointer')}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{naam}</span>
          {status}
        </div>
        {meta ? <RijMeta altijd>{meta}</RijMeta> : null}
      </div>
      {actie ? (
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {actie}
        </div>
      ) : null}
    </div>
  );
}

/** Afvinkrij: vinkje in een vak van 44px, naam, meta, hooguit één status. */
export function Afvinkrij({
  naam,
  meta,
  klaar = false,
  onKlaar,
  status,
  id,
}: {
  naam: ReactNode;
  meta?: ReactNode;
  klaar?: boolean;
  onKlaar?: (klaar: boolean) => void;
  status?: ReactNode;
  id?: string;
}) {
  const auto = useId();
  const veld = id ?? auto;
  return (
    <label htmlFor={veld} className="flex min-h-12 items-center gap-3 border-b border-border px-4 last:border-0 lg:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
        <Checkbox id={veld} checked={klaar} onCheckedChange={(v) => onKlaar?.(v === true)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm', klaar ? 'text-muted-foreground line-through' : 'font-medium text-foreground')}>{naam}</span>
        {meta ? <RijMeta altijd>{meta}</RijMeta> : null}
      </span>
      {status ? <span className="shrink-0">{status}</span> : null}
    </label>
  );
}

/**
 * Telrij: naam + meta links, AantalStapper en outline-knop rechts, allebei 44px.
 * De rij-actie is nooit groen: één primary hoort op de pagina, niet op elke rij.
 */
export function Telrij({
  naam,
  meta,
  waarde,
  min = 1,
  max = null,
  eenheid,
  onChange,
  actieLabel,
  onActie,
  bezig = false,
}: {
  naam: string;
  meta?: ReactNode;
  waarde: number;
  min?: number;
  max?: number | null;
  eenheid?: string;
  onChange: (n: number) => void;
  actieLabel?: string;
  onActie?: () => void;
  bezig?: boolean;
}) {
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 last:border-0 lg:px-6">
      <div className="min-w-0 flex-1 basis-full sm:basis-0">
        <span className="block truncate text-sm font-medium text-foreground">{naam}</span>
        {meta ? <RijMeta altijd>{meta}</RijMeta> : null}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <AantalStapper waarde={waarde} min={min} max={max} eenheid={eenheid} label={`Aantal ${naam}`} onChange={onChange} />
        {actieLabel ? (
          <Button type="button" size="touch" variant="outline" className="shrink-0" disabled={bezig} onClick={onActie}>
            {actieLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Zelfde pill als StatusLabel. Optioneel het vaste icoon bij de toon. Tekst blijft verplicht. */
export function Statusbadge({ toon = 'neutraal', icoon, children }: { toon?: StatusToon; icoon?: boolean; children: ReactNode }) {
  const Icoon = icoon ? statusIcoon[toon] : undefined;
  return (
    <StatusLabel toon={toon}>
      <span className="inline-flex items-center gap-2">
        {Icoon ? <Icoon className="h-4 w-4" aria-hidden /> : null}
        {children}
      </span>
    </StatusLabel>
  );
}

/**
 * Dialoog volgt DialogContent: radius 24, titel text-lg.
 * Annuleren is ghost. Eén bevestiging, primary of destructive.
 */
export function Dialoog({
  open,
  onOpenChange,
  titel,
  tekst,
  children,
  annuleren = 'Annuleren',
  bevestigen,
  onBevestig,
  gevaar = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titel: string;
  tekst?: string;
  children?: ReactNode;
  annuleren?: string;
  bevestigen?: string;
  onBevestig?: () => void;
  gevaar?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle>{titel}</DialogTitle>
          {tekst ? <DialogDescription>{tekst}</DialogDescription> : null}
        </DialogHeader>
        {children}
        {bevestigen ? (
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="ghost" size="touch" onClick={() => onOpenChange(false)}>{annuleren}</Button>
            <Button type="button" variant={gevaar ? 'destructive' : 'default'} size="touch" onClick={onBevestig}>{bevestigen}</Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Label boven het veld. Invoer in de app is h-10; hier wordt hij 44px. */
export function Formulierveld({
  id,
  label,
  hint,
  fout,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  fout?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 [&_input]:h-11 [&_input]:text-base [&_[role=combobox]]:h-11">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {fout ? <p className="text-xs text-destructive" role="alert">{fout}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Lege lijst nadat laden klaar is. Eén zin, compact. Icoon en actie blijven uit tenzij je ze zet. */
export function LegeStaatBlok({ tekst, actie, icoon: Icoon }: { tekst: string; actie?: ReactNode; icoon?: LucideIcon }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-polar-lg border border-dashed border-border bg-muted px-4 py-3">
      {Icoon ? <Icoon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{tekst}</p>
      {actie}
    </div>
  );
}
