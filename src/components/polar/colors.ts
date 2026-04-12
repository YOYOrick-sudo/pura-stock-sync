/**
 * Polar Design System - Color Tokens
 * 
 * IMPORTANT: These map to CSS variables from index.css.
 * For inline styles that MUST use hex, use these constants.
 * Prefer Tailwind classes (bg-primary, text-foreground, etc.) whenever possible.
 */

export const PolarColors = {
  // Use CSS vars via hsl(var(--*)) in inline styles
  white: '#FFFFFF',
  background: 'hsl(var(--background))',
  surface: 'hsl(var(--card))',
  
  text: {
    primary: 'hsl(var(--foreground))',
    secondary: 'hsl(var(--muted-foreground))',
    tertiary: 'hsl(var(--muted-foreground))',
    disabled: 'hsl(var(--border))',
  },

  border: {
    default: 'hsl(var(--border))',
    light: 'hsl(var(--muted))',
    dark: 'hsl(var(--foreground))',
  },

  brand: {
    primary: 'hsl(var(--primary))',
    primaryHover: 'hsl(var(--primary-hover))',
    primaryLight: 'hsl(var(--secondary))',
    primaryBorder: 'hsl(var(--border))',
  },

  status: {
    success: 'hsl(var(--success))',
    successLight: 'hsl(var(--success) / 0.1)',
    successBorder: 'hsl(var(--success) / 0.2)',
    
    pending: 'hsl(var(--warning))',
    pendingLight: 'hsl(var(--warning) / 0.1)',
    pendingBorder: 'hsl(var(--warning) / 0.2)',
    
    warning: 'hsl(var(--warning))',
    warningLight: 'hsl(var(--warning) / 0.1)',
    warningBorder: 'hsl(var(--warning) / 0.2)',
    
    error: 'hsl(var(--destructive))',
    errorLight: 'hsl(var(--destructive) / 0.1)',
    errorBorder: 'hsl(var(--destructive) / 0.2)',
    
    info: 'hsl(var(--info))',
    infoLight: 'hsl(var(--info) / 0.1)',
    infoBorder: 'hsl(var(--info) / 0.2)',
  },

  badge: {
    default: {
      bg: 'hsl(var(--muted))',
      text: 'hsl(var(--foreground))',
      border: 'hsl(var(--border))',
    },
    success: {
      bg: 'hsl(var(--success) / 0.1)',
      text: 'hsl(var(--success))',
      border: 'hsl(var(--success) / 0.2)',
    },
    pending: {
      bg: 'hsl(var(--warning) / 0.1)',
      text: 'hsl(var(--warning))',
      border: 'hsl(var(--warning) / 0.2)',
    },
    warning: {
      bg: 'hsl(var(--warning) / 0.1)',
      text: 'hsl(var(--warning))',
      border: 'hsl(var(--warning) / 0.2)',
    },
    error: {
      bg: 'hsl(var(--destructive) / 0.1)',
      text: 'hsl(var(--destructive))',
      border: 'hsl(var(--destructive) / 0.2)',
    },
    info: {
      bg: 'hsl(var(--info) / 0.1)',
      text: 'hsl(var(--info))',
      border: 'hsl(var(--info) / 0.2)',
    },
  },

  avatar: {
    online: 'hsl(var(--success))',
    offline: 'hsl(var(--muted-foreground))',
    background: 'hsl(var(--muted))',
  },

  muted: {
    bg: 'hsl(var(--muted))',
    hover: 'hsl(var(--border))',
  },
} as const;

export const { white, background, surface, text, border, brand, status, badge, avatar, muted } = PolarColors;

// Helper function to get color with opacity - use hsl(var(--token) / alpha) instead
export function withOpacity(color: string, opacity: number): string {
  // For CSS var based colors, return them with opacity
  if (color.startsWith('hsl(var(')) {
    return color.replace(')', ` / ${opacity})`);
  }
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
