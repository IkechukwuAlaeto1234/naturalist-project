"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LegalPageShell from "@/components/ui/LegalPageShell";
import { generateLegalPDF } from "@/lib/generateLegalPDF";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "naturalistbotanicals@gmail.com";

function getDefaultSections() {
  return [
    {
      heading: "1. What Are Cookies",
      body: "Cookies are small text files placed on your device when you visit a website. They allow the site to remember your actions and preferences over a period of time, so you don't have to re-enter information each visit. Cookies do not contain personally identifiable information on their own, but may be linked to it.",
    },
    {
      heading: "2. Cookies We Use",
      body: [
        "Essential cookies: required for the website to function. These enable login sessions, shopping cart persistence, and security features. They cannot be disabled.",
        "Performance cookies: collect anonymous information about how visitors use our site, such as which pages are visited most. We use this data to improve the site experience.",
        "Functionality cookies: remember your preferences such as dark mode, currency, and language settings.",
        "Analytics cookies: provided by third-party services (such as Google Analytics) to help us understand traffic sources and user behaviour in aggregate.",
        "Marketing cookies: used to deliver relevant advertisements and track campaign effectiveness. These are only active if you have given consent.",
      ],
    },
    {
      heading: "3. Third-Party Cookies",
      body: "Some cookies on our site are placed by third-party services we use, including payment processors, analytics providers, and social media platforms. We do not control these third-party cookies; their use is governed by the respective providers' privacy and cookie policies.",
    },
    {
      heading: "4. Your Cookie Choices",
      body: "When you first visit our website, you will be presented with a cookie consent banner. You may accept all cookies, reject non-essential cookies, or manage your preferences individually. You can change your preferences at any time by clearing your cookies and revisiting the site, or by adjusting your browser settings.",
    },
    {
      heading: "5. Managing Cookies in Your Browser",
      body: [
        "Chrome: Settings → Privacy and Security → Cookies and other site data.",
        "Firefox: Settings → Privacy & Security → Cookies and Site Data.",
        "Safari: Preferences → Privacy → Manage Website Data.",
        "Edge: Settings → Cookies and site permissions → Cookies and site data.",
        "Note: disabling essential cookies will impair core site functionality including checkout.",
      ],
    },
    {
      heading: "6. Do Not Track",
      body: "Some browsers include a 'Do Not Track' (DNT) signal. Our website does not currently alter its behaviour based on DNT signals, as there is no universal standard for interpreting them. We aim to provide clear opt-out controls directly on our site.",
    },
    {
      heading: "7. Retention",
      body: "Session cookies expire when you close your browser. Persistent cookies remain for a defined period — typically between 30 days and 2 years depending on their purpose. You can delete all cookies at any time via your browser settings.",
    },
    {
      heading: "8. Updates to This Policy",
      body: "We may update this Cookie Policy to reflect changes in technology, regulation, or our own practices. When we do, we will update the 'last updated' date. We encourage you to review this policy periodically.",
    },
    {
      heading: "9. Contact",
      body: `For questions about our use of cookies, please email us at ${CONTACT_EMAIL} or use our contact form.`,
    },
  ];
}

export default function CookiePolicyPage() {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  useEffect(() => {
    setMounted(true);
    document.title = "Cookie Policy | Naturalist";
    async function loadContent() {
      try {
        const res = await fetch("/api/content?key=cookie-policy", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) setContent(data);
        }
      } catch (err) {
        console.error("Failed to load cookie policy content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  const handleDownloadPDF = async () => {
    const t = content?.metadata?.title || "Cookie Policy";
    const e = content?.metadata?.effectiveDate || "May 31, 2026";
    const datePart = e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await generateLegalPDF({
      title: t,
      eyebrow: "Legal",
      subtitle: content?.metadata?.subtitle || "How we use cookies to improve your experience on our website.",
      effectiveDate: e,
      sections: content?.metadata?.sections || getDefaultSections(),
      filename: `naturalist-cookie-policy-${datePart || "latest"}.pdf`,
    });
  };

  if (!mounted) return null;

  const titleText = content?.metadata?.title || "Cookie Policy";
  const subtitleText = content?.metadata?.subtitle || "How we use cookies to improve your experience on our website.";
  const effectiveDateText = content?.metadata?.effectiveDate || "May 31, 2026";
  const sectionsList = content?.metadata?.sections || getDefaultSections();

  return (
    <LegalPageShell
      eyebrow="Legal"
      title={titleText}
      subtitle={subtitleText}
      lastUpdated={effectiveDateText}
      sections={sectionsList}
      patternId="cookiePattern"
      versions={content?.versions}
      slug="cookie-policy"
      isAdmin={isAdmin}
      onDownloadPDF={handleDownloadPDF}
    />
  );
}
