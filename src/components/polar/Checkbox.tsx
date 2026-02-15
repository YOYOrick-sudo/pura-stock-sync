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
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            border: error ? '2px solid #EF4444' : checked ? '2px solid #E27726' : '2px solid #C1C5CF',
            backgroundColor: checked ? '#E27726' : '#FFFFFF',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            padding: 0,
          }}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        {label && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: error ? '#EF4444' : '#282E3A',
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
            fontSize: '12px',
            color: error ? '#EF4444' : '#8D93A0',
            paddingLeft: '24px',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
