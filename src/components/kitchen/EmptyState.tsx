import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-8" style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div style={{
          width: '52px', height: '52px', borderRadius: '20px',
          backgroundColor: '#F1F3F5', border: '1px solid #EAECF0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
        }}>
          <Icon style={{ width: '22px', height: '22px', color: '#8D93A0' }} />
        </div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#303542', marginBottom: '4px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#636878', marginBottom: action ? '20px' : '0', maxWidth: '300px' }}>{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
