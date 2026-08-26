import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  realtimeOk: boolean;
  wachtrij: { id: number; label: string }[];
  onOpnieuw: () => void;
}

/** Laat zien dat er iets niet is opgeslagen — een vinkje mag nooit stilletijds verdwijnen. */
export function MepVerbindingBanner({ realtimeOk, wachtrij, onOpnieuw }: Props) {
  if (realtimeOk && wachtrij.length === 0) return null;

  const mislukt = wachtrij.length > 0;

  return (
    <div className="rounded-polar-lg border border-warning/30 bg-warning/10 p-3 flex items-start gap-3">
      <WifiOff className="h-5 w-5 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {mislukt ? `${wachtrij.length} actie${wachtrij.length > 1 ? 's' : ''} niet opgeslagen` : 'Geen verbinding'}
        </p>
        <p className="text-xs text-muted-foreground">
          {mislukt
            ? wachtrij.map((w) => w.label).join(' · ')
            : 'Wijzigingen van andere tablets komen nu niet binnen.'}
        </p>
      </div>
      {mislukt && (
        <Button size="sm" variant="outline" className="h-9" onClick={onOpnieuw}>
          <RefreshCw className="h-4 w-4 mr-2" /> Opnieuw
        </Button>
      )}
    </div>
  );
}
