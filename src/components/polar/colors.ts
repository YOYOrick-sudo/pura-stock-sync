/**
 * Polar Design System - Color Presets (Modern Slate Edition)
 * 
 * Complete color palette using modern slate tones.
 * All legacy crème/moonlight colors removed.
 */

export const PolarColors = {
  // Base Colors (Modern Slate)
  white: '#FFFFFF',
  background: '#F8FAFC',              // Slate-50 (modern, no yellow)
  surface: '#FFFFFF',                  // White for cards
  
  // Text Colors
  text: {
    primary: '#0F172A',               // Slate-900
    secondary: '#64748B',             // Slate-500
    tertiary: '#94A3B8',              // Slate-400
    disabled: '#CBD5E1',              // Slate-300
  },

  // Border Colors
  border: {
    default: '#E2E8F0',               // Slate-200
    light: '#F1F5F9',                 // Slate-100
    dark: '#334155',                  // Slate-700
  },

  // Brand Colors (Pura Vida Sea)
  brand: {
    primary: '#1B7867',               // Pura Vida Sea
    primaryHover: '#156556',          // Darker Sea
    primaryLight: '#E6F4F1',          // Light Sea
    primaryBorder: '#B3D9D4',         // Sea border
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
      bg: '#F1F5F9',                  // Slate-100
      text: '#334155',                // Slate-700
      border: '#E2E8F0',              // Slate-200
    },
    success: {
      bg: '#F0FDF4',
      text: '#22C55E',
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
    offline: '#94A3B8',
    background: '#F1F5F9',
  },

  // Muted/Secondary surfaces
  muted: {
    bg: '#F1F5F9',                    // Slate-100
    hover: '#E2E8F0',                 // Slate-200
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
