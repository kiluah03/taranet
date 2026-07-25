import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./portal.css";
import "./landing.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://taranet.nz"),
  title: { default: "TARA.NET — Fibre for Filipino families in New Zealand", template: "%s | TARA.NET" },
  description: "Fast, dependable New Zealand fibre made for Filipino families—to stay close to home and grow roots in Aotearoa.",
  openGraph: {
    title: "Stay close to home. Grow roots here.",
    description: "Family-ready fibre for Filipino whānau across New Zealand.",
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
