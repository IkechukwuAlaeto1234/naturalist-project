import { Metadata } from "next";
import { getProducts, getPageContent } from "@/lib/fetchers";
import ShopClient from "@/components/store/ShopClient";

// ISR: re-render this page in the background at most every 60 seconds.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Shop | Naturalist",
  description: "Every formula, every ritual — crafted from wild-harvested botanicals. Shop the full Naturalist collection.",
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
