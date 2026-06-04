"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

interface BlogSection {
  heading?: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

export default function AdminEditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { showToast } = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formCoverImageAlt, setFormCoverImageAlt] = useState("");
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorRole, setFormAuthorRole] = useState("");
  const [formReadTime, setFormReadTime] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSections, setFormSections] = useState<BlogSection[]>([]);
  const [uploadingTarget, setUploadingTarget] = useState<{ type: "cover" | "section"; index?: number } | null>(null);

  useEffect(() => {
    document.title = "Edit Skincare Article | Naturalist";
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/blogs/${id}`);
      if (!res.ok) throw new Error("Failed to load article draft details.");
      const blog = await res.json();
      
      setFormTitle(blog.title);
      setFormExcerpt(blog.excerpt);
      setFormCoverImage(blog.coverImage);
      setFormCoverImageAlt(blog.coverImageAlt || "");
      setFormAuthorName(blog.authorName);
      setFormAuthorRole(blog.authorRole || "");
      setFormReadTime(blog.readTime);
      setFormTags(blog.tags ? blog.tags.join(", ") : "");
      setFormFeatured(blog.featured || false);
      setFormSections(blog.sections ? JSON.parse(JSON.stringify(blog.sections)) : []);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve article.");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Blog Sections Helpers
  const addSection = () => {
    setFormSections([...formSections, { heading: "", body: "", image: "", imageAlt: "" }]);
  };

  const updateSectionField = (index: number, field: keyof BlogSection, value: string) => {
    const updated = [...formSections];
    updated[index] = { ...updated[index], [field]: value };
    setFormSections(updated);
  };

  const removeSection = (index: number) => {
    setFormSections(formSections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === formSections.length - 1) return;
    
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...formSections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFormSections(updated);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "section", index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingTarget({ type, index });
      setError("");
      
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "naturalist/blogs" }),
      });
      if (!sigRes.ok) throw new Error("Signed upload failed.");
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", "naturalist/blogs");

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!upRes.ok) throw new Error("Image upload to CDN failed.");
      const upData = await upRes.json();
      
      const proxiedUrl = proxyCloudinaryUrl(upData.secure_url);
      if (type === "cover") {
        setFormCoverImage(proxiedUrl);
      } else if (type === "section" && index !== undefined) {
        updateSectionField(index, "image", proxiedUrl);
      }

      showToast("success", "Upload complete", "Article image loaded to CDN.");

      // Log in CDN logs
      await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: proxiedUrl,
          publicId: upData.public_id,
          originalName: file.name,
          sizeBytes: file.size,
        }),
      });

    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formExcerpt || !formCoverImage || !formAuthorName || !formReadTime) {
      setError("Please complete all required base fields.");
      return;
    }

    if (formSections.length === 0 || formSections.some((s) => !s.body.trim())) {
      setError("Please write at least one section with body content.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: formTitle.trim(),
        excerpt: formExcerpt.trim(),
        coverImage: formCoverImage.trim(),
        coverImageAlt: formCoverImageAlt.trim(),
        authorName: formAuthorName.trim(),
        authorRole: formAuthorRole.trim(),
        readTime: formReadTime.trim(),
        tags: formTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
        featured: formFeatured,
        sections: formSections,
      };

      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save blog post.");

      showToast("success", "Article Updated", `${formTitle} specifications registered.`);
      router.push("/admin/blog");
    } catch (err: any) {
      setError(err.message || "Failed to save article changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#a3b2a9] font-serif">Cataloging Specifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 font-sans text-white max-w-4xl mx-auto">
      
      {/* ── Navigation Header ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/blog")}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c100e] border border-[#1a241e] hover:border-[#b07e3a]/40 text-xs font-bold text-[#a3b2a9] hover:text-white transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel & Return
        </button>
        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/20 px-3 py-1 rounded-full">
          <Sparkles className="h-3 w-3" /> Editorial Article Editor
        </span>
      </div>

      {/* ── Page Title ── */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b07e3a]">Editorial Editor</span>
        <h1 className="font-serif text-5xl font-black tracking-tight leading-none mt-1">Edit Skincare Article</h1>
        <p className="text-xs text-[#a3b2a9] mt-2">Adjust titles, author credentials, paragraphs, and specifications of <strong className="text-white font-serif">{formTitle}</strong>.</p>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3 text-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Form Card ── */}
      <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl p-6 sm:p-10 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          <div className="border-b border-[#1a241e] pb-3 mb-6">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#b07e3a]" />
              Article Specifications
            </h3>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Article Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. The Morning Hydration Ritual for Luminous Skin"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-serif font-bold placeholder-white/20"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Short Abstract / Excerpt *</label>
            <textarea
              required
              rows={2}
              placeholder="Provide a 2-3 sentence overview of what the reader will explore..."
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all resize-none leading-relaxed placeholder-white/20"
            />
          </div>

          {/* Author Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Author Full Name *</label>
              <input
                type="text"
                required
                placeholder="Alaeto Ikechukwu Miracle"
                value={formAuthorName}
                onChange={(e) => setFormAuthorName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Author Role / Title</label>
              <input
                type="text"
                placeholder="Founder & Ritual Specialist"
                value={formAuthorRole}
                onChange={(e) => setFormAuthorRole(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
          </div>

          {/* Read Time & Tags Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Read Time *</label>
              <input
                type="text"
                required
                placeholder="e.g. 5 min read"
                value={formReadTime}
                onChange={(e) => setFormReadTime(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Categories / Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. skincare, rituals, organic wellness"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
          </div>

          {/* Cover Image direct upload */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <div className="space-y-2 sm:col-span-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Cover Image URL *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Paste image URL or upload image"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
                />
                <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center">
                  {uploadingTarget?.type === "cover" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingTarget !== null}
                    onChange={(e) => handleImageUpload(e, "cover")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <label className="flex items-center gap-4 p-4 h-12 bg-[#070908] border border-[#1a241e] rounded-2xl cursor-pointer select-none hover:border-[#2d4c38]/40 transition-colors">
              <input
                type="checkbox"
                checked={formFeatured}
                onChange={(e) => setFormFeatured(e.target.checked)}
                className="h-5 w-5 rounded border-[#1a241e] text-[#2d4c38] focus:ring-0"
              />
              <div>
                <p className="font-bold text-white uppercase tracking-wider text-[10px]">Featured Post</p>
                <p className="text-[10px] text-[#a3b2a9]">Highlight top homepage banner</p>
              </div>
            </label>
          </div>

          {/* Formatted Article Section Blocks */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-[#1a241e] pb-3">
              <h4 className="font-serif text-base font-bold text-[#b07e3a]">Article Section Layouts</h4>
              <button
                type="button"
                onClick={addSection}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2d4c38]/20 hover:bg-[#2d4c38] text-white rounded-xl border border-[#2d4c38]/40 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Section Block
              </button>
            </div>

            {/* Markdown/Format Tip banner */}
            <div className="p-4 bg-[#2d4c38]/5 rounded-2xl border border-[#2d4c38]/10 text-[#a3b2a9] text-[11px] leading-relaxed">
              <span className="font-bold text-white uppercase tracking-wider text-[9px] block mb-1">Rich Paragraph & List Formatting Guidelines</span>
              Write in plain text inside body boxes. Separate paragraphs by placing double newlines (hit enter twice). 
              For bullet lists, start each line with a dash (`- Item name`). The public page parses lists and paragraphs cleanly!
            </div>

            <div className="space-y-6">
              {formSections.map((section, index) => (
                <div
                  key={index}
                  className="p-6 bg-[#070908] border border-[#1a241e] rounded-2xl space-y-4 relative group"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9]">
                    <span className="text-[#b07e3a]">Section Block #{index + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSection(index, "up")}
                        className="p-1.5 text-[#a3b2a9] hover:text-white rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === formSections.length - 1}
                        onClick={() => moveSection(index, "down")}
                        className="p-1.5 text-[#a3b2a9] hover:text-white rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/5 transition-colors ml-1 cursor-pointer"
                        title="Remove section block"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Heading */}
                  <div className="space-y-2">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Section Sub-Heading</label>
                    <input
                      type="text"
                      placeholder="e.g. Step 1: Intention Setting"
                      value={section.heading || ""}
                      onChange={(e) => updateSectionField(index, "heading", e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-serif font-bold placeholder-white/20"
                    />
                  </div>

                  {/* Section Body */}
                  <div className="space-y-2">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Section Body Text *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Section body text. Hit Enter twice for new paragraphs. Start lines with '-' for bullet points."
                      value={section.body}
                      onChange={(e) => updateSectionField(index, "body", e.target.value)}
                      className="w-full p-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all resize-none leading-relaxed placeholder-white/20"
                    />
                  </div>

                  {/* Optional Section Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Optional Section Image URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Paste image URL or upload image"
                          value={section.image || ""}
                          onChange={(e) => updateSectionField(index, "image", e.target.value)}
                          className="w-full h-11 pl-4 pr-12 rounded-xl border border-[#1a241e] bg-[#0c100e] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
                        />
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-md cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center">
                          {uploadingTarget?.type === "section" && uploadingTarget?.index === index ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingTarget !== null}
                            onChange={(e) => handleImageUpload(e, "section", index)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Image Alt Tag Description</label>
                      <input
                        type="text"
                        placeholder="Image descriptive alt text"
                        value={section.imageAlt || ""}
                        onChange={(e) => updateSectionField(index, "imageAlt", e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#1a241e]">
            <button
              type="button"
              onClick={() => router.push("/admin/blog")}
              className="h-12 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingTarget !== null}
              className="h-12 rounded-xl bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving changes...
                </>
              ) : (
                "Save Article Changes"
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
