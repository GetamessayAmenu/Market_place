import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* ── Colors ──────────────────────────────────────────── */
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        /* Brand palette */
        brand: {
          gold: {
            DEFAULT: 'hsl(var(--brand-gold))',
            foreground: 'hsl(var(--brand-gold-foreground))',
          },
          green: {
            DEFAULT: 'hsl(var(--brand-green))',
            foreground: 'hsl(var(--brand-green-foreground))',
          },
          terra: {
            DEFAULT: 'hsl(var(--brand-terra))',
            foreground: 'hsl(var(--brand-terra-foreground))',
          },
          wine: {
            DEFAULT: 'hsl(var(--brand-wine))',
            foreground: 'hsl(var(--brand-wine-foreground))',
          },
          ivory: {
            DEFAULT: 'hsl(var(--brand-ivory))',
            foreground: 'hsl(var(--brand-ivory-foreground))',
          },
        },
        /* Marketplace action colors */
        action: {
          buy: {
            DEFAULT: 'hsl(var(--buy))',
            foreground: 'hsl(var(--buy-foreground))',
          },
          rent: {
            DEFAULT: 'hsl(var(--rent))',
            foreground: 'hsl(var(--rent-foreground))',
          },
          custom: {
            DEFAULT: 'hsl(var(--custom))',
            foreground: 'hsl(var(--custom-foreground))',
          },
        },
      },

      /* ── Border Radius ───────────────────────────────────── */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: 'var(--radius-xs)',
        full: 'var(--radius-full)',
      },

      /* ── Typography ──────────────────────────────────────── */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        amharic: ['Noto Sans Ethiopic', 'Nyala', 'sans-serif'],
      },

      /* ── Shadows (warm-tinted) ───────────────────────────── */
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },

      /* ── Z-index ─────────────────────────────────────────── */
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
  plugins: [],
};

export default config;
