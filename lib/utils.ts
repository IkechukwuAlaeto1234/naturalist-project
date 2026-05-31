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
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
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
