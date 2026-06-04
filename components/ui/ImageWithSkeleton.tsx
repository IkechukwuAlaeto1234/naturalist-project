"use client";

import React, { useState } from "react";

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export default function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  style,
  onLoad,
  onError,
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className="relative overflow-hidden" style={style}>
      {/* Shimmer skeleton - shown until image loads */}
      {!loaded && !errored && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-[#0c100e] via-[#1a241e]/60 to-[#0c100e] animate-shimmer ${skeletonClassName}`}
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite linear",
          }}
        />
      )}
      {/* Actual image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        onLoad={() => { setLoaded(true); onLoad?.(); }}
        onError={() => { setErrored(true); onError?.(); }}
        style={style}
      />
      {/* Error fallback */}
      {errored && (
        <div className={`absolute inset-0 flex items-center justify-center bg-[#0c100e] ${skeletonClassName}`}>
          <span className="text-[#4a5c50] text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
