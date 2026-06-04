"use client";

import React, { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, RefreshCw, Loader2, AlertCircle } from "lucide-react";

export default function ViewRevisionPage() {
  const params = useParams();
  const router = useRouter();
  const pageKey = params?.pageKey as string;
  const versionId = params?.versionId as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageNames: Record<string, string> = {
    home: "Home Page",
    shop: "Shop Page",
    bundles: "Ritual Bundles",
    story: "Our Story",
    sustainability: "Sustainability Page",
    blog: "Blog Page",
    "privacy-policy": "Privacy Policy",
    terms: "Terms of Service",
    "cookie-policy": "Cookie Policy",
    "refund-policy": "Refund Policy",
  };

  const pageName = pageNames[pageKey] || pageKey;

  useEffect(() => {
    if (!pageKey) return;
    setLoading(true);
    fetch(`/api/admin/content?key=${pageKey}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load revision details");
        return r.json();
      })
      .then((data) => {
        setContent(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pageKey]);

  const versions = content?.versions || [];
  const version = versions.find((v: any) => v._id === versionId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs text-[#a3b2a9] uppercase tracking-wider">Loading revision details…</p>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-md mx-auto text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <h3 className="font-serif text-lg font-bold text-white">Revision Not Found</h3>
        <p className="text-xs text-[#a3b2a9]">
          The requested historical version snapshot could not be found or has been pruned.
        </p>
        <button
          onClick={() => router.push(`/admin/pages/history/${pageKey}`)}
          className="text-xs text-[#b07e3a] hover:underline"
        >
          ← Back to Version History
        </button>
      </div>
    );
  }

  const date = new Date(version.savedAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const metadata = version.metadata || {};

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push(`/admin/pages/history/${pageKey}`)}
            className="flex items-center gap-1.5 text-xs text-[#a3b2a9] hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to History
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Revision Viewer</span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-white mt-1">
            {version.title || pageName} — Archived Version
          </h1>
          <p className="text-xs text-[#a3b2a9] mt-1 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#b07e3a]" />
            Saved on {formattedDate} by {version.savedBy || "Admin"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => router.push(`/admin/pages/edit/${pageKey}?restoreVersionId=${versionId}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#3e6a4e]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Restore to Editor
          </button>
        </div>
      </div>

      {version.note && (
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#b07e3a] mb-2">Change Log Note</h3>
          <p className="text-xs text-white leading-relaxed">{version.note}</p>
        </div>
      )}

      {/* Render Document Sections */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9] border-b border-[#1a241e] pb-2">
          Archived Metadata Values
        </h3>

        {Object.keys(metadata).length === 0 ? (
          <p className="text-xs text-[#a3b2a9] italic">No metadata keys stored in this version.</p>
        ) : (
          <div className="space-y-4">
            {Object.keys(metadata).map((key) => {
              const val = metadata[key];
              
              if (Array.isArray(val)) {
                return (
                  <div key={key} className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">{key}</label>
                    <div className="space-y-3">
                      {val.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-[#a3b2a9] border-l-2 border-[#b07e3a]/40 pl-3 py-1 space-y-1">
                          {item.heading || item.title || item.label ? (
                            <h4 className="font-bold text-white">{item.heading || item.title || item.label}</h4>
                          ) : null}
                          {item.body ? (
                            <p className="leading-relaxed">{Array.isArray(item.body) ? item.body.join("\n• ") : item.body}</p>
                          ) : null}
                          {item.year ? (
                            <span className="text-[9px] uppercase tracking-wider text-[#b07e3a] font-semibold">Year: {item.year}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={key} className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">{key}</label>
                  <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{String(val || "")}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
