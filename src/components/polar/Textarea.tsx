import React from 'react';

export interface PolarTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export function PolarTextarea({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  error = false,
  helperText,
  rows = 4,
  maxLength,
  showCharacterCount = false,
}: PolarTextareaProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <label
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: error ? '#E64D4D' : '#17171C',
          }}
        >
          {label}
        </label>
      )}
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          padding: '12px',
          border: error 
            ? '1px solid #E64D4D' 
            : isFocused 
            ? '1px solid #E27726' 
            : '1px solid #ECEDED',
          borderRadius: '16px',
          backgroundColor: disabled ? '#F4F5F6' : '#FFFFFF',
          color: disabled ? '#73747B' : '#17171C',
          outline: 'none',
          transition: 'border-color 200ms',
          resize: 'vertical',
          minHeight: '80px',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {helperText && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: error ? '#E64D4D' : '#36373A',
            }}
          >
            {helperText}
          </span>
        )}
        {showCharacterCount && maxLength && (
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: value.length >= maxLength ? '#E64D4D' : '#73747B',
              marginLeft: 'auto',
            }}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
