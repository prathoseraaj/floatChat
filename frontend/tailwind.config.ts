import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          glow: "hsl(var(--primary-glow) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          hover: "hsl(var(--secondary-hover) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          hover: "hsl(var(--accent-hover) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        chat: {
          bg: "var(--chat-bg)",
          user: "var(--chat-user)",
          ai: "var(--chat-ai)",
        },
        dashboard: {
          bg: "var(--dashboard-bg)",
        },
        code: {
          bg: "var(--code-bg)",
          text: "var(--code-text)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
      },
      backgroundImage: {
        "gradient-ocean": "var(--gradient-ocean)",
        "gradient-wave": "var(--gradient-wave)",
        "gradient-depth": "var(--gradient-depth)",
        "gradient-sunset": "var(--gradient-sunset)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
      },
      transitionProperty: {
        base: "var(--transition-base)",
        smooth: "var(--transition-smooth)",
      },
      borderRadius: {
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
        wave: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%": { transform: "translateY(-10px) rotate(-3deg)" },
          "66%": { transform: "translateY(5px) rotate(3deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        wave: "wave 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;