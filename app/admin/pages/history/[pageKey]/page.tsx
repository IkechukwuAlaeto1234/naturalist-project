"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, FileText, ChevronRight, Loader2, AlertCircle, User, Trash2, AlertTriangle } from "lucide-react";

export default function PageHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const pageKey = params?.pageKey as string;

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
        if (!r.ok) throw new Error("Failed to load page history");
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

  const handleDeleteVersion = async () => {
    if (!deletingVersionId) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/content?key=${pageKey}&versionId=${deletingVersionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete version");
      }
      // Remove from local state
      setContent((prev: any) => ({
        ...prev,
        versions: prev.versions.filter((v: any) => String(v._id) !== deletingVersionId),
      }));
      setDeletingVersionId(null);
    } catch (err: any) {
      setDeleteError(err.message || "An error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const versions = content?.versions || [];

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/admin/pages")}
          className="flex items-center gap-1.5 text-xs text-[#a3b2a9] hover:text-white mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Pages
        </button>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Version Ledger</span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">{pageName} History</h1>
        <p className="text-xs text-[#a3b2a9] mt-1 max-w-xl">
          Review and manage previous checkpoints and archived drafts of the {pageName.toLowerCase()}.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] uppercase tracking-wider">Loading history log…</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#1a241e] rounded-3xl bg-[#0c100e]">
          <FileText className="h-10 w-10 text-[#4a5c50] mx-auto mb-4" />
          <p className="text-sm text-[#a3b2a9] font-medium">No previous versions archived.</p>
          <p className="text-xs text-[#4a5c50] mt-1 max-w-xs mx-auto leading-relaxed">
            Ensure you toggle &ldquo;Log this edit as a new archive version record&rdquo; during edits to save checkpoints.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-[#1a241e] pl-6 ml-3 space-y-6">
          {versions.slice().reverse().map((version: any) => {
            const date = new Date(version.savedAt);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={version._id} className="relative group">
                {/* Timeline node */}
                <span className="absolute -left-[31px] top-1.5 h-2 w-2 rounded-full bg-[#b07e3a] ring-4 ring-[#070908] group-hover:scale-125 transition-transform" />

                <div className="flex flex-col gap-3 p-5 bg-[#0c100e] border border-[#1a241e] rounded-2xl hover:border-[#b07e3a]/30 transition-all duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#b07e3a]" />
                      {formattedDate} at {formattedTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-[#b07e3a]" />
                      Saved by: {version.savedBy || "Admin"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {version.title || pageName}
                  </h3>

                  {version.note && (
                    <p className="text-xs text-[#a3b2a9] bg-[#070908] border border-[#1a241e] px-3.5 py-2.5 rounded-xl leading-relaxed">
                      {version.note}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-[#1a241e] pt-3 mt-1">
                    <Link
                      href={`/admin/pages/history/${pageKey}/${version._id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#d4a362] transition-colors"
                    >
                      View Revision <ChevronRight className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => setDeletingVersionId(String(version._id))}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVersionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl p-6 max-w-sm w-full text-center space-y-5">
            <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto border border-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Delete This Version?</h3>
              <p className="text-xs text-[#a3b2a9] mt-2 leading-relaxed">
                This archived version will be permanently removed from the history ledger. This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-xs text-red-400 mt-3 font-semibold">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingVersionId(null); setDeleteError(""); }}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVersion}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
