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
import { proxyCloudinaryUrl } from "@/lib/utils";
import FormattedDate from "@/components/blog/FormattedDate";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery) {
      setDebouncedSearch("");
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    b.excerpt.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    b.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Editorial Desk</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Blog Articles</h1>
        </div>
        <a
          href="/admin/blog/new"
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)] text-decoration-none no-underline"
        >
          <Plus className="h-4 w-4" />
          Compose Article
        </a>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search by article title, slug, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
          )}
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
                        <FormattedDate date={b.publishedAt} type="date" />
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
                  <a
                    href={`/admin/blog/edit/${b._id}`}
                    className="h-9 rounded-xl border border-[#1a241e] hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white flex items-center justify-center gap-1.5 transition-all text-decoration-none no-underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Draft
                  </a>
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

    </div>
  );
}
