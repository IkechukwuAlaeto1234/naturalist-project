"use client";

import React, { useEffect, useState } from "react";
import { LayoutPanelTop, ArrowRight, Home, ShoppingBag, Package, BookOpen, Leaf, Globe, Plus, ExternalLink, Loader2, ShieldCheck, Scale, Cookie, Undo2, Trash2, AlertTriangle } from "lucide-react";

const BUILT_IN_PAGES = [
  { key: "home", label: "Home Page", path: "/", icon: Home, description: "Hero headline, subtext, brand philosophy quote, commitment section, and all feature text." },
  { key: "shop", label: "Shop Page", path: "/shop", icon: ShoppingBag, description: "Hero tagline, headline, subtext, and empty state messages." },
  { key: "bundles", label: "Ritual Bundles", path: "/bundles", icon: Package, description: "Hero tagline, headline, subtext, and empty state messages." },
  { key: "story", label: "Our Story", path: "/story", icon: BookOpen, description: "Opening quote, timeline milestones, brand values, CTA section, and all images." },
  { key: "sustainability", label: "Sustainability", path: "/sustainability", icon: Leaf, description: "Hero, sustainability pillars, stats bar, CTA section, and all images." },
  { key: "blog", label: "Blog Page", path: "/blog", icon: Globe, description: "Hero tagline, headline, and subtext for the blog journal index." },
  { key: "privacy-policy", label: "Privacy Policy", path: "/privacy-policy", icon: ShieldCheck, description: "Effective date, policy sections, and PDF download." },
  { key: "terms", label: "Terms of Service", path: "/terms", icon: Scale, description: "Effective date, service agreement sections, and PDF download." },
  { key: "cookie-policy", label: "Cookie Policy", path: "/cookie-policy", icon: Cookie, description: "Effective date, cookie types, and data processing sections." },
  { key: "refund-policy", label: "Refund Policy", path: "/refund-policy", icon: Undo2, description: "Effective date, returns and refund steps sections." },
];

export default function AdminPagesPage() {
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/custom-pages", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCustomPages(Array.isArray(data) ? data : []))
      .catch(() => setCustomPages([]))
      .finally(() => setLoadingCustom(false));
  }, []);

  const handleDeletePage = async () => {
    if (!deletingSlug) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/custom-pages?slug=${deletingSlug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCustomPages((prev) => prev.filter((p) => p.metadata?.slug !== deletingSlug));
        setDeletingSlug(null);
      } else {
        alert("Failed to delete page.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Content Management</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Page Editor</h1>
          <p className="text-xs text-[#a3b2a9] mt-1 max-w-xl">
            Edit existing pages or create entirely new ones. Changes go live immediately.
          </p>
        </div>
        <a
          href="/admin/pages/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b07e3a] hover:bg-[#9a6e30] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" /> Create New Page
        </a>
      </div>

      {/* Built-in Pages */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a3b2a9] mb-4">Built-In Pages</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILT_IN_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <div
                key={page.key}
                className="group flex flex-col gap-4 p-6 bg-[#0c100e] border border-[#1a241e] rounded-2xl hover:border-[#b07e3a]/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 bg-[#b07e3a]/10 rounded-xl flex items-center justify-center text-[#b07e3a] border border-[#b07e3a]/20 group-hover:scale-105 transition-transform flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] bg-white/[0.03] border border-[#1a241e] px-2.5 py-1 rounded-full">
                    {page.path}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-lg font-bold text-white">{page.label}</h2>
                  <p className="text-xs text-[#a3b2a9] mt-1.5 leading-relaxed">{page.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-[#1a241e] pt-3.5 mt-2">
                  <a
                    href={`/admin/pages/edit/${page.key}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#b07e3a] hover:opacity-85 transition-opacity"
                  >
                    Edit Page <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`/admin/pages/history/${page.key}`}
                    className="text-xs font-semibold text-[#a3b2a9] hover:text-white hover:underline transition-colors"
                  >
                    History
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Pages */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a3b2a9] mb-4">Custom Pages</p>
        {loadingCustom ? (
          <div className="flex items-center gap-2 text-xs text-[#a3b2a9] py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading custom pages…
          </div>
        ) : customPages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1a241e] p-8 text-center">
            <p className="text-xs text-[#a3b2a9]">No custom pages yet.</p>
            <a href="/admin/pages/new" className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-[#b07e3a] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Create your first custom page
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customPages.map((page: any) => (
              <div key={page._id} className="flex flex-col gap-4 p-6 bg-[#0c100e] border border-[#1a241e] rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 bg-[#2d4c38]/10 rounded-xl flex items-center justify-center text-emerald-400 border border-[#2d4c38]/20 flex-shrink-0">
                    <LayoutPanelTop className="h-5 w-5" />
                  </div>
                  <a
                    href={`/p/${page.metadata?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-[#a3b2a9] hover:text-white border border-[#1a241e] px-2.5 py-1 rounded-full transition-colors"
                  >
                    /p/{page.metadata?.slug} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-lg font-bold text-white">{page.title}</h2>
                  <p className="text-xs text-[#a3b2a9] mt-1">
                    {page.metadata?.sections?.length || 0} content section{page.metadata?.sections?.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-[#1a241e] pt-3">
                  <a
                    href={`/admin/pages/edit-custom/${page.metadata?.slug}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#b07e3a] hover:gap-2 transition-all"
                  >
                    Edit Page <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => setDeletingSlug(page.metadata?.slug)}
                    className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-[#2d4c38]/30 bg-[#2d4c38]/5 p-5 flex gap-4 items-start">
        <div className="h-8 w-8 rounded-lg bg-[#2d4c38]/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
          <LayoutPanelTop className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Fallback Content</p>
          <p className="text-xs text-[#a3b2a9] mt-1 leading-relaxed">
            Built-in pages show default content until you edit them here. Once saved, the database version takes priority. Clear any field and save to reset it to its default.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl p-6 max-w-sm w-full text-center space-y-5">
            <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto border border-red-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Delete Custom Page?</h3>
              <p className="text-xs text-[#a3b2a9] mt-2 leading-relaxed">
                Are you sure you want to permanently delete the custom page <span className="text-white font-semibold">/p/{deletingSlug}</span>? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingSlug(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePage}
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
