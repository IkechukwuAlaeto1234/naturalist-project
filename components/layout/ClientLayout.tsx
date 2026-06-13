"use client";

import React, { useState, useEffect } from "react";
import { Providers } from "@/components/providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import CookieConsent from "@/components/ui/CookieConsent";
import BrandLoader from "@/components/ui/BrandLoader";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import OfflineOverlay from "@/components/ui/OfflineOverlay";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
        document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <Providers>
      {mounted && <BrandLoader />}
      {mounted && <OfflineOverlay />}
      {mounted && <div className="ambient-glow-follower hidden md:block" />}
      <Navbar />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
      <BackToTop />
      <CookieConsent />
    </Providers>
  );
}
