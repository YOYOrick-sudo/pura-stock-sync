import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  pickupId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function WasteAcknowledgeDialog({ pickupId, open, onOpenChange, onDone }: Props) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!pickupId || reason.trim().length < 3) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('waste_pickups')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.id ?? null,
        acknowledged_reason: reason.trim(),
      })
      .eq('id', pickupId);
    setSaving(false);
    if (error) {
      toast.error('Kon niet opslaan');
      return;
    }
    setReason('');
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Melding wegklikken</DialogTitle>
          <DialogDescription>
            Geef een korte reden waarom de container niet aan de weg is gezet. Dit wordt gelogd voor audit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="reason">Reden</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="bv. container was nog leeg, vergeten maar niet meer nodig…"
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={saving || reason.trim().length < 3}>
            Opslaan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
