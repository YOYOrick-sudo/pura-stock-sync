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
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '20px',
          border: '1px solid rgba(197, 197, 202, 0.5)',
          padding: '32px',
          maxWidth,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  marginBottom: description ? '8px' : '24px',
                }}
              >
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription 
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'hsl(var(--text-secondary))',
                  marginBottom: '24px',
                }}
              >
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
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  border: '1px solid rgba(197, 197, 202, 0.5)',
  padding: '12px 16px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  color: 'hsl(var(--foreground))',
  width: '100%',
};

export const polarDialogLabelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: 500,
  color: 'hsl(var(--foreground))',
  marginBottom: '8px',
  display: 'block',
};

export const polarDialogButtonPrimaryStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--primary))',
  color: '#FFFFFF',
  borderRadius: '20px',
  padding: '12px 24px',
  fontFamily: 'Inter, sans-serif',
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
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid rgba(197, 197, 202, 0.5)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
