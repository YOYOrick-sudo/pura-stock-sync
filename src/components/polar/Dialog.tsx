import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface PolarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function PolarDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = '480px',
}: PolarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-card rounded-[20px] border border-border p-8 shadow-lg"
        style={{ maxWidth }}
      >
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle
                className={cn(
                  'text-lg font-semibold text-foreground',
                  description ? 'mb-2' : 'mb-6',
                )}
              >
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-sm font-normal text-muted-foreground mb-6">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Helper styles for consistent form fields within dialogs
export const polarDialogInputStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--background))',
  borderRadius: '16px',
  border: '1px solid hsl(var(--border))',
  padding: '12px 16px',
  fontSize: '14px',
  color: 'hsl(var(--foreground))',
  width: '100%',
};

export const polarDialogLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'hsl(var(--foreground))',
  marginBottom: '8px',
  display: 'block',
};

export const polarDialogButtonPrimaryStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--primary))',
  color: 'hsl(var(--primary-foreground))',
  borderRadius: '20px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export const polarDialogButtonSecondaryStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'hsl(var(--foreground))',
  borderRadius: '20px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid hsl(var(--border))',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
