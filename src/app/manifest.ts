import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Učilište Maestro",
    short_name: "Maestro",
    description:
      "Aplikacija Učilišta Maestro za polaznike, profesore i administraciju.",

    start_url: "/login",
    scope: "/",

    display: "standalone",

    background_color: "#f4f6f8",
    theme_color: "#17324d",

    orientation: "portrait",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}