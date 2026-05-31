"use client";

import { useEffect } from "react";

export default function NotFoundTitleSetter() {
  useEffect(() => {
    // Set document title with a 100ms timeout to ensure it triggers after Next.js layout metadata is applied
    const titleTimeout = setTimeout(() => {
      document.title = "Page Not Found | Naturalist";
    }, 100);
    return () => clearTimeout(titleTimeout);
  }, []);

  return null;
}
