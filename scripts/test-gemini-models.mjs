/**
 * test-gemini-models.mjs
 * Tests all plausible Gemini models against your API key and reports which ones work.
 * Run: node scripts/test-gemini-models.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Load GEMINI_API_KEY from .env.local
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

let apiKey = "";
try {
  const envContent = readFileSync(envPath, "utf-8");
  const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m);
  if (match) apiKey = match[1].trim();
} catch {
  // fallback to process.env
}
apiKey = apiKey || process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.error("❌  No GEMINI_API_KEY found in .env.local or environment.");
  process.exit(1);
}

console.log("🔑  API key loaded:", apiKey.slice(0, 8) + "..." + apiKey.slice(-4));
console.log();

// ---------------------------------------------------------------------------
// Models to test  (v1beta endpoint supports all of these)
// ---------------------------------------------------------------------------
const MODELS = [
  // Gemini 3.x family (newest, most powerful)
  "gemini-3.0-flash",
  "gemini-3.0-flash-lite",
  "gemini-3.0-pro",
  "gemini-3.5-flash",
  "gemini-3.5-pro",
  "gemini-3.5-flash-preview",
  "gemini-3.5-pro-preview",

  // Gemini 2.5 family (fallback)
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.5-pro-preview-06-05",
];

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const PROMPT = {
  contents: [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }],
  generationConfig: { maxOutputTokens: 10, temperature: 0 },
};

// ---------------------------------------------------------------------------
// Test a single model
// ---------------------------------------------------------------------------
async function testModel(model) {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(PROMPT),
      signal: AbortSignal.timeout(15_000), // 15 s timeout per model
    });

    const elapsed = Date.now() - start;

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "(no text)";
      return { status: "✅ OK", elapsed, text: text.trim() };
    } else {
      const errBody = await res.text();
      let reason = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errBody);
        reason = parsed?.error?.message ?? reason;
      } catch {}
      return { status: "❌ FAIL", elapsed, reason };
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    return { status: "⚠️  ERR", elapsed, reason: err.message };
  }
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
const results = [];

for (const model of MODELS) {
  process.stdout.write(`  Testing ${model.padEnd(45)} ... `);
  const r = await testModel(model);
  process.stdout.write(`${r.status}  (${r.elapsed}ms)`);
  if (r.reason) process.stdout.write(`  — ${r.reason}`);
  process.stdout.write("\n");
  results.push({ model, ...r });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const working = results.filter((r) => r.status.startsWith("✅"));
const failing = results.filter((r) => !r.status.startsWith("✅"));

console.log();
console.log("=".repeat(70));
console.log(`SUMMARY: ${working.length} working / ${failing.length} failing`);
console.log("=".repeat(70));

if (working.length) {
  console.log("\n✅  Working models:");
  working.forEach((r) => console.log(`   • ${r.model}`));
}

if (failing.length) {
  console.log("\n❌  Not working:");
  failing.forEach((r) => console.log(`   • ${r.model.padEnd(45)} ${r.reason ?? ""}`));
}

// ---------------------------------------------------------------------------
// Recommendation
// ---------------------------------------------------------------------------
console.log();
const recommended = working.find((r) => r.model.includes("3.5"))
  || working.find((r) => r.model.includes("3.0"))
  || working.find((r) => r.model.includes("2.5-flash"))
  || working[0];

if (recommended) {
  console.log(`🏆  Recommended model for your project: ${recommended.model}`);
  console.log(`   → Update GEMINI_API_URL in app/api/admin/email/ai/route.ts`);
  console.log(
    `   → New URL: https://generativelanguage.googleapis.com/v1beta/models/${recommended.model}:generateContent`
  );
}
