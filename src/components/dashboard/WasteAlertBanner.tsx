import { useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWastePickups, type WastePickup } from '@/hooks/useWastePickups';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { supabase } from '@/integrations/supabase/client';
import { WasteAcknowledgeDialog } from './WasteAcknowledgeDialog';
import { toast } from 'sonner';

const SOURCE = { tst: 'TST (grote)', gemeente: 'Gemeente' } as const;
const FRACTION = { restafval: 'Restafval', gft: 'GFT', papier: 'Papier', glas: 'Glas', klein_tuinafval: 'Klein tuinafval' } as const;

function nlDate(offset = 0) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date(Date.now() + offset * 86400000));
}
function nlHour() {
  return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false }).format(new Date()), 10);
}

export function WasteAlertBanner() {
  const { userLocation } = useUserLocation();
  const { data: pickups } = useWastePickups(userLocation);
  const [dialogId, setDialogId] = useState<string | null>(null);

  const alerts = useMemo<WastePickup[]>(() => {
    if (!pickups) return [];
    const today = nlDate(0);
    const tomorrow = nlDate(1);
    const hour = nlHour();
    return pickups.filter((p) => {
      if (p.acknowledged_at) return false;
      if (!p.sluit_task_id) return false;
      if (p.sluit_completed) return false;
      // Sluit voor morgen niet af na 22:00
      if (p.pickup_date === tomorrow && hour >= 22) return true;
      // Of: gisteren/vandaag pickup met openstaande sluit-taak (vergeten)
      if (p.pickup_date <= today) return true;
      return false;
    });
  }, [pickups]);

  if (userLocation !== 'Midsland' || alerts.length === 0) return null;

  const markDone = async (taskId: string | null) => {
    if (!taskId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('foh_tasks')
      .update({ completed: true, completed_at: new Date().toISOString(), completed_by: user?.id ?? null })
      .eq('id', taskId);
    if (error) toast.error('Kon niet opslaan');
    else toast.success('Container gemarkeerd als gedaan');
  };

  return (
    <>
      <div className="space-y-2">
        {alerts.map((p) => (
          <div
            key={p.id}
            className="flex items-start gap-3 p-4 border-l-4 border-destructive bg-destructive/10 rounded-[14px]"
          >
            <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">
                Container niet aan de weg gezet
              </p>
              <p className="text-sm text-muted-foreground">
                {SOURCE[p.source]} {FRACTION[p.fraction]} — ophaal {p.pickup_date}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => markDone(p.sluit_task_id)}>
                <Check size={14} className="mr-1" /> Alsnog gedaan
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDialogId(p.id)}>
                Niet meer nodig
              </Button>
            </div>
          </div>
        ))}
      </div>
      <WasteAcknowledgeDialog
        pickupId={dialogId}
        open={!!dialogId}
        onOpenChange={(o) => !o && setDialogId(null)}
        onDone={() => {}}
      />
    </>
  );
}
