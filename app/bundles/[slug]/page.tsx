import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import BundleDetailClient from "@/components/store/BundleDetailClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://naturalist-project.onrender.com";

// OG images must be absolute URLs. Images are stored as /cdn/... (relative)
// after proxyCloudinaryUrl(), so we resolve it here before setting OG tags.
function resolveAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
}

export const revalidate = 60;

// ── generateStaticParams ──────────────────────────────────────────────────────
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    const { Bundle } = await import("@/models/Bundle");
    const bundles = await Bundle.find({ isActive: true }).select("slug").lean();
    return bundles.map((b: any) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

// ── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectToDatabase();
    const { Bundle } = await import("@/models/Bundle");
    const bundle = await Bundle.findOne({ slug }).lean() as any;
    if (!bundle) return { title: "Bundle Not Found | Naturalist" };

    const url = `${SITE_URL}/bundles/${slug}`;
    const image = resolveAbsoluteUrl(bundle.images?.[0]) || `${SITE_URL}/og-default.jpg`;
    const price = bundle.price ? `$${bundle.price.toFixed(2)}` : "";
    const description = bundle.description
      ? bundle.description.slice(0, 160)
      : `${bundle.name} — a complete botanical skincare ritual by Naturalist.`;

    return {
      title: `${bundle.name} | Naturalist`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${bundle.name} | Naturalist`,
        description,
        url,
        siteName: "Naturalist",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: bundle.name }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${bundle.name}${price ? ` — ${price}` : ""} | Naturalist`,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Naturalist Bundles" };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function BundleDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  await connectToDatabase();
  const { Bundle } = await import("@/models/Bundle");
  const bundle = await Bundle.findOne({ slug }).populate("products").lean() as any;
  if (!bundle) notFound();

  const serialized = JSON.parse(JSON.stringify(bundle));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: serialized.name,
    description: serialized.description,
    image: resolveAbsoluteUrl(serialized.images?.[0]),
    url: `${SITE_URL}/bundles/${slug}`,
    brand: { "@type": "Brand", name: "Naturalist" },
    offers: {
      "@type": "Offer",
      price: serialized.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/bundles/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BundleDetailClient bundle={serialized} />
    </>
  );
}
