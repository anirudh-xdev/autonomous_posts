import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        canvas: '#05070B',
        surface: {
          DEFAULT: '#090D16',
          elevated: '#0F1624',
          sunken: '#030508',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        hairline: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.04)',
          strong: 'rgba(255, 255, 255, 0.16)',
        },
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
      boxShadow: {
        specular: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
        'specular-strong': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.22)',
        'glow-emerald': '0 0 50px -10px rgba(16, 185, 129, 0.3)',
        'glow-cyan': '0 0 50px -10px rgba(6, 182, 212, 0.3)',
        'glow-purple': '0 0 50px -10px rgba(168, 85, 247, 0.25)',
      },
      transitionTimingFunction: {
        fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
