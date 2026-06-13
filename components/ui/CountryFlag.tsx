"use client";

import React from "react";

// Maps currency codes to country codes for flag display
export const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "us",
  NGN: "ng",
  GBP: "gb",
  EUR: "eu", // flag-icon-css supports EU flag
  CAD: "ca",
  GHS: "gh",
  ZAR: "za",
};

interface CountryFlagProps {
  countryCode: string;
  size?: number; // Size in pixels
  className?: string;
}

export function CountryFlag({
  countryCode,
  size = 20,
  className = "",
}: CountryFlagProps) {
  const cc = countryCode.toLowerCase();
  
  // Use public cdnjs library for flag icon SVGs
  const src = `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/${cc}.svg`;

  return (
    <img
      src={src}
      alt={countryCode}
      style={{ width: size, height: size * 0.75 }}
      className={`inline-block object-cover rounded-sm align-middle ${className}`}
      loading="lazy"
    />
  );
}
