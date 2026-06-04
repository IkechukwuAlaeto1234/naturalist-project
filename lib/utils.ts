import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as USD currency
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Formats a date into a human-readable format
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Generates a random alphanumeric OTP code of a specific length
 */
export function generateOTP(length: number = 4): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
}

/**
 * Proxy absolute Cloudinary URLs to our /cdn path
 */
export function proxyCloudinaryUrl(url: string | undefined): string {
  if (!url) return "";
  // Check if the URL is from Cloudinary
  if (url.includes("res.cloudinary.com")) {
    const parts = url.split("res.cloudinary.com/");
    if (parts.length > 1) {
      // split the cloud_name and remaining path
      const pathParts = parts[1].split("/");
      // pathParts[0] is cloud_name, remaining is path
      const remainingPath = pathParts.slice(1).join("/");
      return `/cdn/${remainingPath}`;
    }
  }
  return url;
}

/**
 * Helper to safely extract the first validation error message from Zod field errors
 */
export function getFirstValidationError(fieldErrors: Record<string, string[] | undefined>): string {
  const errors = Object.values(fieldErrors);
  const firstErrorList = errors[0];
  if (Array.isArray(firstErrorList) && firstErrorList.length > 0) {
    return firstErrorList[0] || "";
  }
  return "";
}

/**
 * Parses user agent string to identify browser, OS, and device type
 */
export function parseUserAgent(ua: string) {
  let browser = "Other";
  let os = "Other";
  let deviceType = "Desktop";

  const uaLower = ua.toLowerCase();

  // Parse OS
  if (uaLower.includes("windows")) os = "Windows";
  else if (uaLower.includes("macintosh") || uaLower.includes("mac os")) os = "macOS";
  else if (uaLower.includes("iphone") || uaLower.includes("ipad")) {
    os = "iOS";
    deviceType = "Mobile";
  }
  else if (uaLower.includes("android")) {
    os = "Android";
    deviceType = "Mobile";
  }
  else if (uaLower.includes("linux")) os = "Linux";

  // Parse Browser
  if (uaLower.includes("chrome") || uaLower.includes("crios")) browser = "Chrome";
  else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari";
  else if (uaLower.includes("firefox")) browser = "Firefox";
  else if (uaLower.includes("edg")) browser = "Edge";

  return { browser, os, deviceType };
}
