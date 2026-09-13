import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { devError } from '@/lib/devLog';
import { withTimeout, getUserIdMetTimeout } from '@/lib/withTimeout';

type Beoordeling = 'rustig' | 'gemiddeld' | 'druk';

const MOMENTEN: { key: 'ontbijt' | 'lunch' | 'diner'; label: string }[] = [
  { key: 'ontbijt', label: 'Ontbijt' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'diner', label: 'Diner' },
];

const OPTIES: { value: Beoordeling; label: string; activeClass: string }[] = [
  { value: 'rustig', label: 'Rustig', activeClass: 'bg-success/15 border-success text-success' },
  { value: 'gemiddeld', label: 'Gemiddeld', activeClass: 'bg-warning/15 border-warning text-warning' },
  { value: 'druk', label: 'Druk', activeClass: 'bg-destructive/15 border-destructive text-destructive' },
];

interface Props {
  open: boolean;
  location: string;
  date: string; // YYYY-MM-DD
  onClose: () => void;
}

export const DagBeoordelingDialog = ({ open, location, date, onClose }: Props) => {
  const [keuzes, setKeuzes] = useState<Record<string, Beoordeling | undefined>>({});
  const [isSaving, setIsSaving] = useState(false);

  const kies = (moment: string, waarde: Beoordeling) => {
    setKeuzes((prev) => ({ ...prev, [moment]: prev[moment] === waarde ? undefined : waarde }));
  };

  const opslaan = async () => {
    if (isSaving) return;
    if (!keuzes.ontbijt && !keuzes.lunch && !keuzes.diner) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      const userId = await getUserIdMetTimeout(supabase);
      const { error } = await withTimeout(
        supabase.from('dag_beleving').upsert(
          {
            date,
            location,
            ontbijt: keuzes.ontbijt ?? null,
            lunch: keuzes.lunch ?? null,
            diner: keuzes.diner ?? null,
            created_by: userId,
          },
          { onConflict: 'date,location' }
        )
      );
      if (error) throw error;
      toast.success('Dagbeoordeling opgeslagen');
      onClose();
    } catch (e: any) {
      devError('Dagbeoordeling opslaan mislukt:', e);
      toast.error('Beoordeling opslaan mislukt — je kassatelling is wel verzonden');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isSaving) onClose(); }}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Hoe was de dag?
          </DialogTitle>
          <DialogDescription className="text-foreground/70">
            Vink per moment aan hoe druk het was. Zo kijken we later makkelijk terug.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {MOMENTEN.map((m) => (
            <div key={m.key} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-sm font-medium text-foreground">{m.label}</div>
              <div className="flex flex-1 gap-2">
                {OPTIES.map((o) => {
                  const actief = keuzes[m.key] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => kies(m.key, o.value)}
                      className={`flex-1 min-h-[44px] rounded-[14px] border text-sm font-medium transition-colors ${
                        actief
                          ? o.activeClass
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 min-h-[44px]"
            onClick={onClose}
            disabled={isSaving}
          >
            Overslaan
          </Button>
          <Button
            className="flex-1 min-h-[44px]"
            onClick={opslaan}
            disabled={isSaving}
          >
            {isSaving ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
