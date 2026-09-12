import type { Metadata, Viewport } from "next";
import "./globals.css";
import OneSignalInit from "@/components/OneSignalInit";

export const metadata: Metadata = {
  title: {
    default: "Učilište Maestro",
    template: "%s | Učilište Maestro",
  },

  description:
    "Aplikacija Učilišta Maestro za polaznike i profesore.",

  applicationName: "Učilište Maestro",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: "/icon.svg",
  },

  appleWebApp: {
    capable: true,
    title: "Maestro",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
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