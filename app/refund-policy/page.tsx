"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import LegalPageShell from "@/components/ui/LegalPageShell";
import { generateLegalPDF } from "@/lib/generateLegalPDF";

const DEFAULT_SECTIONS = [
  {
    heading: "1. 30-Day Satisfaction Guarantee",
    body: "If you're not completely satisfied with any Naturalist product, return it within 30 days of delivery for a full refund — no questions asked. The product must be at least 50% unused.",
  },
  {
    heading: "2. How to Initiate a Return",
    body: "Log in to your account and navigate to 'My Orders'. Select the item you wish to return and follow the guided steps. A prepaid return label will be emailed to you within 24 hours.",
  },
  {
    heading: "3. Refund Processing Time",
    body: "Once we receive your return, refunds are processed within 3–5 business days. The funds typically appear on your statement within 5–10 business days depending on your bank or card issuer.",
  },
  {
    heading: "4. Damaged or Incorrect Orders",
    body: "If your order arrives damaged or incorrect, contact us at hello@naturalist.com within 7 days with a photo. We will dispatch a replacement at no cost within 2 business days.",
  },
  {
    heading: "5. Non-Returnable Items",
    body: "For hygiene reasons, opened products that are more than 50% used cannot be returned. Gift cards and downloadable content are also non-refundable.",
  },
  {
    heading: "6. International Returns",
    body: "International customers are responsible for return shipping costs unless the item is damaged or incorrect. Refunds are issued in the original currency of purchase.",
  },
];

export default function RefundPolicyPage() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  useEffect(() => {
    setMounted(true);
    document.title = "Refund Policy | Naturalist";
    async function loadContent() {
      try {
        const res = await fetch("/api/content?key=refund-policy", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) setContent(data);
        }
      } catch (err) {
        console.error("Failed to load refund policy content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleDownloadPDF = async () => {
    const t = content?.metadata?.title || "Refund Policy";
    const e = content?.metadata?.effectiveDate || "May 31, 2026";
    const datePart = e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await generateLegalPDF({
      title: t,
      eyebrow: "Legal",
      subtitle: content?.metadata?.subtitle || "Our return, exchange, and refund guarantees.",
      effectiveDate: e,
      sections: content?.metadata?.sections || DEFAULT_SECTIONS,
      filename: `naturalist-refund-policy-${datePart || "latest"}.pdf`,
    });
  };

  if (!mounted) return null;

  const titleText = content?.metadata?.title || "Refund Policy";
  const subtitleText = content?.metadata?.subtitle || "Our return, exchange, and refund guarantees.";
  const effectiveDateText = content?.metadata?.effectiveDate || "May 31, 2026";
  const sectionsList = content?.metadata?.sections || DEFAULT_SECTIONS;

  return (
    <>
      <div className="pt-8 bg-[#0d1510] flex justify-center">
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-[#2d4c38] bg-[#15231b] text-emerald-400">
          <ShieldCheck className="h-5 w-5" />
          <div className="text-left">
            <p className="text-xs font-bold">30-Day Guarantee</p>
            <p className="text-[10px] opacity-80">No questions asked. No hoops.</p>
          </div>
        </div>
      </div>

      <LegalPageShell
        eyebrow="Legal"
        title={titleText}
        subtitle={subtitleText}
        lastUpdated={effectiveDateText}
        sections={sectionsList}
        patternId="refundPattern"
        versions={content?.versions}
        slug="refund-policy"
        isAdmin={isAdmin}
        onDownloadPDF={handleDownloadPDF}
      />
    </>
  );
}
