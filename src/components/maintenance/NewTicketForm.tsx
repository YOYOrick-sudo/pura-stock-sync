import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTicket } from '@/hooks/maintenance/useMaintenanceTickets';
import type { MaintenanceUser, Prioriteit } from '@/types/maintenance';
import { toast } from 'sonner';

interface NewTicketFormProps {
  user: MaintenanceUser;
  onBack: () => void;
  onSuccess: () => void;
}

const prioriteitOptions: { value: Prioriteit; label: string; color: string; bg: string }[] = [
  { value: 'hoog', label: 'Hoog', color: '#FFFFFF', bg: '#EF4444' },
  { value: 'midden', label: 'Midden', color: '#FFFFFF', bg: '#F59E0B' },
  { value: 'laag', label: 'Laag', color: '#FFFFFF', bg: '#2D8E6F' },
];

const backButtonStyle: React.CSSProperties = {
  width: '44px', height: '44px', borderRadius: '14px',
  border: '1.5px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  transition: 'all 150ms ease',
};

export function NewTicketForm({ user, onBack, onSuccess }: NewTicketFormProps) {
  const [titel, setTitel] = useState('');
  const [prioriteit, setPrioriteit] = useState<Prioriteit | null>(null);
  const [toelichting, setToelichting] = useState('');
  const createTicket = useCreateTicket();

  const canSubmit = titel.trim().length > 0 && prioriteit !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !prioriteit) return;

    try {
      await createTicket.mutateAsync({
        vestiging: user.vestiging,
        titel: titel.trim(),
        toelichting: toelichting.trim() || undefined,
        prioriteit,
        melder_id: user.id,
      });
      toast.success('Melding verstuurd!');
      onSuccess();
    } catch {
      toast.error('Er ging iets mis. Probeer opnieuw.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={backButtonStyle} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-semibold text-foreground">
          Nieuwe melding
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-6" style={{ maxWidth: '600px' }}>
        {/* Titel */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Wat is er aan de hand? *
          </label>
          <Input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="bijv. Lekkage spoelbak, deur klemt, lamp kapot"
            autoFocus
            className="rounded-[14px] border-1.5 text-base h-[52px] px-4"
          />
        </div>

        {/* Prioriteit */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Hoe urgent? *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {prioriteitOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPrioriteit(opt.value)}
                className="active:scale-95"
                style={{
                  height: '64px',
                  borderRadius: '20px',
                  border: prioriteit === opt.value
                    ? `3px solid ${opt.bg}`
                    : '1.5px solid hsl(var(--border))',
                  backgroundColor: prioriteit === opt.value ? opt.bg : 'hsl(var(--card))',
                  color: prioriteit === opt.value ? opt.color : opt.bg,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toelichting */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wide">
            Toelichting <span className="font-normal text-muted-foreground normal-case">(optioneel)</span>
          </label>
          <Textarea
            value={toelichting}
            onChange={(e) => setToelichting(e.target.value)}
            placeholder="Extra details die je kwijt wilt..."
            rows={3}
            className="rounded-[14px] border-1.5 text-base resize-none p-4"
          />
        </div>

        {/* Auto-filled info */}
        <div className="rounded-[14px] bg-muted p-3 px-4 text-[13px] text-muted-foreground">
          Vestiging: <strong className="text-foreground capitalize">{user.vestiging}</strong> &middot; Melder: <strong className="text-foreground">{user.naam}</strong>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || createTicket.isPending}
          className={`w-full h-14 rounded-[20px] text-base font-semibold ${canSubmit ? 'hover:opacity-90 active:scale-[0.98]' : ''}`}
          style={{
            backgroundColor: canSubmit ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            color: 'hsl(var(--primary-foreground))',
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease',
          }}
        >
          {createTicket.isPending ? 'Versturen...' : 'Verstuur melding'}
        </Button>
      </div>
    </div>
  );
}
