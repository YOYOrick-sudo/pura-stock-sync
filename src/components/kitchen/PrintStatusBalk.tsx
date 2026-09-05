import { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrintStatus, WACHTRIJ_OUD_MS, type PrintJob } from '@/hooks/usePrintStatus';

function fmtTijd(iso: string | null) {
  return iso ? format(new Date(iso), 'HH:mm', { locale: nl }) : null;
}

function StatusBadge({ job }: { job: PrintJob }) {
  if (job.status === 'done')
    return <span className="text-success font-medium">geprint {fmtTijd(job.geprint_op)}</span>;
  if (job.status === 'error')
    return <span className="text-destructive font-medium">mislukt</span>;
  const oud = Date.now() - new Date(job.created_at).getTime() > WACHTRIJ_OUD_MS;
  return (
    <span className={oud ? 'text-warning font-medium' : 'text-muted-foreground'}>
      {oud ? 'wacht al >2 min' : 'in wachtrij'}
    </span>
  );
}

export function PrintStatusBalk() {
  const { data } = usePrintStatus();
  const [open, setOpen] = useState(false);
  if (!data) return null;

  const { bridgeActief, laatstePrint, wachtrijOud, recent } = data;
  const problemen = !bridgeActief || wachtrijOud.length > 0;

  return (
    <div
      className={cn(
        'rounded-polar-lg border text-sm',
        problemen ? 'border-warning/40 bg-warning/10' : 'border-border bg-card',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 min-h-[44px] text-left"
      >
        {bridgeActief ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
        )}
        <span className="flex-1 font-medium">
          {bridgeActief
            ? `Printer actief${laatstePrint ? ` — laatste sticker om ${fmtTijd(laatstePrint)}` : ''}`
            : 'Printer reageert niet — staat het kastje bij de printer aan?'}
        </span>
        {wachtrijOud.length > 0 && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            {wachtrijOud.length} in wachtrij
          </span>
        )}
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/60 px-3 py-2">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Printer className="h-3.5 w-3.5" /> Laatste stickers
          </p>
          {recent.length === 0 && (
            <p className="py-1 text-sm text-muted-foreground">Nog geen stickers aangemaakt.</p>
          )}
          <ul className="divide-y divide-border/60">
            {recent.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {j.label_omschrijving ?? 'Sticker'}
                  <span className="ml-1.5 text-xs text-muted-foreground">{fmtTijd(j.created_at)}</span>
                </span>
                <StatusBadge job={j} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
