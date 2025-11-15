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
}: PolarKPICardProps) {
  
  // Calculate chart line points
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

  // Compact variant - small simple card with grey background
  if (compact) {
    return (
      <div
        style={{
          backgroundColor: '#F4F5F6',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#36373A',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '40px',
            fontWeight: 600,
            color: '#17171C',
            letterSpacing: '-0.01em',
            lineHeight: '1',
          }}
        >
          {value}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#F4F5F6',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '320px',
      }}
    >
      {/* Header - on grey background */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: '#17171C',
            }}
          >
            {title}
          </span>
          {hasDropdown && (
            <ChevronDown size={16} style={{ color: '#36373A' }} />
          )}
        </div>
        {actionLink && (
          <button
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              color: '#17171C',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {actionLink}
          </button>
        )}
      </div>

      {/* Value - on grey background */}
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '56px',
          fontWeight: 600,
          color: '#17171C',
          letterSpacing: '-0.02em',
          lineHeight: '1',
          marginBottom: dateRanges.length > 0 ? '20px' : '24px',
        }}
      >
        {value}
      </div>

      {/* Date Ranges - on grey background */}
      {dateRanges.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '32px',
          }}
        >
          {dateRanges.map((range, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Circle
                size={8}
                fill="#1B7867"
                stroke="none"
              />
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#36373A',
                }}
              >
                {range}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Content Text - on grey background (for non-chart cards) */}
      {contentText && !showChart && (
        <div style={{ marginTop: 'auto' }}>
          {contentText.primary && (
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                fontWeight: 400,
                color: '#17171C',
                marginBottom: contentText.secondary ? '4px' : '0',
              }}
            >
              {contentText.primary}
            </div>
          )}
          {contentText.secondary && (
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 400,
                color: '#36373A',
              }}
            >
              {contentText.secondary}
            </div>
          )}
        </div>
      )}

      {/* Chart - WHITE background layer inside grey card */}
      {showChart && chartData.length > 0 && (
        <div
          style={{
            marginTop: 'auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          {/* Chart SVG */}
          <div style={{ height: `${chartHeight}px`, width: '100%', marginBottom: '12px' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ display: 'block' }}
            >
              {/* Bottom border line */}
              <line 
                x1="0" 
                y1="100" 
                x2="100" 
                y2="100" 
                stroke="#ECEDED" 
                strokeWidth="1" 
                vectorEffect="non-scaling-stroke"
              />

              {/* Line */}
              {chartData.length > 1 && (
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke="#1B7867"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  style={{
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  }}
                />
              )}
            </svg>
          </div>

          {/* X-Axis Labels */}
          {xAxisLabels.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {xAxisLabels.map((label, index) => (
                <span
                  key={index}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: 400,
                    color: '#36373A',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dot indicators */}
      {showDots && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px',
          }}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === activeDot ? '#1B7867' : '#ECEDED',
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
