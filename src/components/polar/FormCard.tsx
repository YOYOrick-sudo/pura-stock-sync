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
            color: '#17171C',
            marginBottom: '24px',
          }}
        >
          {title}
        </h2>
      )}
      
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #ECEDED',
          borderRadius: '16px',
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
          color: '#17171C',
          display: 'block',
          marginBottom: description ? '4px' : '12px',
        }}
      >
        {label}
        {required && (
          <span style={{ color: '#17171C', marginLeft: '2px' }}>*</span>
        )}
      </label>
      
      {description && (
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#36373A',
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
