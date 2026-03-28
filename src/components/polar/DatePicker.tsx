import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

export interface PolarDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  minDate?: string;
  maxDate?: string;
  clearable?: boolean;
}

export function PolarDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  error = false,
  helperText,
  minDate,
  maxDate,
  clearable = false,
}: PolarDatePickerProps) {
  const [isFocused, setIsFocused] = useState(false);

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

      <div style={{ position: 'relative' }}>
        <CalendarIcon
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--foreground))',
            pointerEvents: 'none',
          }}
        />
        
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={minDate}
          max={maxDate}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            padding: '10px 12px 10px 36px',
            paddingRight: clearable && value ? '40px' : '12px',
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
            width: '100%',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--background))'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={14} color="hsl(var(--foreground))" />
          </button>
        )}
      </div>

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
    </div>
  );
}
