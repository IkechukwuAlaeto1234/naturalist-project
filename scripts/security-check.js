#!/usr/bin/env node
/**
 * security-check.js
 * Pre-deployment security scanner for the Naturalist project.
 *
 * Checks for:
 *   1. No .env files accidentally included in the build output
 *   2. Source maps are disabled in next.config.ts
 *   3. No obviously hardcoded secrets in source files
 *   4. Required security headers are configured in next.config.ts
 *   5. Critical environment variables are documented in .env.example
 *
 * Run with: node scripts/security-check.js
 * Or add to package.json: "security-check": "node scripts/security-check.js"
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const warnings = [];

function ok(message) {
  console.log(`  \x1b[32m✓\x1b[0m  ${message}`);
  passed++;
}

function fail(message) {
  console.log(`  \x1b[31m✗\x1b[0m  ${message}`);
  failed++;
}

function warn(message) {
  console.log(`  \x1b[33m⚠\x1b[0m  ${message}`);
  warnings.push(message);
}

function readFile(relPath) {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), "utf8");
  } catch {
    return null;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

console.log("\n\x1b[1m🔒 Naturalist Security Check\x1b[0m\n");

// ── CHECK 1: No .env files in build output ─────────────────────────────────
console.log("\x1b[1mChecking build output for leaked env files...\x1b[0m");
const buildDir = path.join(ROOT, ".next");
if (fs.existsSync(buildDir)) {
  const envInBuild = [];
  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "cache") {
          scanDir(full);
        } else if (entry.isFile() && /^\.env/.test(entry.name)) {
          envInBuild.push(path.relative(ROOT, full));
        }
      }
    } catch {}
  }
  scanDir(buildDir);
  if (envInBuild.length === 0) {
    ok("No .env files found in build output");
  } else {
    fail(`Found .env files in build: ${envInBuild.join(", ")}`);
  }
} else {
  warn("No .next build directory found — run npm run build to check");
}

// ── CHECK 2: Source maps disabled in next.config ───────────────────────────
console.log("\n\x1b[1mChecking source map configuration...\x1b[0m");
const nextConfig = readFile("next.config.ts") || readFile("next.config.js");
if (nextConfig) {
  if (nextConfig.includes("productionBrowserSourceMaps: false")) {
    ok("productionBrowserSourceMaps is disabled");
  } else {
    fail("productionBrowserSourceMaps is not explicitly disabled in next.config — set it to false");
  }
  if (nextConfig.includes("poweredByHeader: false")) {
    ok("X-Powered-By header is disabled");
  } else {
    fail("poweredByHeader is not disabled — this exposes Next.js version info");
  }
} else {
  fail("Could not read next.config.ts or next.config.js");
}

// ── CHECK 3: Security headers configured ───────────────────────────────────
console.log("\n\x1b[1mChecking security headers...\x1b[0m");
if (nextConfig) {
  const requiredHeaders = [
    ["X-Frame-Options", "Prevents clickjacking"],
    ["X-Content-Type-Options", "Prevents MIME sniffing"],
    ["Strict-Transport-Security", "Enforces HTTPS"],
    ["Content-Security-Policy", "Restricts resource loading"],
    ["Permissions-Policy", "Restricts browser features"],
    ["Referrer-Policy", "Controls referrer leakage"],
  ];
  for (const [header, reason] of requiredHeaders) {
    if (nextConfig.includes(header)) {
      ok(`${header} is configured (${reason})`);
    } else {
      fail(`${header} is missing from headers config (${reason})`);
    }
  }
}

// ── CHECK 4: Hardcoded secrets scan ────────────────────────────────────────
console.log("\n\x1b[1mScanning source files for hardcoded secrets...\x1b[0m");
const SECRET_PATTERNS = [
  { pattern: /sk_live_[a-zA-Z0-9]+/, label: "Stripe live secret key" },
  { pattern: /pk_live_[a-zA-Z0-9]+/, label: "Stripe live publishable key" },
  { pattern: /mongodb\+srv:\/\/[^<][^"'\s]+/, label: "MongoDB connection string" },
  { pattern: /re_[a-zA-Z0-9]{32,}/, label: "Resend API key" },
  { pattern: /GOCSPX-[a-zA-Z0-9_-]+/, label: "Google OAuth client secret" },
  { pattern: /AIza[0-9A-Za-z_-]{35}/, label: "Google API key" },
];

const SCAN_DIRS = ["app", "lib", "components", "models"];
const SCAN_EXTS = [".ts", ".tsx", ".js", ".jsx"];
const SKIP_FILES = ["api-helpers.ts", "security-check.js"];

let secretsFound = false;

function scanForSecrets(dir) {
  try {
    const entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
    for (const entry of entries) {
      const relPath = `${dir}/${entry.name}`;
      if (entry.isDirectory() && entry.name !== "node_modules") {
        scanForSecrets(relPath);
      } else if (entry.isFile() && SCAN_EXTS.includes(path.extname(entry.name))) {
        if (SKIP_FILES.includes(entry.name)) continue;
        const content = readFile(relPath);
        if (!content) continue;
        for (const { pattern, label } of SECRET_PATTERNS) {
          if (pattern.test(content)) {
            fail(`Potential ${label} found hardcoded in ${relPath}`);
            secretsFound = true;
          }
        }
      }
    }
  } catch {}
}

for (const dir of SCAN_DIRS) {
  if (fs.existsSync(path.join(ROOT, dir))) scanForSecrets(dir);
}
if (!secretsFound) {
  ok("No obvious hardcoded secrets detected in source files");
}

// ── CHECK 5: .env.example exists and documents key variables ──────────────
console.log("\n\x1b[1mChecking .env.example...\x1b[0m");
const envExample = readFile(".env.example");
if (envExample) {
  ok(".env.example exists");
  const requiredVars = [
    "MONGODB_URI",
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "CLOUDINARY_CLOUD_NAME",
    "STRIPE_SECRET_KEY",
    "ADMIN_EMAIL",
  ];
  for (const v of requiredVars) {
    if (envExample.includes(v)) {
      ok(`${v} is documented in .env.example`);
    } else {
      warn(`${v} is not documented in .env.example`);
    }
  }
} else {
  fail(".env.example is missing — create it to document required env vars");
}

// ── CHECK 6: .env.local is in .gitignore ──────────────────────────────────
console.log("\n\x1b[1mChecking .gitignore...\x1b[0m");
const gitignore = readFile(".gitignore");
if (gitignore) {
  if (gitignore.includes(".env.local") || gitignore.includes(".env.*")) {
    ok(".env.local is excluded by .gitignore");
  } else {
    fail(".env.local is NOT in .gitignore — secrets could be committed to git!");
  }
} else {
  fail(".gitignore not found");
}

// ── CHECK 7: proxy.ts exists for route protection ────────────────────
console.log("\n\x1b[1mChecking proxy...\x1b[0m");
if (fileExists("proxy.ts")) {
  ok("proxy.ts exists for edge-level route protection");
} else {
  warn("proxy.ts not found — admin routes may lack edge protection");
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
console.log(`\n\x1b[1mResults: ${passed} passed, ${failed} failed, ${warnings.length} warnings\x1b[0m\n`);

if (failed > 0) {
  console.log("\x1b[31m✗ Security check FAILED. Fix all failing checks before deploying.\x1b[0m\n");
  process.exit(1);
} else if (warnings.length > 0) {
  console.log("\x1b[33m⚠ Security check passed with warnings. Review before deploying.\x1b[0m\n");
} else {
  console.log("\x1b[32m✓ All security checks passed!\x1b[0m\n");
}
