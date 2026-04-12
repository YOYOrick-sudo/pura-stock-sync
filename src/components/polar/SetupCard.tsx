import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PolarSetupCardProps {
  icon?: LucideIcon;
  title: string;
  bodyText: string;
  buttonText: string;
  onButtonClick?: () => void;
}

export function PolarSetupCard({
  icon: Icon,
  title,
  bodyText,
  buttonText,
  onButtonClick,
}: PolarSetupCardProps) {
  return (
    <div
      className="rounded-polar-lg bg-card"
      style={{
        padding: '24px',
        width: '380px',
      }}
    >
      {/* White inner layer */}
      <div
        className="flex flex-col rounded-polar-lg"
        style={{
          backgroundColor: '#FFFFFF',
          padding: '24px',
        }}
      >
        {/* Icon */}
        {Icon && (
          <div
            className="rounded-polar-md bg-secondary"
            style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
            }}
          >
            <Icon size={24} className="text-foreground" />
          </div>
        )}

        {/* Title */}
        <h3 className="text-foreground" style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          marginBottom: '8px',
        }}>
          {title}
        </h3>

        {/* Body Text */}
        <p className="text-muted-foreground" style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 400,
          marginBottom: '24px',
          lineHeight: '20px',
        }}>
          {bodyText}
        </p>

        {/* CTA Button */}
        <button
          onClick={onButtonClick}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
