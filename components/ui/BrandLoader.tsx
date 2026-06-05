"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Minimum time (ms) the loader stays visible from start of navigation/mount
const MIN_DISPLAY_TIME = 1000;
// Duration of the fade-out CSS transition (must match globals.css .loader-overlay transition)
const FADE_DURATION = 300;

export default function BrandLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Start visible=true so the very first page load is covered before React hydrates
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);
  
  const isInitialMount = useRef(true);
  const navigationStartTimeRef = useRef<number>(Date.now());
  const fadeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const failSafeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const showNavigationLoader = () => {
    // Clear any pending fade-out timers
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);

    // Show loader
    setVisible(true);
    setFade(false);
    navigationStartTimeRef.current = Date.now();

    // Fail-safe: if transition takes more than 10 seconds, automatically hide loader
    failSafeTimeoutRef.current = setTimeout(() => {
      setFade(true);
      hideTimeoutRef.current = setTimeout(() => setVisible(false), FADE_DURATION);
    }, 10000);
  };

  // 1. Listen for pathname or searchParams changes to trigger the minimum-display fade-out sequence
  useEffect(() => {
    // If loader is not active, do nothing
    if (!visible) return;

    if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    const elapsed = Date.now() - navigationStartTimeRef.current;
    const remaining = Math.max(MIN_DISPLAY_TIME - elapsed, 0);

    // Snap window viewport back to top during route transitions
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    fadeTimeoutRef.current = setTimeout(() => {
      setFade(true);
      hideTimeoutRef.current = setTimeout(() => setVisible(false), FADE_DURATION);
    }, remaining);

    isInitialMount.current = false;
  }, [pathname, searchParams]);

  // 2. Intercept navigation starts using events, history monkeypatching, and capturing phase click listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleNavigationStart = () => {
      setTimeout(() => showNavigationLoader(), 0);
    };

    const handlePopState = () => {
      setTimeout(() => showNavigationLoader(), 0);
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        const download = anchor.getAttribute("download");
        const targetAttr = anchor.getAttribute("target");
        
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("#") &&
          targetAttr !== "_blank" &&
          download === null
        ) {
          const currentRoute = `${window.location.pathname}${window.location.search}`;
          let targetRoute = href.split("#")[0];
          try {
            const url = new URL(href, window.location.origin);
            targetRoute = `${url.pathname}${url.search}`;
          } catch {}

          if (targetRoute === currentRoute) {
            return;
          }

          setTimeout(() => showNavigationLoader(), 0);
        }
      }
    };

    // Monkeypatch pushState and replaceState to catch programmatic router.push/replace
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const patchHistory = (url: string | URL | null | undefined) => {
      if (!url) return;
      const href = url.toString();
      
      if (href.startsWith("/") || href.startsWith(window.location.origin)) {
        const currentPath = window.location.pathname;
        try {
          const targetUrl = new URL(href, window.location.origin);
          // Only show loader if pathname or search params change, ignore hash-only changes
          if (targetUrl.pathname === currentPath && targetUrl.hash && !targetUrl.search) {
            return;
          }
        } catch {}
        
        // Defer execution to avoid "useInsertionEffect must not schedule updates"
        setTimeout(() => {
          showNavigationLoader();
        }, 0);
      }
    };

    window.history.pushState = function (...args) {
      patchHistory(args[2]);
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      patchHistory(args[2]);
      return originalReplaceState.apply(this, args);
    };

    // Use capturing phase (true) for anchor clicks to intercept BEFORE Next.js handler updates URL
    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("naturalist:navigation-start", handleNavigationStart);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("naturalist:navigation-start", handleNavigationStart);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
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
