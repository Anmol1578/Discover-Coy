import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Coy: Discover & Crush Matching",
  description: "Find out if your crush likes you back. 100% private, mutual matches only.",
  icons: {
    icon: "/coy-wordmark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F6F4FA] text-[#15121D] min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
