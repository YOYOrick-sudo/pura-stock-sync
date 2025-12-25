import React from 'react';

export interface PolarCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export function PolarCheckbox({ 
  checked, 
  onChange, 
  label,
  disabled = false,
  error = false,
  helperText,
}: PolarCheckboxProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <button
          type="button"
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: error ? '2px solid hsl(var(--destructive))' : checked ? '2px solid hsl(var(--primary))' : '2px solid hsl(var(--input))',
            backgroundColor: checked ? 'hsl(var(--primary))' : 'hsl(var(--background))',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            padding: 0,
          }}
        >
          {checked && (
            <div 
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--primary-foreground))',
              }}
            />
          )}
        </button>
        {label && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              color: error ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
              userSelect: 'none',
            }}
          >
            {label}
          </span>
        )}
      </label>
      {helperText && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: error ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
            paddingLeft: '28px',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
