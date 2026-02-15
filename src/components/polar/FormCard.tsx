import React from 'react';

export interface PolarFormCardProps {
  title?: string;
  children: React.ReactNode;
}

export function PolarFormCard({ title, children }: PolarFormCardProps) {
  return (
    <div>
      {title && (
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px',
            fontWeight: 500,
            color: '#282E3A',
            marginBottom: '24px',
          }}
        >
          {title}
        </h2>
      )}
      
      <div
        className="rounded-polar-lg"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(197, 197, 202, 0.5)',
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
      <label
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#282E3A',
          display: 'block',
          marginBottom: description ? '4px' : '12px',
        }}
      >
        {label}
        {required && (
          <span style={{ color: '#282E3A', marginLeft: '2px' }}>*</span>
        )}
      </label>
      
      {description && (
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#636878',
            marginBottom: '12px',
          }}
        >
          {description}
        </p>
      )}
      
      {children}
    </div>
  );
}
