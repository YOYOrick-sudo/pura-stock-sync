/**
 * Polar Design System — Color Presets (Pura Vida Enterprise Edition)
 *
 * Brand teal as sole accent, Slate neutrals for everything else.
 * Prefer CSS variables (hsl(var(--token))) in components.
 * This file is for raw hex values needed in canvas, charts, etc.
 */

export const PolarColors = {
  // Base Colors (Slate)
  white: '#FFFFFF',
  background: '#F9FAFB',              // Gray-50
  surface: '#FFFFFF',

  // Text Colors (Slate)
  text: {
    primary: '#111827',               // Gray-900
    secondary: '#64748B',             // Slate-500
    tertiary: '#94A3B8',              // Slate-400
    disabled: '#CBD5E1',              // Slate-300
  },

  // Border Colors (Slate)
  border: {
    default: '#E2E8F0',               // Slate-200
    light: '#F1F5F9',                 // Slate-100
    dark: '#334155',                  // Slate-700
  },

  // Brand Colors (Pura Vida Teal)
  brand: {
    primary: '#1B7867',               // Pura Vida teal
    primaryHover: '#156556',
    primaryLight: '#EFFAF7',           // Faint teal tint
    primaryBorder: '#B3D9D4',
  },

  // Status Colors
  status: {
    success: '#0D9488',               // Teal-600 (on-brand)
    successLight: '#F0FDFA',          // Teal-50
    successBorder: '#99F6E4',         // Teal-200

    pending: '#F59E0B',               // Amber-500
    pendingLight: '#FFFBEB',
    pendingBorder: '#FDE68A',

    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    warningBorder: '#FDE68A',

    error: '#DC2626',                 // Red-600
    errorLight: '#FEF2F2',
    errorBorder: '#FECACA',

    info: '#3B82F6',
    infoLight: '#EFF6FF',
    infoBorder: '#BFDBFE',
  },

  // Component-specific
  badge: {
    default: {
      bg: '#F1F5F9',                  // Slate-100
      text: '#334155',                // Slate-700
      border: '#E2E8F0',
    },
    success: {
      bg: '#F0FDFA',
      text: '#0D9488',
      border: '#99F6E4',
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
      text: '#DC2626',
      border: '#FECACA',
    },
    info: {
      bg: '#EFF6FF',
      text: '#3B82F6',
      border: '#BFDBFE',
    },
  },

  avatar: {
    online: '#0D9488',
    offline: '#94A3B8',
    background: '#F1F5F9',
  },

  muted: {
    bg: '#F1F5F9',                    // Slate-100
    hover: '#E2E8F0',                 // Slate-200
  },
} as const;

export const { white, background, surface, text, border, brand, status, badge, avatar, muted } = PolarColors;

export function withOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
