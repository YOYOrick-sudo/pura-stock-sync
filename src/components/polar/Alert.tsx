import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { PolarColors } from './colors';

export interface PolarAlertProps {
  variant?: 'warning' | 'error' | 'success' | 'info';
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
}

export function PolarAlert({ 
  variant = 'info', 
  children, 
  action,
  onDismiss 
}: PolarAlertProps) {
  const colors = {
    warning: {
      icon: PolarColors.status.error,
      bg: PolarColors.status.errorLight,
      border: PolarColors.status.errorBorder,
      text: PolarColors.text.primary,
    },
    error: {
      icon: PolarColors.status.error,
      bg: PolarColors.status.errorLight,
      border: PolarColors.status.errorBorder,
      text: PolarColors.text.primary,
    },
    success: {
      icon: PolarColors.status.success,
      bg: PolarColors.status.successLight,
      border: PolarColors.status.successBorder,
      text: PolarColors.text.primary,
    },
    info: {
      icon: PolarColors.status.info,
      bg: PolarColors.status.infoLight,
      border: PolarColors.status.infoBorder,
      text: PolarColors.text.primary,
    },
  };

  const style = colors[variant];

  const icons = {
    warning: <AlertCircle size={20} />,
    error: <XCircle size={20} />,
    success: <CheckCircle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '16px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ color: style.icon, display: 'flex', flexShrink: 0 }}>
        {icons[variant]}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: '15px',
          fontWeight: 400,
          color: style.text,
          lineHeight: '22px',
        }}
      >
        {children}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
