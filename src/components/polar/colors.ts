/**
 * Polar Design System - Color Presets (Pura Vida OS v6.0 - Sunset Orange)
 * 
 * Complete color palette using Midnight Slate tones and Sunset Orange primary.
 */

export const PolarColors = {
  // Base Colors (Midnight Slate)
  white: '#FFFFFF',
  background: '#F8F9FA',              // Midnight Slate 50
  surface: '#FFFFFF',                  // White for cards
  
  // Text Colors
  text: {
    primary: '#282E3A',               // Midnight Slate 800
    secondary: '#636878',             // Midnight Slate 400
    tertiary: '#9DA3AF',              // Midnight Slate 300
    disabled: '#C1C5CF',              // Midnight Slate 200
  },

  // Border Colors
  border: {
    default: '#EAECF0',               // Midnight Slate 100
    light: '#F1F3F5',                 // Midnight Slate 75
    dark: '#2F3440',                  // Midnight Slate 700
  },

  // Brand Colors (Sunset Orange)
  brand: {
    primary: '#E27726',               // Sunset Orange 500
    primaryHover: '#C9630E',          // Sunset Orange 600
    primaryLight: '#FFF7ED',          // Sunset Orange 50
    primaryBorder: '#FED7AA',         // Sunset Orange 200
  },

  // Status Colors
  status: {
    success: '#22C55E',
    successLight: '#F0FDF4',
    successBorder: '#BBF7D0',
    
    pending: '#F59E0B',
    pendingLight: '#FFFBEB',
    pendingBorder: '#FDE68A',
    
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    warningBorder: '#FDE68A',
    
    error: '#EF4444',
    errorLight: '#FEF2F2',
    errorBorder: '#FECACA',
    
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    infoBorder: '#BFDBFE',
  },

  // Component-specific colors
  badge: {
    default: {
      bg: '#F1F3F5',
      text: '#2F3440',
      border: '#EAECF0',
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
    offline: '#9DA3AF',
    background: '#F1F3F5',
  },

  // Muted/Secondary surfaces
  muted: {
    bg: '#F1F3F5',
    hover: '#EAECF0',
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
