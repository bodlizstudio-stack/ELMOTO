import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";
import { PageTransition } from "@/components/page-transition";
import { site, siteUrl } from "@/lib/site";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0D10",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${site.brand} | Prodaja in najem motornih koles`,
    template: `%s | ${site.brand}`,
  },
  description:
    "Prodaja in najem motornih koles v Trzinu. EL-MOTO, Špruha 33. Zanesljivi motorji. Brezskrbna vožnja.",
  applicationName: site.brand,
  openGraph: {
    type: "website",
    locale: "sl_SI",
    siteName: site.brand,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className={`${inter.variable} ${barlow.variable} h-full`}>
      <body className="min-h-full bg-ink text-white antialiased">
        <a className="skip-link" href="#vsebina">
          Preskoči na vsebino
        </a>
        {children}
        <Suspense fallback={null}>
          <PageTransition />
        </Suspense>
      </body>
    </html>
  );
}
