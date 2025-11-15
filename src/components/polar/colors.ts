/**
 * Polar Design System - Color Presets (Pura Vida Edition)
 * 
 * Complete color palette mapped to Pura Vida brand colors.
 * Polar teal (#1d979e) replaced with Pura Vida Sea (#1B7867)
 */

export const PolarColors = {
  // Base Colors
  white: '#FFFFFF',
  background: '#F4F5F6',
  surface: '#FAFAFA',
  
  // Text Colors
  text: {
    primary: '#17171C',
    secondary: '#36373A',
    tertiary: '#73747B',
    disabled: '#ACAEB3',
  },

  // Border Colors
  border: {
    default: '#ECEDED',
    light: '#F4F5F6',
    dark: '#36373A',
  },

  // Brand Colors (Pura Vida Sea)
  brand: {
    primary: '#1B7867',        // Pura Vida Sea (was #1d979e)
    primaryHover: '#156556',   // Darker Sea (was #188991)
    primaryLight: '#E6F4F1',   // Light Sea (was #E7F9FA)
    primaryBorder: '#B3D9D4',  // Sea border (was #C4EBEC)
  },

  // Status Colors
  status: {
    success: '#10B981',
    successLight: '#F0FDF4',
    successBorder: '#D1FAE5',
    
    pending: '#FF9800',
    pendingLight: '#FFF8F0',
    pendingBorder: '#FFE7CC',
    
    warning: '#E64D4D',
    warningLight: '#FEF5F5',
    warningBorder: '#FEE7E7',
    
    error: '#E64D4D',
    errorLight: '#FEF5F5',
    errorBorder: '#FEE7E7',
    
    info: '#1B7867',          // Pura Vida Sea (was #1d979e)
    infoLight: '#E6F4F1',     // Light Sea (was #E7F9FA)
    infoBorder: '#B3D9D4',    // Sea border (was #C4EBEC)
  },

  // Component-specific colors
  badge: {
    default: {
      bg: '#F4F5F6',
      text: '#36373A',
      border: '#ECEDED',
    },
    success: {
      bg: '#F0FDF4',
      text: '#10B981',
      border: '#D1FAE5',
    },
    pending: {
      bg: '#FFF8F0',
      text: '#FF9800',
      border: '#FFE7CC',
    },
    warning: {
      bg: '#FEF5F5',
      text: '#E64D4D',
      border: '#FEE7E7',
    },
    error: {
      bg: '#FEF5F5',
      text: '#E64D4D',
      border: '#FEE7E7',
    },
    info: {
      bg: '#E6F4F1',           // Light Sea (was #E7F9FA)
      text: '#1B7867',         // Pura Vida Sea (was #1d979e)
      border: '#B3D9D4',       // Sea border (was #C4EBEC)
    },
  },

  // Avatar
  avatar: {
    online: '#10B981',
    offline: '#73747B',
    background: '#F4F5F6',
  },

  // Extra Pura Vida accent colors
  puravida: {
    sunset: '#E27726',    // Sunset - Accent/CTA
    sunrise: '#F9BD84',   // Sunrise - Secondary Accent
    moonlight: '#F5F7DD', // Moonlight - Background
    midnight: '#282E3A',  // Midnight - Dark text
    sky: '#B1CFBE',       // Sky - Muted/Borders
  },
} as const;

// Export individual color groups for convenience
export const { white, background, surface, text, border, brand, status, badge, avatar } = PolarColors;

// Helper function to get status color with opacity
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
