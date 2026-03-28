import React from 'react';

interface ModernKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: 'default' | 'puravida';
}

export const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'bg-card border-border',
    puravida: 'bg-card border-primary/30'
  };

  return (
    <div className={`rounded-polar-lg p-6 shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${variantStyles[variant]}`}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-5xl font-bold text-foreground mt-2">
        {value}
      </p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
      {trend && (
        <div className={`mt-3 text-sm font-medium ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};
