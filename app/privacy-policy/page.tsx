"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LegalPageShell from "@/components/ui/LegalPageShell";
import { generateLegalPDF } from "@/lib/generateLegalPDF";

const DEFAULT_SECTIONS = [
  {
    heading: "1. Introduction",
    body: "Naturalist ('we', 'us', or 'our') is committed to protecting your personal information. This Privacy Policy explains what data we collect when you use our website (naturalist.com), how we use it, who we share it with, and the choices you have. By using our site, you agree to the terms described here.",
  },
  {
    heading: "2. Information We Collect",
    body: [
      "Account information: name, email address, and password when you create an account.",
      "Order information: billing address, shipping address, payment method (processed via secure third-party providers — we never store full card numbers), and order history.",
      "Usage data: pages visited, products viewed, search queries, browser type, device type, and IP address.",
      "Communications: messages you send us via our contact form or email.",
      "Newsletter subscriptions: email address and subscription preferences.",
    ],
  },
  {
    heading: "3. How We Use Your Information",
    body: [
      "To process and fulfil your orders, including shipping confirmation and order status updates.",
      "To create and manage your account.",
      "To send transactional emails (order confirmations, shipping updates, password resets).",
      "To send marketing emails, only if you have opted in. You may unsubscribe at any time.",
      "To improve our website, product range, and customer experience through analytics.",
      "To comply with legal obligations, including tax and fraud prevention requirements.",
    ],
  },
  {
    heading: "4. Cookies & Tracking",
    body: "We use cookies and similar tracking technologies to operate our website, remember your preferences, and measure performance. You can manage your cookie preferences at any time via our Cookie Policy page or your browser settings. Disabling certain cookies may affect site functionality.",
  },
  {
    heading: "5. Data Sharing",
    body: "We do not sell your personal data. We share information only with trusted service providers who help us operate our business — such as payment processors, shipping carriers, and email service providers — and only to the extent necessary to perform those services. These providers are contractually obligated to protect your data.",
  },
  {
    heading: "6. Data Retention",
    body: "We retain your personal data for as long as your account is active or as needed to fulfil the purposes described in this policy. Order records are retained for seven years to comply with tax obligations. You may request deletion of your account at any time.",
  },
  {
    heading: "7. Your Rights",
    body: [
      "Access: request a copy of the personal data we hold about you.",
      "Correction: request that we update inaccurate or incomplete data.",
      "Deletion: request that we delete your personal data, subject to legal obligations.",
      "Portability: request your data in a structured, machine-readable format.",
      "Objection: object to processing based on legitimate interests or for direct marketing.",
      "Withdraw consent: unsubscribe from marketing emails at any time using the link in any email.",
    ],
  },
  {
    heading: "8. Security",
    body: "We use industry-standard security measures including TLS encryption, secure servers, and access controls to protect your data. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security, but we take every reasonable precaution.",
  },
  {
    heading: "9. Children's Privacy",
    body: "Our website is not directed at children under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately and we will delete it.",
  },
  {
    heading: "10. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. When we do, we will revise the 'last updated' date at the top of this page. Material changes will be notified via email to registered customers.",
  },
  {
    heading: "11. Contact",
    body: "For any questions or requests relating to this Privacy Policy, please contact our team at hello@naturalist.com or via the contact form on our website.",
  },
];

export default function PrivacyPolicyPage() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  useEffect(() => {
    setMounted(true);
    document.title = "Privacy Policy | Naturalist";
    async function loadContent() {
      try {
        const res = await fetch("/api/content?key=privacy-policy", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) setContent(data);
        }
      } catch (err) {
        console.error("Failed to load privacy policy content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleDownloadPDF = async () => {
    const t = content?.metadata?.title || "Privacy Policy";
    const e = content?.metadata?.effectiveDate || "May 31, 2026";
    const datePart = e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await generateLegalPDF({
      title: t,
      eyebrow: "Legal",
      subtitle: content?.metadata?.subtitle || "How we collect, use, and protect your personal information.",
      effectiveDate: e,
      sections: content?.metadata?.sections || DEFAULT_SECTIONS,
      filename: `naturalist-privacy-policy-${datePart || "latest"}.pdf`,
    });
  };

  if (!mounted) return null;

  const titleText = content?.metadata?.title || "Privacy Policy";
  const subtitleText = content?.metadata?.subtitle || "How we collect, use, and protect your personal information.";
  const effectiveDateText = content?.metadata?.effectiveDate || "May 31, 2026";
  const sectionsList = content?.metadata?.sections || DEFAULT_SECTIONS;

  return (
    <LegalPageShell
      eyebrow="Legal"
      title={titleText}
      subtitle={subtitleText}
      lastUpdated={effectiveDateText}
      sections={sectionsList}
      patternId="privacyPattern"
      versions={content?.versions}
      slug="privacy-policy"
      isAdmin={isAdmin}
      onDownloadPDF={handleDownloadPDF}
    />
  );
}
