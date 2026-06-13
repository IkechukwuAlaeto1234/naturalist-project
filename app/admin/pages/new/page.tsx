"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
  FileText, Upload, Link2, Plus, Trash2, AlertTriangle,
  ChevronUp, ChevronDown,
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";
import ErrorModal from "@/components/ui/ErrorModal";

/* ─── Types ─────────────────────────────────────────────────────── */

interface Section {
  type: "text" | "image" | "richtext" | "cta";
  label: string;
  value: string;
  image?: string;
}

/* ─── Inline ImageUpload for new page sections ───────────────────── */

function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [urlInput, setUrlInput] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [proxying, setProxying] = useState(false);
  const [err, setErr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const isExternal =
    !!urlInput &&
    !urlInput.startsWith("/cdn/") &&
    !urlInput.includes("res.cloudinary.com") &&
    !urlInput.startsWith("/");

  const commit = (url: string) => { setUrlInput(url); onChange(url); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr("");
    try {
      const sigRes = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder: "naturalist/pages" }) });
      if (!sigRes.ok) throw new Error("Signature error");
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();
      const fd = new FormData();
      fd.append("file", file); fd.append("api_key", apiKey); fd.append("signature", signature);
      fd.append("timestamp", String(timestamp)); fd.append("folder", "naturalist/pages");
      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      if (!upRes.ok) throw new Error("Upload failed");
      const upData = await upRes.json();
      const proxied = proxyCloudinaryUrl(upData.secure_url);
      commit(proxied);

      // Log in CDN registry
      await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: proxied,
          publicId: upData.public_id,
          originalName: file.name,
          sizeBytes: file.size,
        }),
      }).catch(() => {});
    } catch (e: any) {
      const msg = e.message || "Failed to process image";
      setErr(msg);
      setModalMsg(msg);
      setModalOpen(true);
    }
    finally { setUploading(false); }
  };

  const handleProxy = async () => {
    setProxying(true); setErr("");
    try {
      const res = await fetch("/api/admin/content/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: urlInput }) });
      if (!res.ok) throw new Error((await res.json()).error || "Proxy failed");
      const data = await res.json();
      const proxied = proxyCloudinaryUrl(data.url);
      commit(proxied);

      // Log in CDN registry
      await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: proxied,
          publicId: data.publicId,
          originalName: urlInput.split("/").pop() || "proxied_image",
          sizeBytes: data.sizeBytes || 0,
        }),
      }).catch(() => {});
    } catch (e: any) {
      const msg = e.message || "Failed to process image";
      setErr(msg);
      setModalMsg(msg);
      setModalOpen(true);
    }
    finally { setProxying(false); }
  };

  return (
    <div className="flex flex-col gap-2">
      {urlInput && (
        <div className="relative rounded-lg overflow-hidden border border-[#1a241e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlInput} alt="" className="w-full object-cover max-h-40" onError={(e) => (e.currentTarget.style.display = "none")} />
          {isExternal && <div className="absolute top-1 right-1 flex items-center gap-1 bg-amber-500/90 text-black text-[8px] font-black px-2 py-0.5 rounded-full"><AlertTriangle className="h-2.5 w-2.5" /> External</div>}
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#4a5c50]" />
          <input type="text" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); onChange(e.target.value); }} placeholder="Paste URL or upload" className="w-full pl-7 py-2 bg-[#070908] border border-[#1a241e] rounded-lg text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />
        </div>
        <label className="flex items-center px-2.5 py-2 rounded-lg border border-[#1a241e] bg-[#070908] text-[#a3b2a9] hover:text-white cursor-pointer transition-all">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <input type="file" accept="image/*" disabled={uploading} onChange={handleFile} className="hidden" />
        </label>
      </div>
      {isExternal && (
        <button type="button" onClick={handleProxy} disabled={proxying} className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit transition-all hover:bg-amber-500/20 disabled:opacity-60">
          {proxying && <Loader2 className="h-3 w-3 animate-spin" />} Move to CDN
        </button>
      )}
      {err && <p className="text-[10px] text-red-400">{err}</p>}

      {/* Clean error modal popup */}
      <ErrorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Image Upload Failed"
        message={modalMsg}
        actionText="Close"
      />
    </div>
  );
}

/* ─── New Page Form ──────────────────────────────────────────────── */

