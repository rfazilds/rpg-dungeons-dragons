import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sanctum D&D 3.5 — Grimório & Escudo do Mestre",
    short_name: "Sanctum 3.5",
    description:
      "Plataforma leve e responsiva para mesas de RPG Dungeons & Dragons 3.5",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#d97706",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
