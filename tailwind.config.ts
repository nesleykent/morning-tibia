import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      screens: {
        /**
         * Where the dispatch and the take-away rail can sit side by side.
         *
         * Not `lg` (1024px): the browser people actually use this in is docked beside the
         * Tibia client at roughly 860–1000px, and at `lg` that whole range fell back to one
         * column — which put the briefing below a two-screen document. 960px is the width
         * at which a 620px prose column and a 300px rail both still work.
         */
        rail: "960px",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // The light system, named as the design names it.
        canvas: {
          DEFAULT: "hsl(var(--canvas))",
          deep: "hsl(var(--canvas-deep))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
          sunken: "hsl(var(--sunken))",
        },
        line: {
          DEFAULT: "hsl(var(--line))",
          soft: "hsl(var(--line-soft))",
          strong: "hsl(var(--line-strong))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          soft: "hsl(var(--ink-soft))",
          faint: "hsl(var(--ink-faint))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          bright: "hsl(var(--gold-bright))",
          tint: "hsl(var(--gold-tint))",
          line: "hsl(var(--gold-line))",
          foreground: "hsl(var(--gold-foreground))",
        },
        live: {
          DEFAULT: "hsl(var(--live))",
          tint: "hsl(var(--live-tint))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          tint: "hsl(var(--danger-tint))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // Warm and shallow: on a cream field, a grey shadow reads as dirt.
        card: "0 1px 2px hsl(30 25% 25% / 0.05)",
        raised: "0 1px 2px hsl(30 25% 25% / 0.05), 0 8px 24px -18px hsl(30 30% 20% / 0.28)",
        elevated:
          "0 10px 30px -12px hsl(30 30% 18% / 0.22), 0 2px 8px -3px hsl(30 30% 18% / 0.12)",
        gold: "0 1px 2px hsl(36 60% 25% / 0.18), 0 6px 16px -8px hsl(36 80% 40% / 0.45)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
