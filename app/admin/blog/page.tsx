"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Pencil,
  Eye,
  X,
  Upload,
  ArrowRight,
  Sparkles,
  Search
} from "lucide-react";

interface BlogSection {
  heading?: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt?: string;
  authorName: string;
  authorRole?: string;
  readTime: string;
  tags: string[];
  featured: boolean;
  sections: BlogSection[];
  publishedAt: string;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Editor Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formCoverImageAlt, setFormCoverImageAlt] = useState("");
  const [formAuthorName, setFormAuthorName] = useState("");
  const [formAuthorRole, setFormAuthorRole] = useState("Naturalist Editor");
  const [formReadTime, setFormReadTime] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSections, setFormSections] = useState<BlogSection[]>([]);

  // CDN image uploading helper state
  const [uploadingTarget, setUploadingTarget] = useState<{ type: "cover" | "section"; index?: number } | null>(null);
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    document.title = "Skincare Blog Writer | Naturalist";
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/blogs");
      if (!res.ok) throw new Error("Failed to load blog posts.");
      const data = await res.json();
      setBlogs(data);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve blog listing.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBlog(null);
    setFormTitle("");
    setFormExcerpt("");
    setFormCoverImage("");
    setFormCoverImageAlt("");
    setFormAuthorName("Alaeto Ikechukwu Miracle");
    setFormAuthorRole("Founder & Ritual Specialist");
    setFormReadTime("4 min read");
    setFormTags("skincare, rituals, wellness");
    setFormFeatured(false);
    setFormSections([
      { heading: "Rooted in Intention", body: "Every morning is a clean slate to ritualize your wellness." }
    ]);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
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
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this blog post?")) return;
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post.");
      setBlogs(blogs.filter((b) => b._id !== id));
    } catch (e: any) {
      alert(e.message || "Delete failed.");
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
      setModalError("");
      
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
      
      if (type === "cover") {
        setFormCoverImage(upData.secure_url);
      } else if (type === "section" && index !== undefined) {
        updateSectionField(index, "image", upData.secure_url);
      }

      // Log in CDN logs
      await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: upData.secure_url,
          publicId: upData.public_id,
          originalName: file.name,
          sizeBytes: file.size,
        }),
      });

    } catch (err: any) {
      setModalError(err.message || "Failed to upload image.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formExcerpt || !formCoverImage || !formAuthorName || !formReadTime) {
      setModalError("Please complete all required base fields.");
      return;
    }

    if (formSections.length === 0 || formSections.some((s) => !s.body.trim())) {
      setModalError("Please write at least one section with body content.");
      return;
    }

    try {
      setModalSaving(true);
      setModalError("");

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

      const url = editingBlog ? `/api/admin/blogs/${editingBlog._id}` : "/api/admin/blogs";
      const method = editingBlog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save blog post.");

      if (editingBlog) {
        setBlogs(blogs.map((b) => (b._id === editingBlog._id ? data : b)));
      } else {
        setBlogs([data, ...blogs]);
      }

      setShowModal(false);
    } catch (err: any) {
      setModalError(err.message || "Failed to publish blog.");
    } finally {
      setModalSaving(false);
    }
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.excerpt.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Editorial Desk</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Blog Articles</h1>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Compose Article
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search by article title, slug, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
        </div>
      </div>

      {loading && blogs.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Cataloging Manuscripts...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Failed to Load Desk</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#a3b2a9]">
              No articles recorded at the editorial desk.
            </div>
          ) : (
            filteredBlogs.map((b) => (
              <div
                key={b._id}
                className="bg-[#0c100e] border border-[#1a241e] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#b07e3a]/30 transition-all duration-300 group"
              >
                <div>
                  {/* Cover */}
                  <div className="aspect-[16/10] relative w-full bg-[#161a17]/30 overflow-hidden">
                    <img
                      src={b.coverImage || "/placeholder.jpg"}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {b.featured && (
                      <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-wider bg-[#b07e3a] px-2 py-0.5 rounded-full text-white">
                        Featured
                      </span>
                    )}

                    <span className="absolute bottom-3 right-3 text-[9px] font-bold bg-[#0c100e]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[#a3b2a9] border border-[#1a241e]">
                      {b.readTime}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-[#b07e3a] font-bold uppercase tracking-wider">
                      <span>{b.authorName}</span>
                      <span>·</span>
                      <span className="font-normal text-[#a3b2a9]">
                        {new Date(b.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-white leading-snug tracking-tight line-clamp-2 group-hover:text-[#b07e3a] transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs text-[#a3b2a9] line-clamp-3 leading-relaxed">
                      {b.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-5 border-t border-[#1a241e] grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="h-9 rounded-xl border border-[#1a241e] hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Draft
                  </button>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="h-9 rounded-xl border border-[#1a241e] hover:bg-red-500/5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* ── Editorial Composition Form Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070908]/80 backdrop-blur-md">
          <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            
            <div className="p-6 border-b border-[#1a241e] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#b07e3a]" />
                {editingBlog ? "Edit Article" : "Compose Skincare Article"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#a3b2a9] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-xs">
              
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* SECTION 1: Meta Base Fields */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a] border-b border-[#1a241e] pb-1">1. Article Metadata</h4>
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Morning Hydration Ritual for Luminous Skin"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all font-serif text-sm"
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Short Abstract / Excerpt *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Provide a 2-3 sentence overview of what the reader will explore..."
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    className="w-full p-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all resize-none"
                  />
                </div>

                {/* Author Info & Read Time & Tags Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Author Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Alaeto Ikechukwu Miracle"
                      value={formAuthorName}
                      onChange={(e) => setFormAuthorName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Author Role / Title</label>
                    <input
                      type="text"
                      placeholder="Founder & Ritual Specialist"
                      value={formAuthorRole}
                      onChange={(e) => setFormAuthorRole(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Read Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5 min read"
                      value={formReadTime}
                      onChange={(e) => setFormReadTime(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Categories / Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. skincare, rituals, organic wellness"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                    />
                  </div>
                </div>

                {/* Cover Image direct upload */}
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5 col-span-2">
                    <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Cover Image URL *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Paste image URL or upload image"
                        value={formCoverImage}
                        onChange={(e) => setFormCoverImage(e.target.value)}
                        className="w-full h-11 pl-4 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                      />
                      <label className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center">
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

                  <label className="flex items-center gap-3 p-3 h-11 bg-[#070908] border border-[#1a241e] rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-[#1a241e] text-[#2d4c38] focus:ring-0"
                    />
                    <div>
                      <p className="font-bold text-white uppercase tracking-wider text-[8px]">Featured Post</p>
                      <p className="text-[9px] text-[#a3b2a9]">Highlight top banner</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 2: Dynamic Formatted Section Blocks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1a241e] pb-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">2. Formatted Article Sections (No HTML)</h4>
                  <button
                    type="button"
                    onClick={addSection}
                    className="flex items-center gap-1 px-3 py-1 bg-[#2d4c38]/20 hover:bg-[#2d4c38] text-white rounded-lg border border-[#2d4c38]/40 text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    <Plus className="h-3 w-3" /> Add Block
                  </button>
                </div>

                <div className="space-y-4">
                  {formSections.map((section, index) => (
                    <div
                      key={index}
                      className="p-4 bg-[#070908] border border-[#1a241e] rounded-2xl space-y-3 relative group"
                    >
                      {/* Section actions header */}
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9]">
                        <span>Section Block #{index + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveSection(index, "up")}
                            className="p-1 text-[#a3b2a9] hover:text-white rounded hover:bg-white/5 transition-colors disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formSections.length - 1}
                            onClick={() => moveSection(index, "down")}
                            className="p-1 text-[#a3b2a9] hover:text-white rounded hover:bg-white/5 transition-colors disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSection(index)}
                            className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-500/5 transition-colors ml-1"
                            title="Remove section block"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Section Heading */}
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          placeholder="Section Heading (optional) - e.g. Step 1: Intention Setting"
                          value={section.heading || ""}
                          onChange={(e) => updateSectionField(index, "heading", e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-[#1a241e] bg-[#0c100e] text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold font-serif"
                        />
                      </div>

                      {/* Section Body */}
                      <div className="space-y-1.5">
                        <textarea
                          required
                          rows={4}
                          placeholder="Section body text. Write plain, paragraphs are separated by new lines. No raw HTML tags."
                          value={section.body}
                          onChange={(e) => updateSectionField(index, "body", e.target.value)}
                          className="w-full p-3.5 rounded-xl border border-[#1a241e] bg-[#0c100e] text-white focus:outline-none focus:border-[#b07e3a] transition-all resize-none leading-relaxed"
                        />
                      </div>

                      {/* Optional Section Image */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Optional Image URL"
                            value={section.image || ""}
                            onChange={(e) => updateSectionField(index, "image", e.target.value)}
                            className="w-full h-10 pl-3 pr-8 rounded-xl border border-[#1a241e] bg-[#0c100e] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                          />
                          <label className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-md cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center">
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
                        <input
                          type="text"
                          placeholder="Image descriptive alt text"
                          value={section.imageAlt || ""}
                          onChange={(e) => updateSectionField(index, "imageAlt", e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl border border-[#1a241e] bg-[#0c100e] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                        />
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a241e]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-11 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving || uploadingTarget !== null}
                  className="h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {modalSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                    </>
                  ) : (
                    "Publish Article"
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
