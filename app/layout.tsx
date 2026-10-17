import type { Metadata, Viewport } from "next";
import { Cinzel, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

const fontDisplay = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700"],
  preload: true,
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["500", "700"],
  preload: false, // Carregado sob demanda para economizar banda móvel inicial
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0b0d10",
};

export const metadata: Metadata = {
  title: {
    default: "Sanctum D&D 3.5 | Grimório & Escudo do Mestre",
    template: "%s | Sanctum D&D 3.5",
  },
  description:
    "Plataforma Dark Dungeon ultra-leve e responsiva para mesas de RPG Dungeons & Dragons 3.5 — Criação Guiada de Personagens, Fichas Interativas, Escudo do Mestre e 16 Aventuras Canônicas.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sanctum 3.5",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="min-h-[100dvh] bg-dungeon-abyss text-dungeon-parchment font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
