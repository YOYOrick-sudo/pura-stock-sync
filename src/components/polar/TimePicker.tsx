import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

export interface PolarTimePickerProps {
  label?: string;
  value: string; // HH:mm format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  minTime?: string;
  maxTime?: string;
  clearable?: boolean;
}

export function PolarTimePicker({
  label,
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  error = false,
  helperText,
  minTime,
  maxTime,
  clearable = false,
}: PolarTimePickerProps) {
  const [isFocused, setIsFocused] = useState(false);

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

      <div style={{ position: 'relative' }}>
        <Clock
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#36373A',
            pointerEvents: 'none',
          }}
        />
        
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={minTime}
          max={maxTime}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            padding: '10px 12px 10px 36px',
            paddingRight: clearable && value ? '40px' : '12px',
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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F5F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={14} color="#36373A" />
          </button>
        )}
      </div>

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
    </div>
  );
}
