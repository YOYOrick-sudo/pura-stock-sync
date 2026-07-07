import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/pura/StatusBadge';
import { Loader2, Copy, RefreshCw, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export type WeekResult = {
  van: string;
  tot: string;
  status: 'wachtend' | 'bezig' | 'ok' | 'fout';
  bonnen: number | null;
  omzet: number | null;
  duurMs: number | null;
  fout: string | null;
};

export type BackfillState = {
  open: boolean;
  vestiging: 'Midsland' | 'West';
  weken: WeekResult[];
  huidigeIdx: number;
  geannuleerd: boolean;
  klaar: boolean;
};

function fmtEuro(n: number | null): string {
  if (n === null) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmtInt(n: number | null): string {
  if (n === null) return '—';
  return new Intl.NumberFormat('nl-NL').format(n);
}
function fmtDate(iso: string): string {
  return iso.slice(5); // MM-DD
}
function fmtDuur(ms: number | null): string {
  if (ms === null) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

export function BackfillProgressDialog({
  state,
  onClose,
  onCancel,
  onRetryFailed,
}: {
  state: BackfillState | null;
  onClose: () => void;
  onCancel: () => void;
  onRetryFailed: () => void;
}) {
  if (!state) return null;

  const total = state.weken.length;
  const gedaan = state.weken.filter((w) => w.status === 'ok' || w.status === 'fout').length;
  const okCount = state.weken.filter((w) => w.status === 'ok').length;
  const foutCount = state.weken.filter((w) => w.status === 'fout').length;
  const totBonnen = state.weken.reduce((s, w) => s + (w.bonnen ?? 0), 0);
  const totOmzet = state.weken.reduce((s, w) => s + (w.omzet ?? 0), 0);
  const pct = total === 0 ? 0 : Math.round((gedaan / total) * 100);

  const bezigIdx = state.weken.findIndex((w) => w.status === 'bezig');
  const huidigeWeekLabel = bezigIdx >= 0 ? `week ${bezigIdx + 1}/${total}` : state.klaar ? 'klaar' : 'wachten…';

  const gefaald = state.weken.filter((w) => w.status === 'fout');

  // Toon rijen in omgekeerde volgorde (nieuwste bovenaan) maar de "bezig" en "wachtend" gescheiden
  const sortedRows = [...state.weken]
    .map((w, i) => ({ ...w, idx: i }))
    .sort((a, b) => {
      const order = (s: string) => (s === 'bezig' ? 0 : s === 'ok' || s === 'fout' ? 1 : 2);
      if (order(a.status) !== order(b.status)) return order(a.status) - order(b.status);
      if (a.status === 'ok' || a.status === 'fout') return b.idx - a.idx; // nieuwste eerst
      return a.idx - b.idx;
    });

  const copyFailed = async () => {
    const text = gefaald.map((w) => `${w.van} → ${w.tot}   ${w.fout ?? ''}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Gekopieerd', description: `${gefaald.length} gefaalde weken op klembord` });
    } catch {
      toast({ title: 'Kopiëren mislukt', variant: 'destructive' });
    }
  };

  const handleClose = () => {
    if (!state.klaar && !state.geannuleerd) {
      if (confirm('Backfill loopt nog. Echt annuleren? De huidige week loopt af, verdere weken worden overgeslagen.')) {
        onCancel();
      }
      return;
    }
    onClose();
  };

  return (
    <Dialog open={state.open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-3">
            <span>Backfill {state.vestiging}</span>
            <span className="text-sm font-normal text-muted-foreground">— {huidigeWeekLabel}</span>
          </DialogTitle>
          <div className="mt-3 space-y-2">
            <Progress value={pct} className="h-2" />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>{gedaan} / {total} weken</span>
              <span>{pct}%</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-2 font-medium">week</th>
                <th className="py-2 pr-2 font-medium">status</th>
                <th className="py-2 pr-2 font-medium text-right">bonnen</th>
                <th className="py-2 pr-2 font-medium text-right">omzet</th>
                <th className="py-2 pr-2 font-medium text-right">duur</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((w) => (
                <tr key={`${w.van}-${w.idx}`} className="border-b border-border/40 last:border-0" title={w.fout ?? undefined}>
                  <td className="py-2 pr-2 font-mono text-[11px] whitespace-nowrap">
                    {fmtDate(w.van)} → {fmtDate(w.tot)}
                  </td>
                  <td className="py-2 pr-2">
                    {w.status === 'bezig' ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Loader2 className="w-3 h-3 animate-spin" /> bezig
                      </span>
                    ) : w.status === 'ok' ? (
                      <StatusBadge tone="success">ok</StatusBadge>
                    ) : w.status === 'fout' ? (
                      <StatusBadge tone="danger">fout</StatusBadge>
                    ) : (
                      <span className="text-muted-foreground">wachtend</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right font-mono">{fmtInt(w.bonnen)}</td>
                  <td className="py-2 pr-2 text-right font-mono">{fmtEuro(w.omzet)}</td>
                  <td className="py-2 pr-2 text-right font-mono text-muted-foreground">{fmtDuur(w.duurMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {state.klaar && gefaald.length > 0 && (
            <div className="mt-5 rounded-[14px] border border-destructive/30 bg-destructive/5 p-4">
              <div className="text-sm font-semibold text-destructive mb-2">
                {gefaald.length} {gefaald.length === 1 ? 'week faalde' : 'weken faalden'}
              </div>
              <div className="space-y-1 text-xs font-mono">
                {gefaald.map((w) => (
                  <div key={w.van} className="flex gap-3">
                    <span className="whitespace-nowrap">{w.van} → {w.tot}</span>
                    <span className="text-muted-foreground truncate">{w.fout}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onRetryFailed}>
                  <RefreshCw className="w-3.5 h-3.5 mr-2" /> Opnieuw proberen
                </Button>
                <Button size="sm" variant="outline" onClick={copyFailed}>
                  <Copy className="w-3.5 h-3.5 mr-2" /> Kopieer als tekst
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 flex items-center gap-4 bg-muted/30">
          <div className="flex-1 text-xs">
            <span className="font-semibold text-foreground">Verwerkt:</span>{' '}
            <span className="text-muted-foreground">
              {gedaan} weken · {fmtInt(totBonnen)} bonnen ·{' '}
              <span className="text-foreground font-medium">{fmtEuro(totOmzet)}</span>
              {foutCount > 0 && (
                <> · <span className="text-destructive font-medium">{foutCount} gefaald</span></>
              )}
              {okCount > 0 && foutCount === 0 && gedaan === total && (
                <> · <span className="text-success font-medium">alles ok</span></>
              )}
            </span>
          </div>
          <Button size="sm" variant={state.klaar ? 'default' : 'outline'} onClick={handleClose}>
            <X className="w-3.5 h-3.5 mr-2" />
            {state.klaar ? 'Sluiten' : 'Stop backfill'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
