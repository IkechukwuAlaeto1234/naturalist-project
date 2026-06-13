import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
import "./globals.css";
import ClientLayout from "../components/layout/ClientLayout";
import Script from "next/script";

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host-grotesk",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Naturalist | Premium Organic Skincare & Wellness",
  description:
    "Experience premium, sustainable organic skincare crafted with precision. Empowering your natural glow while protecting our planet.",
  keywords:
    "organic skincare, natural beauty, eco-friendly cosmetics, premium wellness, vegan beauty",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    title: "Naturalist | Premium Organic Skincare & Wellness",
    description:
      "Premium, sustainable organic skincare crafted with precision.",
    type: "website",
    siteName: "Naturalist",
  },
};

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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons&display=block"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        {/* Material Symbols font-load guard: adds icons-loading before first paint.
            suppressHydrationWarning on <body> silences the React mismatch warning
            caused by this script toggling the class before hydration. */}
        <Script
          id="icons-load-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){document.body.classList.add('icons-loading');document.fonts.ready.then(function(){document.body.classList.remove('icons-loading');});setTimeout(function(){document.body.classList.remove('icons-loading');},3000);})()`,
          }}
        />
        {/* ClientLayout owns all interactive chrome (providers, navbar, footer,
            BrandLoader). It is a "use client" component so ssr:false works inside it. */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
