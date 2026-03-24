import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
  hoog: { color: '#EF4444', bg: '#FEF2F2', label: 'Hoog' },
  midden: { color: '#F59E0B', bg: '#FFFBEB', label: 'Midden' },
  laag: { color: '#22C55E', bg: '#F0FDF4', label: 'Laag' },
};

const statusConfig = {
  nieuw: { color: '#EF4444', bg: '#FEF2F2', label: 'Nieuw', icon: AlertTriangle },
  in_behandeling: { color: '#F59E0B', bg: '#FFFBEB', label: 'In behandeling', icon: Clock },
  afgehandeld: { color: '#22C55E', bg: '#F0FDF4', label: 'Afgehandeld', icon: CheckCircle2 },
};

const statusFlow: TicketStatus[] = ['nieuw', 'in_behandeling', 'afgehandeld'];

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
          <button onClick={onBack} style={{
            width: '44px', height: '44px', borderRadius: '12px',
            border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <ArrowLeft className="h-5 w-5" style={{ color: '#282E3A' }} />
          </button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
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
        <button
          onClick={onBack}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          className="hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: '#282E3A' }} />
        </button>
        <h1 style={{
          fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 600, color: '#282E3A',
        }}>
          Melding detail
        </h1>
      </div>

      {/* Ticket info card */}
      <Card style={{
        padding: '24px', borderRadius: '16px',
        border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
      }}>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '8px',
            backgroundColor: prio.bg, color: prio.color,
            fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {prio.label}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '8px',
            backgroundColor: status.bg, color: status.color,
            fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600,
          }}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: 600,
          color: '#282E3A', marginBottom: '8px',
        }}>
          {ticket.titel}
        </h2>

        {/* Toelichting */}
        {ticket.toelichting && (
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#64748B',
            marginBottom: '16px', lineHeight: '1.6',
          }}>
            {ticket.toelichting}
          </p>
        )}

        {/* Meta */}
        <div style={{
          padding: '12px 16px', borderRadius: '12px', backgroundColor: '#F8FAFC',
          fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#73747B',
        }}>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>Melder: <strong style={{ color: '#282E3A' }}>{ticket.melder?.naam ?? 'Onbekend'}</strong></span>
            <span>Vestiging: <strong style={{ color: '#282E3A', textTransform: 'capitalize' }}>{ticket.vestiging}</strong></span>
            <span>Aangemaakt: <strong style={{ color: '#282E3A' }}>
              {format(new Date(ticket.aangemaakt_op), 'd MMM yyyy, HH:mm', { locale: nl })}
            </strong></span>
          </div>
        </div>
      </Card>

      {/* Status wijzigen (alleen eigenaar) */}
      {isEigenaar && ticket.status !== 'afgehandeld' && (
        <Card style={{
          padding: '20px 24px', borderRadius: '16px',
          border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
        }}>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
            color: '#282E3A', textTransform: 'uppercase', letterSpacing: '0.5px',
            marginBottom: '12px',
          }}>
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
                  style={{
                    flex: 1,
                    height: '52px',
                    borderRadius: '12px',
                    border: isActive ? `2px solid ${cfg.color}` : '1px solid rgba(197, 197, 202, 0.3)',
                    backgroundColor: isActive ? cfg.bg : '#FFFFFF',
                    color: isActive ? cfg.color : '#73747B',
                    fontFamily: 'Inter, sans-serif',
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
                  className={!isActive ? 'hover:opacity-100' : ''}
                >
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Notities / comments */}
      <Card style={{
        padding: '20px 24px', borderRadius: '16px',
        border: '1px solid rgba(197, 197, 202, 0.3)', backgroundColor: '#FFFFFF',
      }}>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600,
          color: '#282E3A', textTransform: 'uppercase', letterSpacing: '0.5px',
          marginBottom: '16px',
        }}>
          Notities
        </p>

        {/* Existing comments */}
        {comments && comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {comments.map(comment => (
              <div key={comment.id} style={{
                padding: '12px 16px', borderRadius: '12px', backgroundColor: '#F8FAFC',
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#282E3A',
                  }}>
                    {comment.auteur?.naam ?? 'Onbekend'}
                  </span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#94A3B8',
                  }}>
                    {format(new Date(comment.aangemaakt_op), 'd MMM, HH:mm', { locale: nl })}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#64748B', lineHeight: '1.5',
                }}>
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
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid rgba(197, 197, 202, 0.5)',
              padding: '12px 16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              resize: 'none',
            }}
          />
          <Button
            onClick={handleComment}
            disabled={!commentText.trim() || createComment.isPending}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: commentText.trim() ? '#1B7867' : '#E2E8F0',
              border: 'none',
              alignSelf: 'flex-end',
            }}
          >
            <Send className="h-5 w-5" style={{ color: '#FFFFFF' }} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
