import React from 'react';
import { Check } from 'lucide-react';

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
            borderRadius: '6px',
            border: error ? '2px solid #E64D4D' : checked ? '2px solid #1B7867' : '2px solid #ECEDED',
            backgroundColor: checked ? '#1B7867' : '#FFFFFF',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            padding: 0,
          }}
        >
          {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </button>
        {label && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              color: error ? '#E64D4D' : '#17171C',
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
            color: error ? '#E64D4D' : '#36373A',
            paddingLeft: '28px',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
