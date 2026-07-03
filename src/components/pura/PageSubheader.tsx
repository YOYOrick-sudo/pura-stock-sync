import type { ReactNode } from 'react';

interface PageSubheaderProps {
  /** Kort context-zinnetje onder de app-header. Geen tweede paginatitel. */
  description?: string;
  /** Max 1 primaire actie rechts. Compacte knop, geen FAB. */
  action?: ReactNode;
  /** Optionele extra content (bv. segmented tabs) — zelden gebruikt. */
  children?: ReactNode;
}

/**
 * PageSubheader — optionele context-regel direct onder de app-header.
 * De app-header (`PolarHeader`) is de enige plek voor titel + locatie + datum.
 * Modules zetten hier NOOIT een tweede kop bovenop.
 */
export function PageSubheader({ description, action, children }: PageSubheaderProps) {
  if (!description && !action && !children) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
      {children && <div className="w-full">{children}</div>}
    </div>
  );
}
