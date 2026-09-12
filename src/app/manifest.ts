import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Učilište Maestro",
    short_name: "Maestro",
    description:
      "Raspored, obavijesti i informacije za polaznike i profesore Učilišta Maestro.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#dc2626",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}