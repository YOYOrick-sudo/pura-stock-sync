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
      borderWidth: {
        '1.5': '1.5px',
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Instrument Sans", "Inter", "sans-serif"],
        mono: ["Geist Mono", "SF Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // === PURA VIDA OS v6.0 - SUNSET ORANGE ===
        'pv': {
          // Primary Orange Scale
          'primary': {
            '50': '#FFF7ED',
            '100': '#FFEDD5',
            '200': '#FED7AA',
            '300': '#FDBA74',
            '400': '#FB923C',
            '500': '#E27726',
            '600': '#C9630E',
            '700': '#A5500D',
            DEFAULT: '#E27726',
          },
          // Midnight Slate Gray Scale
          'gray': {
            '50': '#F8F9FA',
            '75': '#F1F3F5',
            '100': '#EAECF0',
            '200': '#C1C5CF',
            '300': '#9DA3AF',
            '400': '#636878',
            '500': '#4A4F5C',
            '600': '#363B48',
            '700': '#2F3440',
            '800': '#282E3A',
            '900': '#1A1F28',
            '950': '#0F1318',
          },
          // Backgrounds
          'bg': {
            'page': 'hsl(210 17% 98%)',
            'card': 'hsl(0 0% 100%)',
            'muted': 'hsl(210 20% 96%)',
            'hover': 'hsl(220 13% 91%)',
          },
          // Text Colors
          'text': {
            'primary': 'hsl(218 33% 18%)',
            'secondary': 'hsl(222 10% 44%)',
            'muted': 'hsl(220 10% 60%)',
          },
          // Status Colors
          'success': 'hsl(156 60% 35%)',
          'warning': 'hsl(38 92% 50%)',
          'error': 'hsl(0 84% 60%)',
          'info': 'hsl(217 91% 60%)',
        },
        
        // Shadcn semantic tokens
        border: {
          DEFAULT: "hsl(var(--border))",
          state: "hsl(var(--border-state))",
          subtle: "hsl(var(--primary) / 0.1)",
          accent: "hsl(var(--primary) / 0.2)",
          strong: "hsl(var(--primary) / 0.3)",
        },
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
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.04), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'hover': '0 8px 16px -4px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
      },
      borderRadius: {
        // Polar UI radius system (v6.0)
        'polar-sm': '12px',
        'polar-md': '14px',
        'polar-lg': '16px',
        'polar-xl': '20px',
        'polar-2xl': '24px',
        // Shadcn defaults
        'xl': '16px',
        '2xl': '20px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '200ms',
        'slow': '300ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
