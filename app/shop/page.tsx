import { Metadata } from "next";
import { getProducts, getPageContent } from "@/lib/fetchers";
import ShopClient from "@/components/store/ShopClient";

// ISR: re-render this page in the background at most every 60 seconds.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Shop | Naturalist",
  description: "Every formula, every ritual — crafted from wild-harvested botanicals. Shop the full Naturalist collection.",
  openGraph: {
    title: "The Shop | Naturalist",
    description: "Every formula, every ritual — crafted from wild-harvested botanicals. Shop the full Naturalist collection.",
    url: "https://naturalist-project.onrender.com/shop",
    siteName: "Naturalist",
    type: "website",
    images: [
      {
        url: "https://naturalist-project.onrender.com/og-default.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "The Shop | Naturalist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Shop | Naturalist",
    description: "Every formula, every ritual — crafted from wild-harvested botanicals. Shop the full Naturalist collection.",
    images: ["https://naturalist-project.onrender.com/og-default.jpg?v=2"],
  },
};

export default async function ShopPage() {
  // Both fetches are cached and run in parallel.
  const [products, pageContent] = await Promise.all([
    getProducts(),
    getPageContent("shop"),
  ]);

  return (
    <ShopClient
      initialProducts={products}
      pageContent={pageContent?.metadata ?? {}}
    />
  );
}
