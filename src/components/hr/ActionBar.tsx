import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Calendar, 
  CalendarCheck, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { ApplicationStatus, ACTION_CONFIGS, FINAL_STATUSES } from '@/types/hr';
import { useUpdateApplicationStatus } from '@/hooks/hr/useApplications';
import { NextActionModal } from './NextActionModal';

interface ActionBarProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  CalendarCheck,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
};

export function ActionBar({ applicationId, currentStatus }: ActionBarProps) {
  const [showNextActionModal, setShowNextActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    actionType: string;
    statusChange?: ApplicationStatus;
    suggestedDays?: number;
  } | null>(null);

  const updateStatus = useUpdateApplicationStatus();

  const handleAction = (config: typeof ACTION_CONFIGS[0]) => {
    if (config.isFinal) {
      // Final actions don't need next action
      updateStatus.mutate({
        id: applicationId,
        status: config.statusChange,
        actionType: config.type,
      });
    } else {
      // Show modal for next action
      setPendingAction({
        actionType: config.type,
        statusChange: config.statusChange,
        suggestedDays: config.nextActionDays,
      });
      setShowNextActionModal(true);
    }
  };

  const handleConfirmAction = (nextActionType: string, nextActionAt: string, notes?: string) => {
    if (!pendingAction) return;

    updateStatus.mutate({
      id: applicationId,
      status: pendingAction.statusChange,
      actionType: pendingAction.actionType,
      notes,
      nextActionType,
      nextActionAt,
    });

    setShowNextActionModal(false);
    setPendingAction(null);
  };

  // Don't show action bar for final statuses
  if (FINAL_STATUSES.includes(currentStatus)) {
    return (
      <Card className="p-4 bg-muted/50">
        <p className="text-center text-muted-foreground">
          Deze sollicitatie is afgerond (status: {currentStatus})
        </p>
      </Card>
    );
  }

  // Split actions into contact actions and status actions
  const contactActions = ACTION_CONFIGS.filter(c => ['call', 'whatsapp', 'email'].includes(c.type));
  const statusActions = ACTION_CONFIGS.filter(c => !['call', 'whatsapp', 'email'].includes(c.type));

  return (
    <>
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Acties</h3>
        
        {/* Contact Actions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {contactActions.map((config) => {
            const Icon = iconMap[config.icon];
            return (
              <Button
                key={config.type}
                variant="outline"
                size="sm"
                onClick={() => handleAction(config)}
                disabled={updateStatus.isPending}
              >
                <Icon className="h-4 w-4 mr-2" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap gap-2">
          {statusActions.map((config) => {
            const Icon = iconMap[config.icon];
            const variant = config.isFinal 
              ? config.type === 'hired' ? 'default' : 'destructive'
              : 'secondary';
            
            return (
              <Button
                key={config.type}
                variant={variant as 'default' | 'destructive' | 'secondary'}
                size="sm"
                onClick={() => handleAction(config)}
                disabled={updateStatus.isPending}
              >
                <Icon className="h-4 w-4 mr-2" />
                {config.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <NextActionModal
        open={showNextActionModal}
        onOpenChange={setShowNextActionModal}
        onConfirm={handleConfirmAction}
        suggestedDays={pendingAction?.suggestedDays}
        actionLabel={pendingAction?.actionType}
      />
    </>
  );
}
