import React from 'react';

export interface PolarRadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PolarRadioGroupProps {
  name: string;
  options: PolarRadioOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function PolarRadioGroup({ 
  name,
  options,
  value,
  onChange,
  label,
  error = false,
  helperText,
  orientation = 'vertical',
}: PolarRadioGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {label && (
        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: error ? '#E64D4D' : '#282E3A',
          }}
        >
          {label}
        </label>
      )}
      
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          gap: orientation === 'vertical' ? '12px' : '24px',
        }}
      >
        {options.map((option) => {
          const isChecked = value === option.value;
          const isDisabled = option.disabled || false;
          
          return (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => !isDisabled && onChange(option.value)}
                disabled={isDisabled}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: error ? '2px solid #E64D4D' : isChecked ? '2px solid #1B7867' : '2px solid rgba(197, 197, 202, 0.5)',
                  backgroundColor: '#FFFFFF',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
              >
                {isChecked && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#1B7867',
                    }}
                  />
                )}
              </button>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: error ? '#E64D4D' : '#282E3A',
                  userSelect: 'none',
                }}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      
      {helperText && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: error ? '#E64D4D' : '#73747B',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
