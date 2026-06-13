export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";
import { notFound } from "next/navigation";
import CustomPageView from "./CustomPageView";

// Import built-in page components
import Home from "@/app/page";
import ShopPage from "@/app/shop/page";
import BundlesPage from "@/app/bundles/page";
import StoryPage from "@/app/story/page";
import SustainabilityPage from "@/app/sustainability/page";
import BlogPage from "@/app/blog/page";
import ContactPage from "@/app/contact/page";
import FAQPage from "@/app/faq/page";
import RefundPolicyPage from "@/app/refund-policy/page";
import PrivacyPolicyPage from "@/app/privacy-policy/page";
import TermsPage from "@/app/terms/page";
import CookiePolicyPage from "@/app/cookie-policy/page";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const builtInKeys: Record<string, { title: string; desc: string }> = {
    home: { title: "Naturalist | Pure Skincare", desc: "Pure Botanicals. Modern Efficacy." },
    shop: { title: "The Shop | Naturalist", desc: "Every formula, every ritual — crafted from wild-harvested botanicals." },
    bundles: { title: "Ritual Bundles | Naturalist", desc: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy." },
    story: { title: "Our Story | Naturalist", desc: "Built on the belief that pure is powerful — and that skin deserves honesty." },
    sustainability: { title: "Sustainability | Naturalist", desc: "Our pledge to the planet that grows our ingredients — and the closed loop cycle that protects it." },
    blog: { title: "Blog | Naturalist", desc: "Naturalist Journal stories, rituals, and skincare guidance from the brand team." },
    contact: { title: "Contact Us | Naturalist", desc: "Get in touch with the Naturalist team." },
    faq: { title: "Frequently Asked Questions | Naturalist", desc: "Common questions and answers." },
    "refund-policy": { title: "Refund Policy | Naturalist", desc: "Our return and refund policy." },
    "privacy-policy": { title: "Privacy Policy | Naturalist", desc: "Our privacy policy." },
    terms: { title: "Terms of Service | Naturalist", desc: "Our terms of service." },
    "cookie-policy": { title: "Cookie Policy | Naturalist", desc: "Our cookie policy." },
  };

  const key = slug === "home" ? "home" : builtInKeys[slug] ? slug : `page-${slug}`;
  
  try {
    await connectToDatabase();
    const content = await Content.findOne({ key }).lean() as any;
    
    if (builtInKeys[slug]) {
      const defaultData = builtInKeys[slug];
      return {
        title: content?.metadata?.heroHeadline ? `${content.metadata.heroHeadline} | Naturalist` : defaultData.title,
        description: content?.metadata?.heroSubtext || defaultData.desc,
      };
    }

    if (!content) return { title: "Page Not Found | Naturalist" };
    return {
      title: `${content.title} | Naturalist`,
      description: content.metadata?.heroSubtext || `${content.title} — Naturalist`,
    };
  } catch {
    return { title: "Naturalist" };
  }
}

export default async function DynamicPageRoute({ params }: Props) {
  const { slug } = await params;

  if (slug === "home") return <Home />;
  if (slug === "shop") return <ShopPage />;
  if (slug === "bundles") return <BundlesPage />;
  if (slug === "story") return <StoryPage />;
  if (slug === "sustainability") return <SustainabilityPage />;
  if (slug === "blog") return <BlogPage />;
  if (slug === "contact") return <ContactPage />;
  if (slug === "faq") return <FAQPage />;
  if (slug === "refund-policy") return <RefundPolicyPage />;
  if (slug === "privacy-policy") return <PrivacyPolicyPage />;
  if (slug === "terms") return <TermsPage />;
  if (slug === "cookie-policy") return <CookiePolicyPage />;

  try {
    await connectToDatabase();
    const content = await Content.findOne({ key: `page-${slug}` }).lean() as any;
    if (!content || !content.metadata?.isCustomPage) {
      notFound();
    }
    return <CustomPageView content={JSON.parse(JSON.stringify(content))} />;
  } catch {
    notFound();
  }
}
