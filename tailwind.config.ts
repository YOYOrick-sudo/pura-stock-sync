import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        // Legacy polar colors (keep for backward compatibility)
        'polar-white': '#FFFFFF',
        'polar-background': '#F4F5F6',
        'polar-surface': '#FAFAFA',
        'polar-text-primary': '#17171C',
        'polar-text-secondary': '#36373A',
        'polar-text-tertiary': '#73747B',
        'polar-border': '#ECEDED',
        'polar-brand': '#1B7867',
        'polar-brand-hover': '#156556',
        'polar-brand-light': '#E6F4F1',
        
        // Pura Vida Design System - Hybrid Style
        'pv': {
          'background': 'hsl(210 20% 98%)',      // slate-50 - page background
          'surface': 'hsl(0 0% 100%)',            // white - card surfaces
          'border': 'hsl(169 35% 77%)',           // #B3D9D4 - subtle green border
          'border-hover': 'hsl(163 65% 26%)',     // #1B7867 - hover state
          'primary': 'hsl(163 65% 26%)',          // #1B7867 - Pura Vida Sea
          'primary-hover': 'hsl(163 65% 21%)',    // #156556 - darker sea
          'primary-light': 'hsl(163 35% 93%)',    // #E6F4F1 - light accent
          'success': 'hsl(142 71% 45%)',          // green
          'warning': 'hsl(38 92% 50%)',           // amber
          'error': 'hsl(0 84% 60%)',              // red
          'muted': 'hsl(215 16% 47%)',            // slate-500
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        notification: {
          badge: "hsl(var(--notification-badge))",
        },
      },
      spacing: {
        'polar-1': '4px',
        'polar-2': '8px',
        'polar-3': '12px',
        'polar-4': '16px',
        'polar-6': '24px',
        'polar-8': '32px',
        'polar-12': '48px',
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        hover: "var(--shadow-hover)",
      },
      borderRadius: {
        'polar-sm': '8px',
        'polar-lg': '16px',
        'polar-xl': '20px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-up": {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "0.4" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "check-pulse": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "ripple": "ripple 0.4s ease-out forwards",
        "check-pulse": "check-pulse 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
