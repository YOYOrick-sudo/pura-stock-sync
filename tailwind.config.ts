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
        // === PURA VIDA ENTERPRISE DESIGN SYSTEM ===
        'pv': {
          // Backgrounds (Slate)
          'bg': {
            'page': 'hsl(210 20% 98%)',      // #F9FAFB - Gray-50
            'card': 'hsl(0 0% 100%)',         // #FFFFFF
            'muted': 'hsl(210 40% 96%)',      // #F1F5F9 - Slate-100
            'hover': 'hsl(214 32% 91%)',      // #E2E8F0 - Slate-200
          },
          // Brand Teal (Pura Vida)
          'sea': 'hsl(163 65% 26%)',           // #1B7867
          'sea-dark': 'hsl(163 65% 22%)',      // #156556
          'sea-light': 'hsl(166 35% 96%)',     // #EFFAF7
          'sea-border': 'hsl(163 40% 80%)',    // #B3D9D4
          // Text Colors (Slate)
          'text': {
            'primary': 'hsl(221 39% 11%)',    // #111827
            'secondary': 'hsl(215 16% 47%)',  // #64748B - Slate-500
            'muted': 'hsl(215 20% 65%)',      // #94A3B8 - Slate-400
          },
          // Status Colors
          'success': 'hsl(160 84% 39%)',       // #0D9488 - Teal-600
          'warning': 'hsl(38 92% 50%)',        // #F59E0B
          'error': 'hsl(0 72% 51%)',           // #DC2626
          'info': 'hsl(217 91% 60%)',          // #3B82F6
        },
        
        // Shadcn semantic tokens
        border: {
          DEFAULT: "hsl(var(--border))",
          state: "hsl(var(--border-state))",
          // Semantic border colors for interactive states
          subtle: "hsl(var(--primary) / 0.1)",   // Subtle brand hint
          accent: "hsl(var(--primary) / 0.2)",   // Active/focus states
          strong: "hsl(var(--primary) / 0.3)",   // Hover states
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
          bg: "hsl(var(--status-error-bg))",
          border: "hsl(var(--status-error-border))",
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
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          bg: "hsl(var(--status-warning-bg))",
          border: "hsl(var(--status-warning-border))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          bg: "hsl(var(--status-success-bg))",
          border: "hsl(var(--status-success-border))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          bg: "hsl(var(--status-info-bg))",
          border: "hsl(var(--status-info-border))",
        },
        notification: {
          badge: "hsl(var(--notification-badge))",
        },
        sidebar: {
          bg: "hsl(var(--sidebar-bg))",
          active: "hsl(var(--sidebar-active))",
          hover: "hsl(var(--sidebar-hover))",
        },
      },
      boxShadow: {
        // Use Tailwind defaults (shadow-sm, shadow-md, shadow-lg) for most cases
        // Only keep soft for backward compat during migration
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      borderRadius: {
        // 3-tier system: sm (8px), md (12px), lg (16px)
        lg: '16px',
        md: 'var(--radius)',              /* 12px */
        sm: 'calc(var(--radius) - 4px)',  /* 8px */
        // Keep polar aliases during migration
        'polar-sm': '8px',
        'polar-md': '12px',
        'polar-lg': '16px',
      },
      // Transition duration standards
      transitionDuration: {
        'fast': '150ms',      // Hovers, micro-interactions
        'DEFAULT': '200ms',   // Standard UI changes
        'slow': '300ms',      // Larger animations
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
