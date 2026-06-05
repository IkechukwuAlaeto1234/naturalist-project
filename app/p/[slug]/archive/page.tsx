"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Calendar, FileText, ChevronRight } from "lucide-react";

export default function ArchivePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
 
  useEffect(() => {
    if (status === "loading") return;
    const sessionUser = session?.user as any;
    const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";
    if (!session || !isAdmin) {
      router.push(`/p/${slug}`);
    }
  }, [session, status, router, slug]);

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
        console.error("Failed to load archive:", err);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [slug]);

  const versions = content?.versions || [];

  const sessionUser = session?.user as any;
  const isAdmin = session?.user?.email?.toLowerCase().trim() === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";
 
  useEffect(() => {
    document.title = `${pageName} Version Archive History | Naturalist`;
  }, [pageName]);

  if (loading || status === "loading" || !session || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#0a0d0b] flex items-center justify-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">Verifying Authority…</p>
      </div>
    );
  }
 
  return (
    <div className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] min-h-screen py-24 px-6 sm:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-80 mb-8 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to current version
        </Link>

        <div className="mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Version History</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-2 tracking-tight">
            {pageName} Archive
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Review previous revisions and archived drafts of our {pageName.toLowerCase()}.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground uppercase tracking-widest animate-pulse">
            Loading document archive…
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/50 rounded-3xl bg-muted/10">
            <FileText className="h-10 w-10 text-muted-foreground/35 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground font-medium">No previous versions archived.</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
              Any changes made via the page editor in the admin panel will automatically create version snapshot history here.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-border/60 dark:border-[#232c26] pl-6 ml-3 space-y-8">
            {versions.slice().reverse().map((version: any) => {
              const date = new Date(version.savedAt);
              return (
                <div key={version._id} className="relative group">
                  {/* Point Indicator */}
                  <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-[#b07e3a] ring-4 ring-[#fcfcfb] dark:ring-[#0a0d0b] group-hover:scale-125 transition-transform" />
                  
                  <div className="flex flex-col gap-2 p-5 bg-white dark:bg-[#0f1411] border border-border/30 dark:border-[#232c26] rounded-2xl group-hover:border-[#b07e3a]/40 group-hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#b07e3a]" />
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground">
                      {version.title || pageName}
                    </h3>
                    
                    {version.note && (
                      <p className="text-xs text-muted-foreground bg-muted/40 dark:bg-black/20 px-3 py-2 rounded-lg leading-relaxed">
                        {version.note}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-border/30 dark:border-[#232c26]/60 pt-3 mt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground/70">
                        Saved by: {version.savedBy || "Admin"}
                      </span>
                      <Link
                        href={`/p/${slug}/archive/${version._id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-85"
                      >
                        Read Version <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
