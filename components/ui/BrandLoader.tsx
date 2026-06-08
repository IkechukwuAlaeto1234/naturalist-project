"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MIN_DISPLAY_TIME = 1000;
const FADE_DURATION = 300;

// Inner component that safely reads searchParams — must be inside <Suspense>
function BrandLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  const isInitialMount = useRef(true);
  const navigationStartTimeRef = useRef<number>(Date.now());
  const fadeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const failSafeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const showNavigationLoader = () => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);

    setVisible(true);
    setFade(false);
    navigationStartTimeRef.current = Date.now();

    failSafeTimeoutRef.current = setTimeout(() => {
      setFade(true);
      hideTimeoutRef.current = setTimeout(() => setVisible(false), FADE_DURATION);
    }, 10000);
  };

  useEffect(() => {
    if (!visible) return;

    if (failSafeTimeoutRef.current) clearTimeout(failSafeTimeoutRef.current);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    const elapsed = Date.now() - navigationStartTimeRef.current;
    const remaining = Math.max(MIN_DISPLAY_TIME - elapsed, 0);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    fadeTimeoutRef.current = setTimeout(() => {
      setFade(true);
      hideTimeoutRef.current = setTimeout(() => setVisible(false), FADE_DURATION);
    }, remaining);

    isInitialMount.current = false;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleNavigationStart = () => setTimeout(() => showNavigationLoader(), 0);
    const handlePopState = () => setTimeout(() => showNavigationLoader(), 0);

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

          if (targetRoute === currentRoute) return;
          setTimeout(() => showNavigationLoader(), 0);
        }
      }
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const patchHistory = (url: string | URL | null | undefined) => {
      if (!url) return;
      const href = url.toString();
      if (href.startsWith("/") || href.startsWith(window.location.origin)) {
        const currentPath = window.location.pathname;
        try {
          const targetUrl = new URL(href, window.location.origin);
          if (targetUrl.pathname === currentPath && targetUrl.hash && !targetUrl.search) return;
        } catch {}
        setTimeout(() => showNavigationLoader(), 0);
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

// Outer shell — owns the Suspense boundary so useSearchParams is always safe
export default function BrandLoader() {
  return (
    <React.Suspense fallback={null}>
      <BrandLoaderInner />
    </React.Suspense>
  );
}
