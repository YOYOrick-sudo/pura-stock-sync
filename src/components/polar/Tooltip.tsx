import React, { useState, useRef, useEffect } from 'react';

export interface PolarTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function PolarTooltip({
  content,
  children,
  position = 'top',
  delay = 200,
}: PolarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      zIndex: 9999,
      padding: '6px 10px',
      backgroundColor: 'hsl(var(--foreground))',
      color: 'hsl(var(--card))',
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '8px',
      whiteSpace: 'nowrap' as const,
      pointerEvents: 'none' as const,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyles,
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyles,
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div style={getPositionStyles()}>
          {content}
        </div>
      )}
    </div>
  );
}
