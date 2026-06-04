"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Minimum time (ms) the loader stays visible before it can start fading out
const MIN_DISPLAY_TIME = 1500;
// Duration of the fade-out CSS transition (must match globals.css .loader-overlay transition)
const FADE_DURATION = 300;

export default function BrandLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  // 1. Listen for pathname or searchParams changes to trigger the minimum-display fade-out sequence
  useEffect(() => {
    let startTimeout: NodeJS.Timeout | undefined;
    let fadeTimeout: NodeJS.Timeout | undefined;
    let hideTimeout: NodeJS.Timeout | undefined;

    startTimeout = setTimeout(() => {
      // Keep loader active immediately on route/step change
      setVisible(true);
      setFade(false);

      // Snap window viewport back to top during route transitions
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // Wait at least MIN_DISPLAY_TIME before starting the fade
      fadeTimeout = setTimeout(() => {
        setFade(true);
        hideTimeout = setTimeout(() => {
          setVisible(false);
        }, FADE_DURATION);
      }, MIN_DISPLAY_TIME);
    }, 0);

    return () => {
      if (startTimeout) clearTimeout(startTimeout);
      if (fadeTimeout) clearTimeout(fadeTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [pathname, searchParams]);



  // 3. Intercept local anchor clicks to show the loader *before* navigation starts
  useEffect(() => {
    let failSafeTimeout: NodeJS.Timeout | undefined;

    const showNavigationLoader = () => {
      setVisible(true);
      setFade(false);

      if (failSafeTimeout) clearTimeout(failSafeTimeout);

      // Fail-safe: if route transition takes more than 8 seconds, automatically hide loader
      failSafeTimeout = setTimeout(() => {
        setFade(true);
        setTimeout(() => setVisible(false), FADE_DURATION);
      }, 8000);
    };

    const handleNavigationStart = () => {
      showNavigationLoader();
    };

    const handlePopState = () => {
      showNavigationLoader();
      window.location.reload();
    };

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
          const currentRoute = `${window.location.pathname}${window.location.search}`;
          let targetRoute = href.split("#")[0];
          try {
            const url = new URL(href, window.location.origin);
            targetRoute = `${url.pathname}${url.search}`;
          } catch {}

          // Ignore exact self-navigation to avoid getting stuck.
          // Query-string changes, such as /register?step=2, should still transition.
          if (targetRoute === currentRoute) {
            return;
          }

          showNavigationLoader();
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("naturalist:navigation-start", handleNavigationStart);
    document.addEventListener("click", handleAnchorClick);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("naturalist:navigation-start", handleNavigationStart);
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
