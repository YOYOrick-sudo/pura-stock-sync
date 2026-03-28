import React, { useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          className={cn(
            'text-sm font-medium',
            error ? 'text-destructive' : 'text-foreground'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <CalendarIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground pointer-events-none"
        />

        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={minDate}
          max={maxDate}
          className={cn(
            'text-[15px] py-2.5 pl-9 w-full rounded-lg bg-card text-foreground outline-none transition-colors duration-200 border',
            clearable && value ? 'pr-10' : 'pr-3',
            error
              ? 'border-destructive'
              : 'border-border focus:border-primary',
            disabled && 'bg-background text-muted-foreground cursor-not-allowed',
            !disabled && 'cursor-pointer'
          )}
        />

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-transparent border-none flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            <X size={14} className="text-foreground" />
          </button>
        )}
      </div>

      {helperText && (
        <span
          className={cn(
            'text-sm',
            error ? 'text-destructive' : 'text-foreground'
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
