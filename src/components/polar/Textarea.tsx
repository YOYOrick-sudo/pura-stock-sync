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
    <div className="flex flex-col gap-2">
      {label && (
        <label className={`text-sm font-medium ${error ? 'text-destructive' : 'text-foreground'}`}>
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
        className={`text-[15px] p-3 rounded-2xl border outline-none transition-colors resize-y min-h-[80px]
          ${error ? 'border-destructive' : isFocused ? 'border-primary' : 'border-input'}
          ${disabled ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-card text-foreground cursor-text'}`}
      />
      
      <div className="flex justify-between items-center">
        {helperText && (
          <span className={`text-sm ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
            {helperText}
          </span>
        )}
        {showCharacterCount && maxLength && (
          <span className={`text-sm ml-auto ${value.length >= maxLength ? 'text-destructive' : 'text-muted-foreground'}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
