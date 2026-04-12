import React from 'react';

export interface PolarFormCardProps {
  title?: string;
  children: React.ReactNode;
}

export function PolarFormCard({ title, children }: PolarFormCardProps) {
  return (
    <div>
      {title && (
        <h2 className="text-foreground" style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '18px',
          fontWeight: 500,
          marginBottom: '24px',
        }}>
          {title}
        </h2>
      )}
      
      <div
        className="rounded-polar-lg"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid hsl(var(--border))',
          padding: '32px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export interface PolarFormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function PolarFormField({ label, description, children, required }: PolarFormFieldProps) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <label className="text-foreground" style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        display: 'block',
        marginBottom: description ? '4px' : '12px',
      }}>
        {label}
        {required && (
          <span className="text-foreground" style={{ marginLeft: '2px' }}>*</span>
        )}
      </label>
      
      {description && (
        <p className="text-muted-foreground" style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 400,
          marginBottom: '12px',
        }}>
          {description}
        </p>
      )}
      
      {children}
    </div>
  );
}
