import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import OneSignalInit from "@/components/OneSignalInit";

export const metadata: Metadata = {
  title: {
    default: "Učilište Maestro",
    template: "%s | Učilište Maestro",
  },

  description:
    "Aplikacija Učilišta Maestro za polaznike, profesore i administraciju.",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],

    shortcut: [
      {
        url: "/icon-192.png",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "Učilište Maestro",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17324d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body>
        <OneSignalInit />

        {children}
      </body>
    </html>
  );
}