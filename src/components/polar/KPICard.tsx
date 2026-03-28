import React from 'react';
import { Circle, ChevronDown } from 'lucide-react';

export interface PolarKPICardProps {
  title: string;
  value: string;
  hasDropdown?: boolean;
  actionLink?: string;
  dateRanges?: string[];
  showChart?: boolean;
  chartData?: number[];
  xAxisLabels?: string[];
  showDots?: boolean;
  activeDot?: number;
  contentText?: {
    primary?: string;
    secondary?: string;
  };
  compact?: boolean;
  statusColor?: {
    bg: string;
    text?: string;
    border?: string;
    icon?: React.ReactNode;
  };
}

export function PolarKPICard({ 
  title,
  value,
  hasDropdown = false,
  actionLink,
  dateRanges = [],
  showChart = false,
  chartData = [],
  xAxisLabels = [],
  showDots = false,
  activeDot = 0,
  contentText,
  compact = false,
  statusColor,
}: PolarKPICardProps) {
  
  const chartHeight = 140;
  const maxValue = Math.max(...chartData, 1);
  const minValue = Math.min(...chartData, 0);
  const range = maxValue - minValue || 1;
  
  const points = chartData.map((value, index) => {
    const x = (index / Math.max(chartData.length - 1, 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 85;
    return { x, y };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  if (compact) {
    return (
      <div
        className="bg-card border border-border rounded-[20px] p-5 flex flex-col gap-2 h-full min-h-[140px] shadow-soft transition-all duration-200"
      >
        <div className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          {statusColor?.icon && (
            <span style={{ color: statusColor.text }} className="flex items-center">
              {statusColor.icon}
            </span>
          )}
          {title}
        </div>
        <div className="text-[32px] font-semibold text-foreground tracking-tight leading-none mt-1">
          {value}
        </div>
        {contentText?.primary && (
          <div className="text-[13px] font-medium text-foreground mt-1">
            {contentText.primary}
          </div>
        )}
        {contentText?.secondary && (
          <div className="text-xs text-muted-foreground">
            {contentText.secondary}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-polar-lg bg-card border border-border p-6 flex flex-col min-h-[320px]"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] text-foreground">{title}</span>
          {hasDropdown && <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
        {actionLink && (
          <button className="text-[15px] text-foreground bg-transparent border-none cursor-pointer p-0">
            {actionLink}
          </button>
        )}
      </div>

      {/* Value */}
      <div className="text-[56px] font-semibold text-foreground tracking-tight leading-none mb-6">
        {value}
      </div>

      {/* Date Ranges */}
      {dateRanges.length > 0 && (
        <div className="flex flex-col gap-2 mb-8">
          {dateRanges.map((range, index) => (
            <div key={index} className="flex items-center gap-2">
              <Circle size={8} className="fill-primary text-primary" />
              <span className="text-[13px] text-muted-foreground">{range}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content Text */}
      {contentText && !showChart && (
        <div className="mt-auto">
          {contentText.primary && (
            <div className="text-[15px] text-foreground mb-1">
              {contentText.primary}
            </div>
          )}
          {contentText.secondary && (
            <div className="text-[13px] text-muted-foreground">
              {contentText.secondary}
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <div className="rounded-polar-lg mt-auto bg-card p-6">
          <div style={{ height: `${chartHeight}px` }} className="w-full mb-3">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="block">
              <line x1="0" y1="100" x2="100" y2="100" className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              {chartData.length > 1 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
                />
              )}
            </svg>
          </div>
          {xAxisLabels.length > 0 && (
            <div className="flex justify-between">
              {xAxisLabels.map((label, index) => (
                <span key={index} className="text-[13px] text-muted-foreground">{label}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dot indicators */}
      {showDots && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${index === activeDot ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
