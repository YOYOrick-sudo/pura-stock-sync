import React from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-3">
      {label && (
        <label
          className={cn(
            'text-sm font-medium',
            error ? 'text-destructive' : 'text-foreground',
          )}
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col gap-3' : 'flex-row gap-6',
        )}
      >
        {options.map((option) => {
          const isChecked = value === option.value;
          const isDisabled = option.disabled || false;

          return (
            <label
              key={option.value}
              className={cn(
                'flex items-center gap-2',
                isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              )}
            >
              <button
                type="button"
                onClick={() => !isDisabled && onChange(option.value)}
                disabled={isDisabled}
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center p-0 transition-all duration-fast bg-background',
                  'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
                  isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
                  error
                    ? 'border-2 border-destructive'
                    : isChecked
                      ? 'border-2 border-primary'
                      : 'border-2 border-border',
                )}
              >
                {isChecked && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </button>
              <span
                className={cn(
                  'text-[15px] select-none',
                  error ? 'text-destructive' : 'text-foreground',
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {helperText && (
        <span
          className={cn(
            'text-sm',
            error ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
