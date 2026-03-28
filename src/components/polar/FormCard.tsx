import React from 'react';
import { cn } from '@/lib/utils';

export interface PolarFormCardProps {
  title?: string;
  children: React.ReactNode;
}

export function PolarFormCard({ title, children }: PolarFormCardProps) {
  return (
    <div>
      {title && (
        <h2 className="text-lg font-medium text-foreground mb-6">
          {title}
        </h2>
      )}

      <div className="bg-card border border-border rounded-lg p-8">
        {children}
      </div>
    </div>
  );
}

export interface PolarFormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function PolarFormField({ label, description, children, required }: PolarFormFieldProps) {
  return (
    <div className="mb-8">
      <label
        className={cn(
          'text-sm font-medium text-foreground block',
          description ? 'mb-1' : 'mb-3',
        )}
      >
        {label}
        {required && (
          <span className="text-foreground ml-0.5">*</span>
        )}
      </label>

      {description && (
        <p className="text-sm font-normal text-muted-foreground mb-3">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}
