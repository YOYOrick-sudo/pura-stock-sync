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
            color: error ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
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
            ? '1px solid hsl(var(--destructive))' 
            : isFocused 
            ? '1px solid hsl(var(--primary))' 
            : '1px solid hsl(var(--border))',
          borderRadius: '16px',
          backgroundColor: disabled ? 'hsl(var(--background))' : 'hsl(var(--card))',
          color: disabled ? 'hsl(var(--text-secondary))' : 'hsl(var(--foreground))',
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
              color: error ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
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
              color: value.length >= maxLength ? 'hsl(var(--destructive))' : 'hsl(var(--text-secondary))',
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
