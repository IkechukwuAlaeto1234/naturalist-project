"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Minimum time (ms) the loader stays visible before it can start fading out
const MIN_DISPLAY_TIME = 1500;
// Duration of the fade-out CSS transition (must match globals.css .loader-overlay transition)
const FADE_DURATION = 300;

export default function BrandLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  // 1. Listen for pathname changes to trigger the minimum-display fade-out sequence
  useEffect(() => {
    // Keep loader active immediately on route change
    setVisible(true);
    setFade(false);
    
    // Snap window viewport back to top during route transitions
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    // Wait at least MIN_DISPLAY_TIME before starting the fade
    const fadeTimeout = setTimeout(() => {
      setFade(true);
      const hideTimeout = setTimeout(() => {
        setVisible(false);
      }, FADE_DURATION);
      return () => clearTimeout(hideTimeout);
    }, MIN_DISPLAY_TIME);

    return () => clearTimeout(fadeTimeout);
  }, [pathname]);



  // 3. Intercept local anchor clicks to show the loader *before* navigation starts
  useEffect(() => {
    let failSafeTimeout: NodeJS.Timeout;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("#") &&
          anchor.target !== "_blank" &&
          !e.defaultPrevented
        ) {
          const currentPath = window.location.pathname;
          let targetPath = href.split("?")[0].split("#")[0];
          try {
            const url = new URL(href, window.location.origin);
            targetPath = url.pathname;
          } catch (err) {}

          // Ignore self-navigation to avoid getting stuck
          if (targetPath === currentPath) {
            return;
          }

          // Instantly show the loader to cover the screen before the page changes
          setVisible(true);
          setFade(false);

          // Clear any existing fail-safe
          if (failSafeTimeout) clearTimeout(failSafeTimeout);

          // Fail-safe: if route transition takes more than 8 seconds, automatically hide loader
          failSafeTimeout = setTimeout(() => {
            setFade(true);
            setTimeout(() => setVisible(false), FADE_DURATION);
          }, 8000);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
      if (failSafeTimeout) clearTimeout(failSafeTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`loader-overlay ${fade ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      id="global-loader"
    >
      <div className="loader-container animate-pulse">
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="loader-text font-sans">Loading...</div>
      </div>
    </div>
  );
}
