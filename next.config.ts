import type { NextConfig } from "next";

// ── Content Security Policy ──────────────────────────────────────────────────
// A strict CSP that allows Google Fonts, Cloudinary images, and self-hosted
// assets. Inline styles are blocked except for those needed by Next.js itself.
// Inline scripts are blocked — all JS must be bundled and served from /self.
const isDev = process.env.NODE_ENV === "development";
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' ${isDev ? "'unsafe-inline'" : ""};
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com;
  connect-src 'self' https://api.cloudinary.com ${isDev ? "ws: wss: *" : ""};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  media-src 'self';
  worker-src 'self' blob:;
`.replace(/\s{2,}/g, " ").trim();// ── Security Headers ─────────────────────────────────────────────────────────
// Applied to every response. Prevents clickjacking, MIME sniffing, XSS etc.
const securityHeaders = [
  // Prevents page from being loaded in an iframe — stops clickjacking attacks
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Prevents browsers from guessing content types — mitigates MIME-sniffing attacks
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controls how much referrer info is sent with requests
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Enables browser XSS filter (legacy, but still useful for older browsers)
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Forces HTTPS for 2 years, including subdomains — submitted for preloading
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Restricts access to browser features — deny all we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // The Content Security Policy itself
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  // Hide the X-Powered-By: Next.js header — reduces information disclosure
  poweredByHeader: false,

  // Disable source maps in production builds — prevents source code exposure
  productionBrowserSourceMaps: false,

  serverExternalPackages: ["country-state-city"],

  async headers() {
    return [
      {
        // Apply security headers to ALL routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/cdn/:path*",
        destination: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || "dtpwhaxvh"}/:path*`,
      },
    ];
  },

  images: {
    // Only allow images from our own CDN and Cloudinary.
    // External images pasted by the admin are re-uploaded to Cloudinary first
    // (via /api/admin/content/upload-url) so they always come from here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        // Cloudinary "fetch" delivery type — used when uploading from external URLs
        protocol: "https",
        hostname: "fetch.cloudinary.com",
      },
      {
        // Allow localhost images during development
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
