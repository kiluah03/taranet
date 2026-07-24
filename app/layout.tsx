import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://taranet.nz"),
  title: { default: "TARA.NET — Fibre that feels like home", template: "%s | TARA.NET" },
  description: "Ultra-fast New Zealand fibre for KiwiNoys, backed by local 24/7 support.",
  openGraph: {
    title: "TARA.NET — Fibre that feels like home",
    description: "The first Filipino internet provider in New Zealand.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
