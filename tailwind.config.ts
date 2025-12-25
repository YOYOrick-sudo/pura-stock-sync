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
      },
      colors: {
        // === PURA VIDA MODERN DESIGN SYSTEM ===
        'pv': {
          // Backgrounds (Modern Slate)
          'bg': {
            'page': 'hsl(210 40% 98%)',      // #F8FAFC - Main page background
            'card': 'hsl(0 0% 100%)',         // #FFFFFF - Cards & surfaces
            'muted': 'hsl(210 40% 96%)',      // #F1F5F9 - Secondary areas
            'hover': 'hsl(210 31% 91%)',      // #E2E8F0 - Hover states
          },
          // Brand Green (Pura Vida Sea)
          'sea': 'hsl(163 65% 26%)',           // #1B7867 - Primary
          'sea-dark': 'hsl(163 65% 21%)',      // #156556 - Hover/active
          'sea-light': 'hsl(163 35% 93%)',     // #E6F4F1 - Subtle backgrounds
          'sea-border': 'hsl(169 35% 77%)',    // #B3D9D4 - Subtle borders
          // Text Colors
          'text': {
            'primary': 'hsl(222 47% 11%)',    // #0F172A - Slate-900
            'secondary': 'hsl(215 16% 47%)',  // #64748B - Slate-500
            'muted': 'hsl(215 20% 65%)',      // #94A3B8 - Slate-400
          },
          // Status Colors
          'success': 'hsl(156 60% 35%)',       // Teal-groen mix, dichter bij brand
          'warning': 'hsl(38 92% 50%)',        // #F59E0B
          'error': 'hsl(0 84% 60%)',           // #EF4444
          'info': 'hsl(217 91% 60%)',          // #3B82F6
        },
        
        // Shadcn semantic tokens
        border: {
          DEFAULT: "hsl(var(--border))",
          state: "hsl(var(--border-state))",
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
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px 0 rgb(0 0 0 / 0.02)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'hover': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        // Polar UI radius system
        'polar-sm': '8px',
        'polar-md': '12px',
        'polar-lg': '16px',
        'polar-xl': '20px',
        'polar-2xl': '24px',
        // Shadcn defaults (mapped to polar)
        'xl': '16px',
        '2xl': '20px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