export default function NewPagePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubtext, setHeroSubtext] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showInNavbar, setShowInNavbar] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (v: string) => {
    setTitle(v);
    setSlug(
      v.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
    );
  };

  const addSection = (type: Section["type"]) => {
    let defaultLabel = "Text Block";
    if (type === "image") defaultLabel = "Image";
    else if (type === "richtext") defaultLabel = "Rich Content";
    else if (type === "cta") defaultLabel = "Call to Action";
    
    let defaultValue = "";
    if (type === "cta") {
      defaultValue = JSON.stringify({ headline: "", subtext: "", buttonText: "", buttonUrl: "" });
    }

    setSections((prev) => [...prev, { type, label: defaultLabel, value: defaultValue }]);
  };

  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));
  const moveSection = (index: number, direction: "up" | "down") => {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };
  const updateSection = (i: number, field: keyof Section, val: string) => {
    setSections((prev) => { const next = [...prev]; next[i] = { ...next[i], [field]: val }; return next; });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) { setError("Title and URL slug are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: `page-${slug}`,
          title,
          body: "",
          metadata: {
            isCustomPage: true,
            slug,
            showInNavbar,
            heroHeadline,
            heroSubtext,
            heroImage,
            sections,
            publishedAt: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create"); }
      setSaved(true);
      setTimeout(() => router.push(`/admin/pages`), 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <button onClick={() => router.push("/admin/pages")} className="flex items-center gap-1.5 text-xs text-[#a3b2a9] hover:text-white mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> All Pages
        </button>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Content Management</span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Create New Page</h1>
        <p className="text-xs text-[#a3b2a9] mt-1">Your page will be accessible at <span className="text-[#b07e3a]">/p/{slug || "your-slug"}</span></p>
      </div>

      {/* Status */}
      {saved && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4" /> Page created! Redirecting…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">

        {/* Title & Slug */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Page Identity</p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#a3b2a9] uppercase tracking-wider">Page Title *</label>
            <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Returns & Exchanges" required className="bg-[#070908] border border-[#1a241e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#a3b2a9] uppercase tracking-wider">URL Slug *</label>
            <div className="flex items-center">
              <span className="bg-[#0a0e0b] border border-r-0 border-[#1a241e] rounded-l-xl px-3 py-3 text-xs text-[#4a5c50] flex-shrink-0">/p/</span>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="returns-exchanges" required className="flex-1 bg-[#070908] border border-[#1a241e] rounded-r-xl px-4 py-3 text-sm text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="showInNavbar"
                checked={showInNavbar}
                onChange={(e) => setShowInNavbar(e.target.checked)}
                className="h-4 w-4 rounded border-[#1a241e] bg-[#070908] text-[#b07e3a] focus:ring-[#b07e3a]/60 cursor-pointer"
              />
              <label htmlFor="showInNavbar" className="text-xs font-bold text-[#a3b2a9] uppercase tracking-wider cursor-pointer select-none">Show in Navbar navigation menu</label>
            </div>
            <p className="text-[10px] text-[#4a5c50]">Public URL: <span className="text-[#a3b2a9]">/p/{slug || "your-slug"}</span></p>
          </div>
        </div>

        {/* Hero section */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Hero Section</p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#a3b2a9] uppercase tracking-wider">Hero Headline</label>
            <input type="text" value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="Your page headline" className="bg-[#070908] border border-[#1a241e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#a3b2a9] uppercase tracking-wider">Hero Subtext</label>
            <textarea value={heroSubtext} onChange={(e) => setHeroSubtext(e.target.value)} placeholder="A short description of this page..." rows={2} className="bg-[#070908] border border-[#1a241e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[#a3b2a9] uppercase tracking-wider">Hero Background Image</label>
            <ImageUpload value={heroImage} onChange={setHeroImage} />
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Page Content Sections</p>

          {sections.length === 0 && (
            <p className="text-xs text-[#4a5c50] text-center py-4 border border-dashed border-[#1a241e] rounded-xl">
              No sections yet. Add content blocks below.
            </p>
          )}

          {sections.map((section, i) => (
            <div key={i} className="border border-[#1a241e] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={section.label}
                  onChange={(e) => updateSection(i, "label", e.target.value)}
                  placeholder="Section label"
                  className="bg-transparent text-xs font-bold text-[#b07e3a] uppercase tracking-wider placeholder-[#4a5c50] focus:outline-none border-b border-transparent focus:border-[#b07e3a]/40 pb-0.5 transition-colors w-48"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveSection(i, "up")}
                    disabled={i === 0}
                    className="text-[#a3b2a9] hover:text-white disabled:opacity-30 disabled:hover:text-[#a3b2a9] transition-colors p-1"
                    title="Move Up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(i, "down")}
                    disabled={i === sections.length - 1}
                    className="text-[#a3b2a9] hover:text-white disabled:opacity-30 disabled:hover:text-[#a3b2a9] transition-colors p-1"
                    title="Move Down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeSection(i)} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Delete Block">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {section.type === "text" && (
                <div className="flex flex-col gap-3">
                  <textarea value={section.value} onChange={(e) => updateSection(i, "value", e.target.value)} placeholder="Write your content here..." rows={4} className="bg-[#070908] border border-[#1a241e] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none leading-relaxed" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Optional Section Image</label>
                    <ImageUpload value={section.image || ""} onChange={(v) => updateSection(i, "image", v)} />
                  </div>
                </div>
              )}
              {section.type === "richtext" && (
                <div className="flex flex-col gap-3">
                  <textarea value={section.value} onChange={(e) => updateSection(i, "value", e.target.value)} placeholder="Write rich content (supports basic markdown: **bold**, *italic*, [link](url))..." rows={6} className="bg-[#070908] border border-[#1a241e] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none leading-relaxed font-mono" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Optional Section Image</label>
                    <ImageUpload value={section.image || ""} onChange={(v) => updateSection(i, "image", v)} />
                  </div>
                </div>
              )}
              {section.type === "image" && (
                <ImageUpload value={section.value} onChange={(v) => updateSection(i, "value", v)} />
              )}
              {section.type === "cta" && (() => {
                let ctaData = { headline: "", subtext: "", buttonText: "", buttonUrl: "" };
                try {
                  if (section.value) {
                    ctaData = JSON.parse(section.value);
                  }
                } catch (e) {}

                const updateCta = (field: string, val: string) => {
                  const updated = { ...ctaData, [field]: val };
                  updateSection(i, "value", JSON.stringify(updated));
                };

                return (
                  <div className="flex flex-col gap-3 bg-[#070908] p-4 rounded-xl border border-[#1a241e]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Headline</label>
                        <input
                          type="text"
                          value={ctaData.headline}
                          onChange={(e) => updateCta("headline", e.target.value)}
                          placeholder="e.g. Join the Skincare Revolution"
                          className="w-full px-3 py-2 bg-[#0c100e] border border-[#1a241e] rounded-lg text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Button Text</label>
                        <input
                          type="text"
                          value={ctaData.buttonText}
                          onChange={(e) => updateCta("buttonText", e.target.value)}
                          placeholder="e.g. Shop Now"
                          className="w-full px-3 py-2 bg-[#0c100e] border border-[#1a241e] rounded-lg text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Button Link (URL)</label>
                      <input
                        type="text"
                        value={ctaData.buttonUrl}
                        onChange={(e) => updateCta("buttonUrl", e.target.value)}
                        placeholder="e.g. /shop or https://..."
                        className="w-full px-3 py-2 bg-[#0c100e] border border-[#1a241e] rounded-lg text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Subtext</label>
                      <textarea
                        value={ctaData.subtext}
                        onChange={(e) => updateCta("subtext", e.target.value)}
                        placeholder="e.g. Experience organic beauty crafted with absolute precision."
                        rows={2}
                        className="w-full px-3 py-2 bg-[#0c100e] border border-[#1a241e] rounded-lg text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 resize-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#a3b2a9] uppercase tracking-wider">Optional Section Image (Splits layout side-by-side)</label>
                      <ImageUpload value={section.image || ""} onChange={(v) => updateSection(i, "image", v)} />
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}

          {/* Add section buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => addSection("text")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#b07e3a]/30 text-[10px] font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all uppercase tracking-wider">
              <Plus className="h-3 w-3" /> Text Block
            </button>
            <button type="button" onClick={() => addSection("richtext")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#b07e3a]/30 text-[10px] font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all uppercase tracking-wider">
              <FileText className="h-3 w-3" /> Rich Text
            </button>
            <button type="button" onClick={() => addSection("image")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#b07e3a]/30 text-[10px] font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all uppercase tracking-wider">
              <Upload className="h-3 w-3" /> Image
            </button>
            <button type="button" onClick={() => addSection("cta")} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[#b07e3a]/30 text-[10px] font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all uppercase tracking-wider">
              <Plus className="h-3 w-3" /> CTA Block
            </button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={saving || !title || !slug} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#b07e3a] hover:bg-[#9a6e30] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Creating Page…" : "Publish New Page"}
        </button>
      </form>
    </div>
  );
}
