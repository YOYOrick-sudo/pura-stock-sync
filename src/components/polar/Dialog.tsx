import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  maxWidth = '480px' 
}: PolarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-card border border-border rounded-[20px] p-8 shadow-lg"
        style={{ maxWidth }}
      >
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className="text-lg font-semibold text-foreground mb-2">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-sm text-muted-foreground mb-6">
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

export const polarDialogInputStyle: React.CSSProperties = {
  borderRadius: '16px',
  padding: '12px 16px',
  fontSize: '14px',
  width: '100%',
};

export const polarDialogLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '8px',
  display: 'block',
};

export const polarDialogButtonPrimaryStyle: React.CSSProperties = {
  borderRadius: '20px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

export const polarDialogButtonSecondaryStyle: React.CSSProperties = {
  borderRadius: '20px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
