import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Cinzel", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        dungeon: {
          abyss: "#0b0d10",      // Fundo principal (abismo/cripta)
          stone: "#12161c",      // Camada de superfície primária (pedra úmida)
          slate: "#1a202c",      // Camada elevada / cards / modais
          border: "#292524",     // Contorno de pedra lapidada (stone-800)
          muted: "#94a3b8",      // Texto secundário / inscrições antigas
          parchment: "#f1f5f9",  // Texto de alto contraste (cinza-gelo / branco fosco)
        },
        torch: {
          DEFAULT: "#d97706",    // Ouro envelhecido / Âmbar primário (amber-600)
          bright: "#f59e0b",     // Chama viva para hover e foco (amber-500)
          glow: "#fbbf24",       // Brilho rúnico (amber-400)
          ember: "#78350f",      // Brasa profunda para fundos sutis
        },
        arcane: {
          DEFAULT: "#06b6d4",    // Ciano etéreo para magias e slots arcanos
          bright: "#38bdf8",     // Azul astral para foco mágico
          deep: "#083344",       // Fundo de círculo de magia
        },
        crimson: {
          DEFAULT: "#dc2626",    // Carmesim para dano e alertas de combate
          soft: "#ef4444",       // Indicador de PV crítico
          blood: "#450a0a",      // Fundo sutil de ferimento
        },
        vital: {
          DEFAULT: "#10b981",    // Esmeralda para cura, PV cheio e sucessos (d20 natural)
          deep: "#064e3b",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "dungeon-card":
          "0 10px 30px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        "torch-glow":
          "0 0 20px -3px rgba(217, 119, 6, 0.35), inset 0 1px 0 0 rgba(251, 191, 36, 0.25)",
        "arcane-glow":
          "0 0 20px -3px rgba(6, 182, 212, 0.35), inset 0 1px 0 0 rgba(56, 189, 248, 0.25)",
        "inner-carved": "inset 0 2px 6px 0 rgba(0, 0, 0, 0.75)",
      },
      backgroundImage: {
        "dungeon-radial":
          "radial-gradient(ellipse at top, rgba(217, 119, 6, 0.08), rgba(18, 22, 28, 0.95) 65%, #0b0d10 100%)",
        "runic-border":
          "linear-gradient(90deg, transparent, rgba(217, 119, 6, 0.45), transparent)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
