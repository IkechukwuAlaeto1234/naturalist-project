"use client";

/**
 * PDF Layout Editor
 * /admin/pages/pdf-layout/[pageKey]
 *
 * Visual drag-between-pages editor for legal PDF section order.
 * Sections are displayed as cards grouped by simulated page.
 * User can drag sections between pages or use ↑↓ arrows to reorder.
 * "Save Layout" persists the section order to DB.
 * "Preview PDF" generates and downloads the current arrangement.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronUp, ChevronDown, ArrowLeft, Save, Loader2,
  Download, GripVertical, FileText, CheckCircle2, AlertCircle,
  ArrowRight, RotateCcw,
} from "lucide-react";
import { generateLegalPDF } from "@/lib/generateLegalPDF";

// ── Section line estimator ────────────────────────────────────────────────────
// ~38 lines fit per A4 content page. Used to auto-paginate the preview.
const APPROX_LINES_PER_PAGE = 38;

interface Section {
  heading: string;
  body: string | string[];
}

function estimateLines(section: Section): number {
  const body = section.body;
  const text = Array.isArray(body) ? body.join(" ") : body;
  const bodyLines = Math.ceil(text.length / 90) + (Array.isArray(body) ? (body as string[]).length * 0.5 : 0);
  return 1 + Math.max(1, bodyLines) + 2;
}

function paginateSections(sections: Section[]): Section[][] {
  const pages: Section[][] = [];
  let page: Section[] = [];
  let used = 0;
  for (const s of sections) {
    const lines = estimateLines(s);
    if (used + lines > APPROX_LINES_PER_PAGE && page.length > 0) {
      pages.push(page); page = [s]; used = lines;
    } else { page.push(s); used += lines; }
  }
  if (page.length > 0) pages.push(page);
  return pages;
}

function flatIndex(pages: Section[][], pageIdx: number, itemIdx: number): number {
  let idx = 0;
  for (let p = 0; p < pageIdx; p++) idx += pages[p].length;
  return idx + itemIdx;
}

export default function PdfLayoutEditor() {
  const params  = useParams();
  const router  = useRouter();
  const pageKey = params?.pageKey as string;

  const [sections,   setSections]   = useState<Section[]>([]);
  const [metadata,   setMetadata]   = useState<any>({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const [dragSrc,    setDragSrc]    = useState<{ p: number; i: number } | null>(null);
  const [dragOver,   setDragOver]   = useState<{ p: number; i: number } | null>(null);

  const loadData = useCallback(() => {
    if (!pageKey) return;
    setLoading(true);
    fetch(`/api/admin/content?key=${pageKey}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.metadata) {
          setSections(Array.isArray(data.metadata.sections) ? data.metadata.sections : []);
          setMetadata(data.metadata);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const pages = paginateSections(sections);

  const moveSection = useCallback((from: number, to: number) => {
    if (from === to) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSections(next);
    setSaved(false);
  }, [sections]);

  const moveUp   = (pi: number, ii: number) => { const f = flatIndex(pages, pi, ii); if (f > 0) moveSection(f, f - 1); };
  const moveDown = (pi: number, ii: number) => { const f = flatIndex(pages, pi, ii); if (f < sections.length - 1) moveSection(f, f + 1); };

  const onDragStart = (e: React.DragEvent, p: number, i: number) => { setDragSrc({ p, i }); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver  = (e: React.DragEvent, p: number, i: number) => { e.preventDefault(); setDragOver({ p, i }); };
  const onDrop      = (e: React.DragEvent, p: number, i: number) => {
    e.preventDefault();
    if (!dragSrc) return;
    moveSection(flatIndex(pages, dragSrc.p, dragSrc.i), flatIndex(pages, p, i));
    setDragSrc(null); setDragOver(null);
  };
  const onDragEnd = () => { setDragSrc(null); setDragOver(null); };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: pageKey, title: metadata.title || pageKey, body: "", metadata: { ...metadata, sections }, isNewVersion: false }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Save failed"); }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handlePreviewPDF = async () => {
    setGenerating(true);
    try {
      await generateLegalPDF({
        title:         metadata.title        || "Terms of Service",
        eyebrow:       "Legal",
        subtitle:      metadata.subtitle     || "",
        effectiveDate: metadata.effectiveDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        sections,
        filename:      `naturalist-${pageKey}-layout-preview.pdf`,
        siteUrl:       typeof window !== "undefined" ? window.location.origin : undefined,
        contactUrl:    typeof window !== "undefined" ? `${window.location.origin}/p/contact` : undefined,
        contactEmail:  "hello@naturalist.com",
        year:          new Date().getFullYear(),
      });
    } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const docTitle = metadata.title || pageKey;

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button onClick={() => router.push("/admin/pages")} className="flex items-center gap-1.5 text-xs text-[#a3b2a9] hover:text-white mb-3 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Pages
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">PDF Layout Editor</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">{docTitle}</h1>
          <p className="text-xs text-[#a3b2a9] mt-1 max-w-xl">
            Drag a section card to reorder it, or use the ↑↓ arrows. Page breaks update live. Save when perfect, then preview the PDF.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <button onClick={loadData} title="Reset to saved version"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white border border-[#1a241e] px-3 py-2 rounded-full hover:bg-white/5 transition-all">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button onClick={handlePreviewPDF} disabled={generating || loading}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white border border-[#1a241e] px-3 py-2 rounded-full hover:bg-white/5 transition-all disabled:opacity-50">
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Preview PDF
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#b07e3a] hover:bg-[#9a6e30] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </div>

      {/* Status banners */}
      {saved && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4" /> Section order saved — layout is now live in the PDF.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] uppercase tracking-wider">Loading sections…</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1a241e] p-12 text-center">
          <FileText className="h-10 w-10 text-[#a3b2a9] mx-auto mb-3" />
          <p className="text-sm text-[#a3b2a9]">No sections found. Add sections in the page editor first.</p>
          <button onClick={() => router.push(`/admin/pages/edit/${pageKey}`)} className="flex items-center gap-1.5 text-xs font-bold text-[#b07e3a] hover:underline mx-auto mt-4">
            Go to Page Editor <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {pages.map((pageSections, pageIdx) => (
            <div key={pageIdx}>
              {/* Page label */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-7 w-7 rounded-full bg-[#b07e3a]/15 border border-[#b07e3a]/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-black text-[#b07e3a]">{pageIdx + 1}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a3b2a9]">
                  Page {pageIdx + 1} &mdash; approx {pageSections.reduce((a, s) => a + estimateLines(s), 0)} lines
                </span>
                <div className="flex-1 h-px bg-[#1a241e]" />
              </div>

              {/* Section cards */}
              <div className="flex flex-col gap-2 pl-10">
                {pageSections.map((section, itemIdx) => {
                  const fi       = flatIndex(pages, pageIdx, itemIdx);
                  const isDrag   = dragSrc?.p === pageIdx && dragSrc?.i === itemIdx;
                  const isOver   = dragOver?.p === pageIdx && dragOver?.i === itemIdx;
                  const isBullet = Array.isArray(section.body);
                  const preview  = isBullet
                    ? (section.body as string[]).slice(0, 2).join(" · ") + ((section.body as string[]).length > 2 ? " …" : "")
                    : (section.body as string).slice(0, 140) + ((section.body as string).length > 140 ? "…" : "");

                  return (
                    <div
                      key={fi}
                      draggable
                      onDragStart={(e) => onDragStart(e, pageIdx, itemIdx)}
                      onDragOver={(e)  => onDragOver(e, pageIdx, itemIdx)}
                      onDrop={(e)      => onDrop(e, pageIdx, itemIdx)}
                      onDragEnd={onDragEnd}
                      className={`group flex items-start gap-3 p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                        isDrag   ? "opacity-40 border-[#b07e3a]/40 bg-[#b07e3a]/5 scale-95"
                        : isOver ? "border-[#b07e3a] bg-[#b07e3a]/8 scale-[1.01]"
                        : "border-[#1a241e] bg-[#0c100e] hover:border-[#2a3a2e]"
                      }`}
                    >
                      <div className="mt-0.5 text-[#2a3a2e] group-hover:text-[#4a5c50] transition-colors flex-shrink-0">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white truncate">{section.heading}</span>
                          {isBullet && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#b07e3a] bg-[#b07e3a]/10 px-1.5 py-0.5 rounded flex-shrink-0">bullets</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#4a5c50] leading-relaxed line-clamp-2">{preview}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button type="button" onClick={() => moveUp(pageIdx, itemIdx)} disabled={fi === 0}
                          className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/[0.03] border border-[#1a241e] text-[#a3b2a9] hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => moveDown(pageIdx, itemIdx)} disabled={fi === sections.length - 1}
                          className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/[0.03] border border-[#1a241e] text-[#a3b2a9] hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Page break indicator */}
              {pageIdx < pages.length - 1 && (
                <div className="flex items-center gap-3 mt-5 pl-10">
                  <div className="flex-1 h-px border-t border-dashed border-[#1a241e]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#2a3a2e]">— page break —</span>
                  <div className="flex-1 h-px border-t border-dashed border-[#1a241e]" />
                </div>
              )}
            </div>
          ))}

          {/* Bottom bar */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-[#1a241e] bg-[#0c100e]">
            <div>
              <p className="text-xs font-bold text-white">{sections.length} sections · {pages.length} pages</p>
              <p className="text-[10px] text-[#4a5c50] mt-0.5">Drag or use arrows to reorder. Page breaks update automatically based on content length.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePreviewPDF} disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#1a241e] text-xs font-bold text-[#a3b2a9] hover:text-white transition-all disabled:opacity-50">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Preview PDF
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#b07e3a] hover:bg-[#9a6e30] text-xs font-bold text-white transition-all disabled:opacity-60">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : "Save Layout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
