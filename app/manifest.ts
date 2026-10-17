import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dragões & Masmorras — Grimório & Escudo D&D 3.5",
    short_name: "Dragões & Masmorras",
    description:
      "Plataforma leve e responsiva para mesas de RPG Dragões & Masmorras (D&D 3.5)",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#d97706",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/d20-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
