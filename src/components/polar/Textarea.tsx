import React from 'react';
import { cn } from '@/lib/utils';

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

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={cn(
          'text-[15px] p-3 rounded-lg bg-card text-foreground outline-none transition-colors duration-200 resize-vertical min-h-[80px] border',
          error
            ? 'border-destructive'
            : 'border-border focus:border-primary',
          disabled && 'bg-background text-muted-foreground cursor-not-allowed',
          !disabled && 'cursor-text'
        )}
      />

      <div className="flex justify-between items-center">
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
        {showCharacterCount && maxLength && (
          <span
            className={cn(
              'text-sm ml-auto',
              value.length >= maxLength ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
