"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LegalPageShell from "@/components/ui/LegalPageShell";
import { generateLegalPDF } from "@/lib/generateLegalPDF";

const DEFAULT_SECTIONS = [
  {
    heading: "1. Acceptance of Terms",
    body: "By accessing or using the Naturalist website (naturalist.com) or placing an order, you agree to be bound by these Terms of Service. If you do not agree, please do not use our site. We reserve the right to update these terms at any time; continued use constitutes acceptance of any changes.",
  },
  {
    heading: "2. Eligibility",
    body: "You must be at least 18 years of age to place an order or create an account on naturalist.com. By using this site, you represent and warrant that you meet this age requirement.",
  },
  {
    heading: "3. Products & Availability",
    body: [
      "All product descriptions, images, and prices are subject to change without notice.",
      "We reserve the right to limit quantities, refuse orders, or discontinue products at any time.",
      "Colours and textures may appear slightly different on screen due to monitor calibration.",
      "Product availability is not guaranteed until your order is confirmed.",
    ],
  },
  {
    heading: "4. Pricing & Payment",
    body: "Prices are listed in USD and are inclusive of applicable taxes where stated. We accept major credit cards, debit cards, and other payment methods displayed at checkout. Payment is processed securely via third-party providers. We reserve the right to cancel any order placed at an incorrectly displayed price.",
  },
  {
    heading: "5. Orders & Cancellations",
    body: "Once an order is placed, you have a 2-hour window to modify or cancel it. After that window, fulfilment may have commenced. Contact us immediately at hello@naturalist.com if you need to make changes. We reserve the right to cancel any order at our discretion, in which case a full refund will be issued.",
  },
  {
    heading: "6. Shipping",
    body: "Delivery timelines are estimates and not guarantees. Naturalist is not responsible for delays caused by carriers, customs processing, or circumstances beyond our control. Risk of loss and title for products purchased pass to you upon delivery to the carrier.",
  },
  {
    heading: "7. Returns & Refunds",
    body: "Returns and refunds are governed by our Refund Policy, which is incorporated into these terms by reference. Please review that policy before placing an order.",
  },
  {
    heading: "8. Intellectual Property",
    body: "All content on naturalist.com — including text, images, logos, product designs, and code — is the property of Naturalist or its licensors and is protected by copyright and trademark law. You may not reproduce, distribute, or create derivative works without prior written permission.",
  },
  {
    heading: "9. User Accounts",
    body: [
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to notify us immediately of any unauthorised use of your account.",
      "We reserve the right to suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    heading: "10. Prohibited Conduct",
    body: [
      "Using the site for any unlawful purpose or in violation of any applicable regulations.",
      "Attempting to gain unauthorised access to any part of our systems.",
      "Submitting false, misleading, or fraudulent information.",
      "Reselling products purchased from Naturalist without prior written consent.",
    ],
  },
  {
    heading: "11. Disclaimer of Warranties",
    body: "Our website and products are provided on an 'as is' basis. We make no warranties, express or implied, regarding the accuracy, completeness, or fitness for a particular purpose of any content or product. Our skincare products are not intended to diagnose, treat, cure, or prevent any medical condition.",
  },
  {
    heading: "12. Limitation of Liability",
    body: "To the maximum extent permitted by law, Naturalist shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid by you for the specific order giving rise to the claim.",
  },
  {
    heading: "13. Governing Law",
    body: "These Terms of Service are governed by the laws of the State of Oregon, USA, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the courts of Multnomah County, Oregon.",
  },
  {
    heading: "14. Contact",
    body: "Questions about these Terms? Reach us at hello@naturalist.com or via our contact form.",
  },
];

export default function TermsPage() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  useEffect(() => {
    setMounted(true);
    document.title = "Terms of Service | Naturalist";
    async function loadContent() {
      try {
        const res = await fetch("/api/content?key=terms", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) setContent(data);
        }
      } catch (err) {
        console.error("Failed to load terms of service content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleDownloadPDF = async () => {
    const t = content?.metadata?.title || "Terms of Service";
    const e = content?.metadata?.effectiveDate || "May 31, 2026";
    const datePart = e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await generateLegalPDF({
      title: t,
      eyebrow: "Legal",
      subtitle: content?.metadata?.subtitle || "The rules and guidelines that govern your use of Naturalist.",
      effectiveDate: e,
      sections: content?.metadata?.sections || DEFAULT_SECTIONS,
      filename: `naturalist-terms-of-service-${datePart || "latest"}.pdf`,
      siteUrl: typeof window !== "undefined" ? window.location.origin : undefined,
      contactUrl: typeof window !== "undefined" ? `${window.location.origin}/p/contact` : "/p/contact",
      contactEmail: "hello@naturalist.com",
      year: new Date().getFullYear(),
    });
  };

  if (!mounted) return null;

  const titleText = content?.metadata?.title || "Terms of Service";
  const subtitleText = content?.metadata?.subtitle || "The rules and guidelines that govern your use of Naturalist.";
  const effectiveDateText = content?.metadata?.effectiveDate || "May 31, 2026";
  const sectionsList = content?.metadata?.sections || DEFAULT_SECTIONS;

  return (
    <LegalPageShell
      eyebrow="Legal"
      title={titleText}
      subtitle={subtitleText}
      lastUpdated={effectiveDateText}
      sections={sectionsList}
      patternId="termsPattern"
      versions={content?.versions}
      slug="terms"
      isAdmin={isAdmin}
      onDownloadPDF={handleDownloadPDF}
    />
  );
}
