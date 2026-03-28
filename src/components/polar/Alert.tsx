import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PolarAlertProps {
  variant?: 'warning' | 'error' | 'success' | 'info';
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

const variantClasses = {
  warning: {
    container: 'bg-warning-bg border-warning-border',
    icon: 'text-warning',
  },
  error: {
    container: 'bg-destructive-bg border-destructive-border',
    icon: 'text-destructive',
  },
  success: {
    container: 'bg-success-bg border-success-border',
    icon: 'text-success',
  },
  info: {
    container: 'bg-info-bg border-info-border',
    icon: 'text-info',
  },
} as const;

export function PolarAlert({
  variant = 'info',
  children,
  action,
  onDismiss,
}: PolarAlertProps) {
  const classes = variantClasses[variant];

  const icons = {
    warning: <AlertCircle size={20} />,
    error: <XCircle size={20} />,
    success: <CheckCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border rounded-lg',
        classes.container,
      )}
    >
      <div className={cn('flex shrink-0', classes.icon)}>
        {icons[variant]}
      </div>
      <div className="flex-1 text-[15px] font-normal text-foreground leading-[22px]">
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
