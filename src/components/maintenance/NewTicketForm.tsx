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
  { value: 'laag', label: 'Laag', color: '#FFFFFF', bg: '#22C55E' },
];

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
        <button
          onClick={onBack}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            border: '1px solid rgba(197, 197, 202, 0.3)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          className="hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: '#282E3A' }} />
        </button>
        <h1 style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#282E3A',
        }}>
          Nieuwe melding
        </h1>
      </div>

      {/* Form */}
      <div className="space-y-6" style={{ maxWidth: '600px' }}>
        {/* Titel */}
        <div className="space-y-2">
          <label style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#282E3A',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Wat is er aan de hand? *
          </label>
          <Input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="bijv. Lekkage spoelbak, deur klemt, lamp kapot"
            autoFocus
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid rgba(197, 197, 202, 0.5)',
              padding: '14px 16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              height: '52px',
            }}
          />
        </div>

        {/* Prioriteit */}
        <div className="space-y-2">
          <label style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#282E3A',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Hoe urgent? *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {prioriteitOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPrioriteit(opt.value)}
                style={{
                  height: '64px',
                  borderRadius: '16px',
                  border: prioriteit === opt.value
                    ? `3px solid ${opt.bg}`
                    : '2px solid rgba(197, 197, 202, 0.3)',
                  backgroundColor: prioriteit === opt.value ? opt.bg : '#FFFFFF',
                  color: prioriteit === opt.value ? opt.color : opt.bg,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="active:scale-95"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toelichting (optioneel) */}
        <div className="space-y-2">
          <label style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            color: '#282E3A',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Toelichting <span style={{ fontWeight: 400, color: '#94A3B8', textTransform: 'none' }}>(optioneel)</span>
          </label>
          <Textarea
            value={toelichting}
            onChange={(e) => setToelichting(e.target.value)}
            placeholder="Extra details die je kwijt wilt..."
            rows={3}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid rgba(197, 197, 202, 0.5)',
              padding: '14px 16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              resize: 'none',
            }}
          />
        </div>

        {/* Auto-filled info */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: '#F1F5F9',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: '#73747B',
        }}>
          Vestiging: <strong style={{ color: '#282E3A', textTransform: 'capitalize' }}>{user.vestiging}</strong> &middot; Melder: <strong style={{ color: '#282E3A' }}>{user.naam}</strong>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || createTicket.isPending}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: canSubmit ? '#1B7867' : '#94A3B8',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease',
          }}
          className={canSubmit ? 'hover:opacity-90 active:scale-[0.98]' : ''}
        >
          {createTicket.isPending ? 'Versturen...' : 'Verstuur melding'}
        </Button>
      </div>
    </div>
  );
}
