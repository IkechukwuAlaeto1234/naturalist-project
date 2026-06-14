import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import ProductDetailClient from "@/components/store/ProductDetailClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://naturalist-project.onrender.com";

// OG images must be absolute URLs. Images are stored as /cdn/... (relative)
// after proxyCloudinaryUrl(), so we resolve it here before setting OG tags.
function resolveAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
}

// ── ISR: revalidate every 60s ──────────────────────────────────────────────────
export const revalidate = 60;

// ── generateStaticParams: pre-render all active product slugs ─────────────────
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    const products = await Product.find({ isActive: true }).select("slug").lean();
    return products.map((p: any) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

// ── generateMetadata: full OG + Twitter card per product ─────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectToDatabase();
    const product = await Product.findOne({ slug }).lean() as any;
    if (!product) return { title: "Product Not Found | Naturalist" };

    const url = `${SITE_URL}/shop/${slug}`;
    const image = resolveAbsoluteUrl(product.images?.[0]) || `${SITE_URL}/og-default.jpg?v=2`;
    const price = product.price ? `$${product.price.toFixed(2)}` : "";
    const description = product.description
      ? product.description.slice(0, 160)
      : `${product.name} — premium botanical skincare by Naturalist.`;

    return {
      title: `${product.name} | Naturalist`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${product.name} | Naturalist`,
        description,
        url,
        siteName: "Naturalist",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: product.name }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name}${price ? ` — ${price}` : ""} | Naturalist`,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Naturalist Shop" };
  }
}

// ── Page: fetch product server-side, pass as prop ────────────────────────────
export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  await connectToDatabase();
  const product = await Product.findOne({ slug }).lean() as any;
  if (!product) notFound();

  const serialized = JSON.parse(JSON.stringify(product));

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: serialized.name,
    description: serialized.description,
    image: resolveAbsoluteUrl(serialized.images?.[0]),
    url: `${SITE_URL}/shop/${slug}`,
    brand: { "@type": "Brand", name: "Naturalist" },
    offers: {
      "@type": "Offer",
      price: serialized.price,
      priceCurrency: "USD",
      availability: serialized.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/shop/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={serialized} />
    </>
  );
}
