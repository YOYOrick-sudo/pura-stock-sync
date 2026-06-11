import { memo, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  password?: string;
}

function AdminPasswordDialogBase({ open, onOpenChange, onSuccess, password = '0000' }: AdminPasswordDialogProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset bij sluiten
  useEffect(() => {
    if (!open) setValue('');
  }, [open]);

  const submit = () => {
    if (value === password) {
      onOpenChange(false);
      setValue('');
      onSuccess();
      toast.success('Admin panel geopend');
    } else {
      toast.error('Onjuist wachtwoord');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: 'hsl(var(--foreground))' }}>
            Admin Toegang
          </DialogTitle>
        </DialogHeader>
        <div style={{ padding: '16px 0' }}>
          <Input
            ref={inputRef}
            autoFocus
            type="password"
            placeholder="Voer wachtwoord in"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              borderRadius: '16px',
              fontFamily: 'Inter, sans-serif',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setValue('');
            }}
            style={{
              borderRadius: '20px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Annuleren
          </Button>
          <Button
            onClick={submit}
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: '20px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Bevestigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const AdminPasswordDialog = memo(AdminPasswordDialogBase);
