import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

export interface PolarDatePickerProps {
  label?: string;
  value: string;
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
    <div className="flex flex-col gap-2">
      {label && (
        <label className={`text-sm font-medium ${error ? 'text-destructive' : 'text-foreground'}`}>
          {label}
        </label>
      )}

      <div className="relative">
        <CalendarIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
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
          className={`w-full text-[15px] py-2.5 pl-9 rounded-2xl border outline-none transition-colors
            ${error ? 'border-destructive' : isFocused ? 'border-primary' : 'border-input'}
            ${disabled ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-card text-foreground cursor-pointer'}
            ${clearable && value ? 'pr-10' : 'pr-3'}`}
        />

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {helperText && (
        <span className={`text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
}
