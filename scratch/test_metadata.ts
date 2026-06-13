import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const { generateMetadata } = await import("../app/blog/[slug]/page");

  const params = Promise.resolve({
    slug: "the-rosehip-doctrine-why-cold-pressed-seed-oils-are-the-future-of-botanical-repair"
  });

  console.log("Calling generateMetadata...");
  try {
    const metadata = await generateMetadata({ params });
    console.log("Metadata result:");
    console.log(JSON.stringify(metadata, null, 2));
  } catch (err: any) {
    console.error("CRITICAL ERROR calling generateMetadata:", err);
  }
  process.exit(0);
}

main().catch(err => {
  console.error("Main execution failed:", err);
  process.exit(1);
});
