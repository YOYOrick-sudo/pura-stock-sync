import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays, format } from 'date-fns';

interface NextActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (nextActionType: string, nextActionAt: string, notes?: string) => void;
  suggestedDays?: number;
  actionLabel?: string;
}

const ACTION_TYPES = [
  { value: 'call', label: 'Bellen' },
  { value: 'whatsapp', label: 'WhatsApp sturen' },
  { value: 'email', label: 'E-mail sturen' },
  { value: 'interview', label: 'Interview houden' },
  { value: 'trial', label: 'Proefdienst' },
  { value: 'follow_up', label: 'Opvolgen' },
  { value: 'decision', label: 'Beslissing nemen' },
];

export function NextActionModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  suggestedDays = 3,
  actionLabel,
}: NextActionModalProps) {
  const [nextActionType, setNextActionType] = useState('follow_up');
  const [nextActionDate, setNextActionDate] = useState('');
  const [nextActionTime, setNextActionTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      const suggestedDate = addDays(new Date(), suggestedDays);
      setNextActionDate(format(suggestedDate, 'yyyy-MM-dd'));
      setNotes('');
    }
  }, [open, suggestedDays]);

  const handleConfirm = () => {
    const dateTime = new Date(`${nextActionDate}T${nextActionTime}`);
    onConfirm(
      ACTION_TYPES.find(t => t.value === nextActionType)?.label || nextActionType,
      dateTime.toISOString(),
      notes || undefined
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Volgende Actie Plannen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type actie</Label>
            <Select value={nextActionType} onValueChange={setNextActionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tijd</Label>
              <Input
                type="time"
                value={nextActionTime}
                onChange={(e) => setNextActionTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notities (optioneel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Voeg eventuele notities toe..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleConfirm} disabled={!nextActionDate}>
            Bevestigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
