/**
 * Polar Design System - Color Presets (Clean SaaS Edition)
 *
 * Green as sole accent, everything else neutral gray/white.
 * Prefer CSS variables (hsl(var(--token))) in components.
 * This file is for cases where raw hex values are needed (canvas, charts, etc).
 */

export const PolarColors = {
  // Base Colors (Gray)
  white: '#FFFFFF',
  background: '#F3F4F6',              // Gray-100
  surface: '#FFFFFF',                  // White for cards

  // Text Colors
  text: {
    primary: '#111827',               // Gray-900
    secondary: '#6B7280',             // Gray-500
    tertiary: '#9CA3AF',              // Gray-400
    disabled: '#D1D5DB',              // Gray-300
  },

  // Border Colors
  border: {
    default: '#E5E7EB',               // Gray-200
    light: '#F3F4F6',                 // Gray-100
    dark: '#374151',                  // Gray-700
  },

  // Brand Colors (Green)
  brand: {
    primary: '#16A34A',               // Green-600
    primaryHover: '#15803D',          // Green-700
    primaryLight: '#F0FDF4',          // Green-50
    primaryBorder: '#4ADE80',         // Green-400
  },

  // Status Colors
  status: {
    success: '#22C55E',               // Green-500
    successLight: '#F0FDF4',          // Green-50
    successBorder: '#BBF7D0',         // Green-200

    pending: '#F59E0B',               // Amber-500
    pendingLight: '#FFFBEB',          // Amber-50
    pendingBorder: '#FDE68A',         // Amber-200

    warning: '#F59E0B',               // Amber-500
    warningLight: '#FFFBEB',          // Amber-50
    warningBorder: '#FDE68A',         // Amber-200

    error: '#EF4444',                 // Red-500
    errorLight: '#FEF2F2',            // Red-50
    errorBorder: '#FECACA',           // Red-200

    info: '#3B82F6',                  // Blue-500
    infoLight: '#EFF6FF',             // Blue-50
    infoBorder: '#BFDBFE',            // Blue-200
  },

  // Component-specific colors
  badge: {
    default: {
      bg: '#F3F4F6',                  // Gray-100
      text: '#374151',                // Gray-700
      border: '#E5E7EB',              // Gray-200
    },
    success: {
      bg: '#F0FDF4',
      text: '#16A34A',
      border: '#BBF7D0',
    },
    pending: {
      bg: '#FFFBEB',
      text: '#F59E0B',
      border: '#FDE68A',
    },
    warning: {
      bg: '#FFFBEB',
      text: '#F59E0B',
      border: '#FDE68A',
    },
    error: {
      bg: '#FEF2F2',
      text: '#EF4444',
      border: '#FECACA',
    },
    info: {
      bg: '#EFF6FF',
      text: '#3B82F6',
      border: '#BFDBFE',
    },
  },

  // Avatar
  avatar: {
    online: '#22C55E',
    offline: '#9CA3AF',
    background: '#F3F4F6',
  },

  // Muted/Secondary surfaces
  muted: {
    bg: '#F3F4F6',                    // Gray-100
    hover: '#E5E7EB',                 // Gray-200
  },
} as const;

// Export individual color groups for convenience
export const { white, background, surface, text, border, brand, status, badge, avatar, muted } = PolarColors;

// Helper function to get color with opacity
export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
