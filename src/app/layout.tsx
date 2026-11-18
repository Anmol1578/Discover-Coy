import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Spark | Discover & Matches",
  description: "A private swipe-based discover and match app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0D0D0F] text-neutral-100 min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
