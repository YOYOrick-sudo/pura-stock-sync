import { Minus, Plus, type LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { KaartKop, LijstKaart } from '@/components/pura/patronen';
import { RijMeta, StatusLabel, type StatusToon } from '@/components/pura/lijst';
import { cn } from '@/lib/utils';

/**
 * Gesloten maten. Nieuwe schermen gebruiken alleen deze waarden.
 * Afstand: 8, 12, 16, 24. Rij 48px. Bediening op werkschermen 44px.
 */
export const CANONIEK = {
  rij: 'min-h-12',
  control: 'h-11',
  ruimte: [8, 12, 16, 24] as const,
  radius: {
    kaart: 'rounded-polar-lg',
    binnen: 'rounded-polar-md',
    dialoog: 'rounded-polar-xl',
    klein: 'rounded-polar-sm',
    status: 'rounded-full',
  },
} as const;

/** Paginakop: geen titel (die staat in de app-header). Links filters of tabs, rechts hooguit één actie. */
export function Paginakop({ links, actie }: { links: ReactNode; actie?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0 flex-1">{links}</div>
      {actie ? <div className="shrink-0">{actie}</div> : null}
    </div>
  );
}

/** Werkkaart: één onderwerp. Kop, rijen van rand tot rand, optionele voetzin. */
export function Werkkaart({
  icoon,
  titel,
  teller,
  actie,
  children,
  voet,
}: {
  icoon?: LucideIcon;
  titel: ReactNode;
  teller?: number;
  actie?: ReactNode;
  children: ReactNode;
  voet?: ReactNode;
}) {
  return (
    <LijstKaart
      kop={<KaartKop icoon={icoon} titel={titel} teller={teller} rechts={actie} />}
      voet={voet}
    >
      {children}
    </LijstKaart>
  );
}

/** Sectiekop binnen een kaart. Zin, geen kapitalen. `groep` zet een lijn erboven. */
export function Sectiekop({
  titel,
  teller,
  actie,
  groep = false,
}: {
  titel: ReactNode;
  teller?: ReactNode;
  actie?: ReactNode;
  groep?: boolean;
}) {
  return (
    <div className={cn('flex min-h-9 items-center justify-between gap-2 px-4 lg:px-6', groep && 'border-t border-border')}>
      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
        <span className="truncate">{titel}</span>
        {teller != null && <span className="tabular-nums font-normal text-muted-foreground">{teller}</span>}
      </div>
      {actie ? <div className="shrink-0">{actie}</div> : null}
    </div>
  );
}

/** Lijstrij: naam, meta altijd op regel 2, hooguit één status, actie rechts. Alle rijen min-h-12. */
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
        <RijMeta altijd>{meta ?? '—'}</RijMeta>
      </div>
      {actie ? (
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {actie}
        </div>
      ) : null}
    </div>
  );
}

/** Afvinkrij: vinkje links (44px), naam, meta, hooguit één status rechts. */
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
    <label htmlFor={veld} className="flex min-h-12 items-center gap-2 border-b border-border px-4 last:border-0 lg:px-6">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
        <Checkbox id={veld} checked={klaar} onCheckedChange={(v) => onKlaar?.(v === true)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm', klaar ? 'text-muted-foreground line-through' : 'font-medium text-foreground')}>{naam}</span>
        <RijMeta altijd>{meta ?? '—'}</RijMeta>
      </span>
      {status ? <span className="shrink-0">{status}</span> : null}
    </label>
  );
}

function TelStapper({
  waarde,
  min,
  max,
  eenheid,
  label,
  onChange,
}: {
  waarde: number;
  min: number;
  max: number | null;
  eenheid?: string;
  label: string;
  onChange: (n: number) => void;
}) {
  const zet = (n: number) => onChange(max == null ? Math.max(min, n) : Math.min(max, Math.max(min, n)));
  return (
    <div className="flex h-11 items-center rounded-polar-lg border border-input bg-background">
      <Button type="button" variant="ghost" size="touch-icon" aria-label="Minder" disabled={waarde <= min} onClick={() => zet(waarde - 1)}>
        <Minus className="h-4 w-4" />
      </Button>
      <label className="flex h-11 min-w-[5.5rem] items-center justify-center gap-2 px-1 leading-none">
        <input
          value={String(waarde)}
          onChange={(e) => {
            const cijfers = e.target.value.replace(/[^0-9]/g, '');
            if (cijfers) zet(Number(cijfers));
          }}
          inputMode="numeric"
          aria-label={label}
          style={{ width: `${Math.max(1, String(waarde).length)}ch` }}
          className="bg-transparent p-0 text-center text-sm font-semibold tabular-nums leading-none text-foreground outline-none"
        />
        {eenheid ? <span className="text-xs leading-none text-muted-foreground">{eenheid}</span> : null}
      </label>
      <Button type="button" variant="ghost" size="touch-icon" aria-label="Meer" disabled={max != null && waarde >= max} onClick={() => zet(waarde + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Telrij: naam + meta links, stapper en actie rechts, allebei 44px.
 * De rij-actie is outline. Groen (`primair`) alleen als deze kaart verder geen primaire knop heeft.
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
  primair = false,
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
  primair?: boolean;
  bezig?: boolean;
}) {
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2 last:border-0 lg:px-6">
      <div className="min-w-0 flex-1 basis-full sm:basis-0">
        <span className="block truncate text-sm font-medium text-foreground">{naam}</span>
        <RijMeta altijd>{meta ?? '—'}</RijMeta>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <TelStapper waarde={waarde} min={min} max={max} eenheid={eenheid} label={`Aantal ${naam}`} onChange={onChange} />
        {actieLabel ? (
          <Button type="button" size="touch" variant={primair ? 'default' : 'outline'} disabled={bezig} onClick={onActie}>
            {actieLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Eén status per rij, altijd met tekst. Groen goed, oranje let op, rood fout, grijs neutraal. */
export function Statusbadge({ toon = 'neutraal', children }: { toon?: StatusToon; children: ReactNode }) {
  return <StatusLabel toon={toon}>{children}</StatusLabel>;
}

/** Dialoog: titel, tekst, Annuleren (ghost) en hooguit één bevestiging. */
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
      <DialogContent className="gap-4 rounded-polar-xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-sm font-semibold">{titel}</DialogTitle>
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

/** Formulierveld: label boven het veld, hulpzin eronder. Invoer in het veld is 44px. */
export function Formulierveld({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 [&_input]:h-11 [&_input]:text-base [&_[role=combobox]]:h-11">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Lege staat in een lijst: één zin, geen icoon. */
export function LegeStaatBlok({ tekst }: { tekst: string }) {
  return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{tekst}</p>;
}
