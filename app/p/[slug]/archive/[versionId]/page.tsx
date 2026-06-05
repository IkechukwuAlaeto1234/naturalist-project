"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import LegalPageShell from "@/components/ui/LegalPageShell";

export default function ArchivedVersionPage({
  params,
}: {
  params: Promise<{ slug: string; versionId: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const versionId = resolvedParams.versionId;
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  const formattedNameMap: Record<string, string> = {
    "privacy-policy": "Privacy Policy",
    "terms": "Terms of Service",
    "cookie-policy": "Cookie Policy",
    "refund-policy": "Refund Policy",
  };

  const pageName = formattedNameMap[slug] || slug;

  useEffect(() => {
    async function loadContent() {
      try {
        const res = await fetch(`/api/content?key=${slug}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) setContent(data);
        }
      } catch (err) {
        console.error("Failed to load archived version:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [slug]);

  const versions = content?.versions || [];
  const version = versions.find((v: any) => v._id === versionId);

  useEffect(() => {
    if (version) {
      const titleText = version.title || pageName;
      const date = new Date(version.savedAt);
      const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      document.title = `Archive: ${titleText} (${formattedDate}) | Naturalist`;
    } else {
      document.title = `${pageName} Version Archive | Naturalist`;
    }
  }, [version, pageName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#0a0d0b] flex items-center justify-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">Loading archived version…</p>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#0a0d0b] flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-[#b07e3a]" />
        <h1 className="font-serif text-xl font-bold text-foreground">Archived version not found</h1>
        <p className="text-xs text-muted-foreground">The version ID does not exist or has been pruned.</p>
        <Link href={`/p/${slug}/archive`} className="text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider">
          ← Back to Archive List
        </Link>
      </div>
    );
  }

  const date = new Date(version.savedAt);
  const formattedDate = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + " at " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const titleText = version.title || pageName;
  const subtitleText = version.metadata?.subtitle || `Archived revision of ${pageName.toLowerCase()}.`;
  const sectionsList = version.metadata?.sections || [];

  const currentUrl = `/p/${slug}`;

  return (
    <div className="relative flex flex-col w-full">
      <div className="absolute top-6 left-4 sm:left-8 z-20">
        {isAdmin && (
          <Link
            href={`/p/${slug}/archive`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-80 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to History
          </Link>
        )}
      </div>

      <LegalPageShell
        eyebrow="Archived Revision"
        title={titleText}
        subtitle={subtitleText}
        lastUpdated={version.metadata?.effectiveDate || date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        sections={sectionsList}
        patternId="archivePattern"
        disclaimerUrl={currentUrl}
      />
    </div>
  );
}
