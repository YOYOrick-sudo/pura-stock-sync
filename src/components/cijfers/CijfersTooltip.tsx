import type { ReactNode } from 'react';
import { EUR } from './types';
import { deltaKleur, deltaPijl, KLEUR_STYLE, type DeltaIntent } from './deltaKleur';

export interface TooltipRow {
  label: string;
  color: string;
  value: number;
  extra?: string;
}

interface Props {
  title: string;
  rows: TooltipRow[];
  deltaPct?: number | null;
  /** Wat is "goed"? Default: hoger-is-goed (omzet-context). */
  deltaIntent?: DeltaIntent;
  footer?: ReactNode;
}

/** Herbruikbare tooltip-kaart voor grafiek & heatmap. */
export function CijfersTooltipCard({ title, rows, deltaPct, deltaIntent = 'hoger-is-goed', footer }: Props) {
  return (
    <div className="rounded-[12px] border border-border bg-card shadow-lg px-3 py-2.5 text-xs min-w-[180px]">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-semibold text-foreground">{title}</span>
        {typeof deltaPct === 'number' && (() => {
          const kleur = deltaKleur(deltaPct, deltaIntent);
          const { bg, fg } = KLEUR_STYLE[kleur];
          const pijl = deltaPijl(deltaPct);
          const teken = deltaPct >= 0 ? '+' : '';
          return (
            <span
              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
              style={{ background: bg, color: fg }}
            >
              {pijl}{pijl ? ' ' : ''}{teken}{deltaPct.toFixed(1)}%
            </span>
          );
        })()}
      </div>
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
            <span className="text-muted-foreground flex-1 truncate">{r.label}</span>
            <span className="font-medium tabular-nums text-foreground">{EUR.format(r.value)}</span>
            {r.extra && <span className="text-muted-foreground">· {r.extra}</span>}
          </div>
        ))}
      </div>
      {footer && <div className="mt-1.5 pt-1.5 border-t border-border/60 text-[10px] text-muted-foreground">{footer}</div>}
    </div>
  );
}
