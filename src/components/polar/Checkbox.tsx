import React from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-1">
      <label
        className={cn(
          'flex items-center gap-2',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        )}
      >
        <button
          type="button"
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center p-0 transition-all duration-fast',
            'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            error
              ? 'border-2 border-destructive'
              : checked
                ? 'border-2 border-primary bg-primary'
                : 'border-2 border-input bg-background',
          )}
        >
          {/* Volledig gevuld - geen binnenste cirkel nodig */}
        </button>
        {label && (
          <span
            className={cn(
              'text-[15px] select-none',
              error ? 'text-destructive' : 'text-foreground',
            )}
          >
            {label}
          </span>
        )}
      </label>
      {helperText && (
        <span
          className={cn(
            'text-sm pl-7',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
