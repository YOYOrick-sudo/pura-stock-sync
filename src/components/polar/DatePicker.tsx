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
            color: error ? '#EF4444' : '#282E3A',
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
            color: '#8D93A0',
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
              ? '1px solid #EF4444'
              : isFocused
              ? '1px solid #E27726'
              : '1px solid #EAECF0',
            borderRadius: '16px',
            backgroundColor: disabled ? '#F1F3F5' : '#FFFFFF',
            color: disabled ? '#8D93A0' : '#282E3A',
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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F3F5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={14} color="#8D93A0" />
          </button>
        )}
      </div>

      {helperText && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: error ? '#EF4444' : '#636878',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
