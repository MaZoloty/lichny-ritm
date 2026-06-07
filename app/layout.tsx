import type { Metadata, Viewport } from "next";
import "./globals.css";

// Округлый дружелюбный шрифт с полной кириллицей — задаёт мягкий wellness-тон.
export const metadata: Metadata = {
  title: "Личный ритм",
  description:
    "Мягкая личная система: привычки, финансы, накопления, цели — маленькими шагами.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Личный ритм",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
