"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  Loader2,
  AlertCircle,
  Copy,
  Trash2,
  Upload,
  Check,
  RefreshCw,
  Search,
  ExternalLink
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";

interface CdnImage {
  _id: string;
  url: string;
  publicId: string;
  originalName: string;
  sizeBytes?: number;
  createdAt: string;
}

export default function AdminCdnPage() {
  const [images, setImages] = useState<CdnImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    document.title = "CDN Media Assets Management | Naturalist";
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/cdn");
      if (!res.ok) throw new Error("Failed to load CDN asset list.");
      const data = await res.json();
      setImages(data);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve CDN images.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      
      // Get signed upload signature from api
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "naturalist/cdn" }),
      });
      if (!sigRes.ok) throw new Error("Failed to get signature.");
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", "naturalist/cdn");

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!upRes.ok) throw new Error("Cloudinary upload failed.");
      const upData = await upRes.json();
      
      // Save log in our DB
      const saveRes = await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: proxyCloudinaryUrl(upData.secure_url),
          publicId: upData.public_id,
          originalName: file.name,
          sizeBytes: file.size,
        }),
      });
      const data = await saveRes.json();
      if (!saveRes.ok) throw new Error("Failed to save asset log.");

      setImages([data, ...images]);
    } catch (err: any) {
      setError(err.message || "Asset upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image record from the local catalogue database?")) return;
    try {
      const res = await fetch(`/api/admin/cdn/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setImages(images.filter((img) => img._id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to remove image record.");
    }
  };

  const filteredImages = images.filter((img) =>
    img.originalName.toLowerCase().includes(search.toLowerCase()) ||
    img.publicId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Media Assets Repository</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">CDN Uploads</h1>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={fetchImages}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-xs font-bold text-[#a3b2a9] hover:text-white transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync Registry
          </button>
          
          <label className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)] cursor-pointer select-none">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search assets by file name or Cloudinary Public ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
        </div>
      </div>

      {loading && images.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Syncing Asset Registry...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Asset Synchronization Failed</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredImages.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#a3b2a9] text-sm">
              No media assets recorded in local repository matching filters.
            </div>
          ) : (
            filteredImages.map((img) => {
              const sizeMB = img.sizeBytes ? (img.sizeBytes / (1024 * 1024)).toFixed(2) : "0.00";
              const isCopied = copiedId === img._id;
              
              return (
                <div
                  key={img._id}
                  className="bg-[#0c100e] border border-[#1a241e] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#b07e3a]/30 transition-all duration-300 group relative"
                >
                  {/* Aspect Square Image Thumbnail */}
                  <div className="aspect-square w-full bg-[#161a17]/30 overflow-hidden relative">
                    <img
                      src={img.url}
                      alt={img.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Copy Link overlay */}
                    <div className="absolute inset-0 bg-[#070908]/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2.5 transition-all duration-300">
                      <button
                        onClick={() => handleCopyLink(img.url, img._id)}
                        className={`h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          isCopied
                            ? "bg-emerald-500 text-white"
                            : "bg-[#2d4c38] text-white hover:bg-[#3a6349]"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" /> Copy URL
                          </>
                        )}
                      </button>

                      <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                        title="View Asset in Browser"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Description Details */}
                  <div className="p-3 text-[10px] space-y-1 bg-[#090d0b]">
                    <p className="font-semibold text-white truncate" title={img.originalName}>
                      {img.originalName}
                    </p>
                    <div className="flex justify-between text-[#a3b2a9] text-[9px] pt-1">
                      <span>{sizeMB} MB</span>
                      <button
                        onClick={() => handleDeleteImage(img._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete log record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
