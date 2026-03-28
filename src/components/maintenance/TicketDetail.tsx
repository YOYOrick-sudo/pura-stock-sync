import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMaintenanceTicket, useUpdateTicketStatus } from '@/hooks/maintenance/useMaintenanceTickets';
import { useTicketComments, useCreateComment } from '@/hooks/maintenance/useTicketComments';
import type { MaintenanceUser, TicketStatus } from '@/types/maintenance';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketDetailProps {
  ticketId: string;
  user: MaintenanceUser;
  onBack: () => void;
}

const prioriteitConfig = {
  hoog: { color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.1)', label: 'Hoog' },
  midden: { color: 'hsl(var(--warning))', bg: 'hsl(45 100% 95%)', label: 'Midden' },
  laag: { color: 'hsl(var(--primary))', bg: 'hsl(160 40% 95%)', label: 'Laag' },
};

const statusConfig = {
  nieuw: { color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.1)', label: 'Nieuw', icon: AlertTriangle },
  in_behandeling: { color: 'hsl(var(--warning))', bg: 'hsl(45 100% 95%)', label: 'In behandeling', icon: Clock },
  afgehandeld: { color: 'hsl(var(--primary))', bg: 'hsl(160 40% 95%)', label: 'Afgehandeld', icon: CheckCircle2 },
};

const statusFlow: TicketStatus[] = ['nieuw', 'in_behandeling', 'afgehandeld'];

const cardStyle: React.CSSProperties = {
  borderRadius: '20px',
  border: '1px solid hsl(var(--border))',
  backgroundColor: 'hsl(var(--card))',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
};

const backButtonStyle: React.CSSProperties = {
  width: '44px', height: '44px', borderRadius: '14px',
  border: '1.5px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  transition: 'all 150ms ease',
};

export function TicketDetail({ ticketId, user, onBack }: TicketDetailProps) {
  const { data: ticket, isLoading } = useMaintenanceTicket(ticketId);
  const { data: comments } = useTicketComments(ticketId);
  const updateStatus = useUpdateTicketStatus();
  const createComment = useCreateComment();
  const [commentText, setCommentText] = useState('');

  const isEigenaar = user.rol === 'eigenaar';

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} style={backButtonStyle} className="hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-[20px]" />
      </div>
    );
  }

  const prio = prioriteitConfig[ticket.prioriteit];
  const status = statusConfig[ticket.status];
  const StatusIcon = status.icon;

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await updateStatus.mutateAsync({ id: ticket.id, status: newStatus });
      toast.success(`Status gewijzigd naar "${statusConfig[newStatus].label}"`);
    } catch {
      toast.error('Kon status niet wijzigen');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createComment.mutateAsync({
        ticket_id: ticket.id,
        auteur_id: user.id,
        tekst: commentText.trim(),
      });
      setCommentText('');
      toast.success('Notitie toegevoegd');
    } catch {
      toast.error('Kon notitie niet toevoegen');
    }
  };

  return (
    <div className="space-y-6" style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} style={backButtonStyle} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-semibold text-foreground">
          Melding detail
        </h1>
      </div>

      {/* Ticket info card */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '8px',
            backgroundColor: prio.bg, color: prio.color,
            fontSize: '12px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {prio.label}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '8px',
            backgroundColor: status.bg, color: status.color,
            fontSize: '12px', fontWeight: 600,
          }}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {ticket.titel}
        </h2>

        {ticket.toelichting && (
          <p className="text-[15px] text-muted-foreground mb-4 leading-relaxed">
            {ticket.toelichting}
          </p>
        )}

        {/* Meta */}
        <div className="rounded-[14px] bg-muted p-3 px-4 text-[13px] text-muted-foreground">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>Melder: <strong className="text-foreground">{ticket.melder?.naam ?? 'Onbekend'}</strong></span>
            <span>Vestiging: <strong className="text-foreground capitalize">{ticket.vestiging}</strong></span>
            <span>Aangemaakt: <strong className="text-foreground">
              {format(new Date(ticket.aangemaakt_op), 'd MMM yyyy, HH:mm', { locale: nl })}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Status wijzigen (alleen eigenaar) */}
      {isEigenaar && ticket.status !== 'afgehandeld' && (
        <div style={{ ...cardStyle, padding: '20px 24px' }}>
          <p className="text-[13px] font-semibold text-foreground uppercase tracking-wide mb-3">
            Status wijzigen
          </p>
          <div className="flex gap-3">
            {statusFlow.map(s => {
              const cfg = statusConfig[s];
              const isActive = ticket.status === s;
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  onClick={() => !isActive && handleStatusChange(s)}
                  disabled={isActive || updateStatus.isPending}
                  className={!isActive ? 'hover:opacity-100' : ''}
                  style={{
                    flex: 1,
                    height: '52px',
                    borderRadius: '14px',
                    border: isActive ? `2px solid ${cfg.color}` : '1.5px solid hsl(var(--border))',
                    backgroundColor: isActive ? cfg.bg : 'hsl(var(--card))',
                    color: isActive ? cfg.color : 'hsl(var(--muted-foreground))',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isActive ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 200ms ease',
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notities / comments */}
      <div style={{ ...cardStyle, padding: '20px 24px' }}>
        <p className="text-[13px] font-semibold text-foreground uppercase tracking-wide mb-4">
          Notities
        </p>

        {comments && comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {comments.map(comment => (
              <div key={comment.id} className="rounded-[14px] bg-muted p-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-foreground">
                    {comment.auteur?.naam ?? 'Onbekend'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.aangemaakt_op), 'd MMM, HH:mm', { locale: nl })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {comment.tekst}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* New comment input */}
        <div className="flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Voeg een notitie toe..."
            rows={2}
            className="flex-1 rounded-[14px] border-1.5 resize-none text-sm"
          />
          <Button
            onClick={handleComment}
            disabled={!commentText.trim() || createComment.isPending}
            className="rounded-[14px] self-end"
            style={{
              width: '52px',
              height: '52px',
              backgroundColor: commentText.trim() ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              border: 'none',
            }}
          >
            <Send className="h-5 w-5" style={{ color: 'hsl(var(--primary-foreground))' }} />
          </Button>
        </div>
      </div>
    </div>
  );
}
