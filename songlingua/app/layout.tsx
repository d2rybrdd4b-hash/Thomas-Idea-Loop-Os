import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SongLingua",
  description: "Englisch lernen mit deinen Spotify-Songs.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SongLingua",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-surface text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
