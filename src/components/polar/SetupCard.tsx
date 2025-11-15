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
      style={{
        backgroundColor: '#F4F5F6',
        borderRadius: '16px',
        padding: '24px',
        width: '380px',
      }}
    >
      {/* White inner layer */}
      <div
        className="flex flex-col"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        {/* Icon */}
        {Icon && (
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: '#F4F5F6',
              borderRadius: '12px',
            }}
          >
            <Icon size={24} style={{ color: '#17171C' }} />
          </div>
        )}

        {/* Title */}
        <h3
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 500,
            color: '#17171C',
            marginBottom: '8px',
          }}
        >
          {title}
        </h3>

        {/* Body Text */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#36373A',
            marginBottom: '24px',
            lineHeight: '20px',
          }}
        >
          {bodyText}
        </p>

        {/* CTA Button */}
        <button
          onClick={onButtonClick}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            fontWeight: 500,
            color: '#FFFFFF',
            backgroundColor: '#1B7867',
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
