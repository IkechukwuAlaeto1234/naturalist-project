import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host-grotesk",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Naturalist | Premium Organic Skincare & Wellness",
  description: "Experience premium, sustainable organic skincare crafted with precision. Empowering your natural glow while protecting our planet.",
  keywords: "organic skincare, natural beauty, eco-friendly cosmetics, premium wellness, vegan beauty",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    title: "Naturalist | Premium Organic Skincare & Wellness",
    description: "Premium, sustainable organic skincare crafted with precision.",
    type: "website",
    siteName: "Naturalist",
  },
};

import React from "react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import BackToTop from "../components/ui/BackToTop";
import CookieConsent from "../components/ui/CookieConsent";
import BrandLoader from "../components/ui/BrandLoader";
import { Providers } from "../components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hostGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons&display=block" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          <BrandLoader />
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
          <BackToTop />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
