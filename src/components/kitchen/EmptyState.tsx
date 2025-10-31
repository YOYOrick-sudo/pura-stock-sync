import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-12 border-dashed border-2 border-muted text-center">
      <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
      <h3 className="text-lg font-semibold text-foreground/80 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-primary hover:bg-primary-hover">
          {action.label}
        </Button>
      )}
    </Card>
  );
}
