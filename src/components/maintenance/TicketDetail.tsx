import { useState } from 'react';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle2, Send, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMaintenanceTicket, useUpdateTicketStatus } from '@/hooks/maintenance/useMaintenanceTickets';
import { useTicketComments, useCreateComment } from '@/hooks/maintenance/useTicketComments';
import { useSignedPhotoUrl } from '@/hooks/maintenance/useMaintenancePhoto';
import { useIsMaintenanceAdmin } from '@/hooks/maintenance/useIsMaintenanceAdmin';
import type { MaintenanceActor, TicketStatus } from '@/types/maintenance';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { StatusBadge, toneColor, type StatusTone } from '@/components/pura';

interface TicketDetailProps {
  ticketId: string;
  actor: MaintenanceActor;
  onBack: () => void;
}

const prioriteitConfig: Record<
  'hoog' | 'midden' | 'laag',
  { tone: StatusTone; label: string }
> = {
  hoog: { tone: 'danger', label: 'Hoog' },
  midden: { tone: 'warning', label: 'Midden' },
  laag: { tone: 'success', label: 'Laag' },
};

const statusConfig: Record<
  TicketStatus,
  { tone: StatusTone; label: string; icon: typeof AlertTriangle }
> = {
  nieuw: { tone: 'danger', label: 'Nieuw', icon: AlertTriangle },
  in_behandeling: { tone: 'warning', label: 'In behandeling', icon: Clock },
  afgehandeld: { tone: 'success', label: 'Afgehandeld', icon: CheckCircle2 },
};

const statusFlow: TicketStatus[] = ['nieuw', 'in_behandeling', 'afgehandeld'];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
      {children}
    </p>
  );
}

export function TicketDetail({ ticketId, actor, onBack }: TicketDetailProps) {
  const { data: ticket, isLoading } = useMaintenanceTicket(ticketId);
  const { data: comments } = useTicketComments(ticketId);
  const { data: isAdmin = false } = useIsMaintenanceAdmin();
  const updateStatus = useUpdateTicketStatus();
  const createComment = useCreateComment();
  const [commentText, setCommentText] = useState('');
  const photoUrl = useSignedPhotoUrl(ticket?.foto_url);

  if (isLoading || !ticket) {
    return (
      <div className="space-y-6 max-w-[700px]">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
          <ArrowLeft className="h-4 w-4" />
          Terug
        </Button>
        <Skeleton className="h-40 w-full rounded-polar-xl" />
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
        auteur_user_id: actor.id,
        auteur_naam: actor.naam,
        tekst: commentText.trim(),
      });
      setCommentText('');
      toast.success('Notitie toegevoegd');
    } catch {
      toast.error('Kon notitie niet toevoegen');
    }
  };

  return (
    <div className="space-y-6 max-w-[700px]">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3">
        <ArrowLeft className="h-4 w-4" />
        Terug
      </Button>

      {/* Ticket info card */}
      <div className="bg-card border border-border rounded-polar-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <StatusBadge tone={prio.tone} shape="label">{prio.label}</StatusBadge>
          <StatusBadge tone={status.tone} shape="label" icon={<StatusIcon />}>
            {status.label}
          </StatusBadge>
          {ticket.plek && (
            <StatusBadge tone="neutral" shape="label" icon={<MapPin />}>
              {ticket.plek}
            </StatusBadge>
          )}
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {ticket.titel}
        </h2>

        {ticket.toelichting && (
          <p className="text-[15px] text-muted-foreground mb-4 leading-relaxed">
            {ticket.toelichting}
          </p>
        )}

        {ticket.foto_url && (
          <div className="mb-4 overflow-hidden rounded-polar-md bg-muted">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Foto bij melding"
                className="w-full max-h-[480px] object-cover block"
              />
            ) : (
              <div className="h-[200px]" />
            )}
          </div>
        )}

        <div className="rounded-polar-md bg-muted px-4 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>Melder: <strong className="text-foreground">{ticket.melder_naam ?? ticket.melder?.naam ?? 'Onbekend'}</strong></span>
            <span>Vestiging: <strong className="text-foreground capitalize">{ticket.vestiging}</strong></span>
            <span>Aangemaakt: <strong className="text-foreground">
              {format(new Date(ticket.aangemaakt_op), 'd MMM yyyy, HH:mm', { locale: nl })}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Status wijzigen (alleen owner/admin) */}
      {isAdmin && ticket.status !== 'afgehandeld' && (
        <div className="bg-card border border-border rounded-polar-xl shadow-card p-6">
          <SectionLabel>Status wijzigen</SectionLabel>
          <div className="flex gap-3">
            {statusFlow.map((s) => {
              const cfg = statusConfig[s];
              const isActive = ticket.status === s;
              const Icon = cfg.icon;
              const color = toneColor(cfg.tone);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !isActive && handleStatusChange(s)}
                  disabled={isActive || updateStatus.isPending}
                  className={cn(
                    'flex-1 min-h-[52px] rounded-polar-md text-sm font-semibold',
                    'flex items-center justify-center gap-2 border transition-all duration-200',
                    isActive
                      ? 'border-transparent cursor-default'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                  )}
                  style={
                    isActive
                      ? { backgroundColor: `${color}1a`, color, borderColor: color }
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notities */}
      <div className="bg-card border border-border rounded-polar-xl shadow-card p-6">
        <SectionLabel>Notities</SectionLabel>

        {comments && comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-polar-md bg-muted px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-foreground">
                    {comment.auteur_naam ?? comment.auteur?.naam ?? 'Onbekend'}
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

        {isAdmin ? (
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Voeg een notitie toe..."
              rows={2}
              className="flex-1 rounded-polar-md resize-none text-sm"
            />
            <Button
              onClick={handleComment}
              disabled={!commentText.trim() || createComment.isPending}
              size="icon"
              aria-label="Notitie plaatsen"
              className="self-end"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : (!comments || comments.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nog geen notities.</p>
        ) : null}
      </div>
    </div>
  );
}
