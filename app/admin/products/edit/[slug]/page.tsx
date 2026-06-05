"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Package,
  Loader2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Sparkles,
  Check
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { useToast } from "@/context/ToastContext";

const formCategoryOptions = [
  { value: "skincare", label: "Skincare" },
  { value: "wellness", label: "Wellness" },
  { value: "ritual", label: "Rituals" },
];

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { showToast } = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formComparePrice, setFormComparePrice] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState("skincare");
  const [formStock, setFormStock] = useState("50");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    document.title = "Edit Skincare Product | Naturalist";
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) throw new Error("Failed to load formulation details.");
      const product = await res.json();
      
      setFormName(product.name);
      setFormDescription(product.description || "");
      setFormPrice(String(product.price));
      setFormComparePrice(product.compareAtPrice ? String(product.compareAtPrice) : "");
      setFormImage(product.images?.[0] || product.image || "");
      setFormCategory(product.category);
      setFormStock(String(product.stock));
      setFormIsActive(product.isActive);
      setFormIsFeatured(product.isFeatured || false);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve formulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setError("");
      
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "naturalist/products" }),
      });
      if (!sigRes.ok) throw new Error("CDN signature failure.");
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", "naturalist/products");

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!upRes.ok) throw new Error("CDN upload execution failed.");
      const upData = await upRes.json();
      
      const proxiedUrl = proxyCloudinaryUrl(upData.secure_url);
      setFormImage(proxiedUrl);
      showToast("success", "Upload complete", "Formulation photo loaded to CDN.");

      // Log in CDN registry logs
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
      setError(err.message || "Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDescription || !formPrice || !formImage || !formStock) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        price: parseFloat(formPrice),
        compareAtPrice: formComparePrice ? parseFloat(formComparePrice) : undefined,
        images: [formImage.trim()],
        category: formCategory,
        stock: parseInt(formStock),
        isActive: formIsActive,
        isFeatured: formIsFeatured,
      };

      const res = await fetch(`/api/products/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update formulation catalog entry.");

      showToast("success", "Formulation Updated", `${formName} specifications registered.`);
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || "Failed to update formulation.");
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
          onClick={() => router.push("/admin/products")}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c100e] border border-[#1a241e] hover:border-[#b07e3a]/40 text-xs font-bold text-[#a3b2a9] hover:text-white transition-all shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel & Return
        </button>
        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/20 px-3 py-1 rounded-full">
          <Sparkles className="h-3 w-3" /> Formulation Specification Editor
        </span>
      </div>

      {/* ── Page Title ── */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b07e3a]">Catalog Editor</span>
        <h1 className="font-serif text-5xl font-black tracking-tight leading-none mt-1">Edit Formulation</h1>
        <p className="text-xs text-[#a3b2a9] mt-2">Adjust pricing, catalog listings, photo files, and details of <strong className="text-white font-serif">{formName}</strong>.</p>
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
              <Package className="h-5 w-5 text-[#b07e3a]" />
              Formulation Specifications
            </h3>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lavender Soothing Balm"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Formulation Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Detail botanical benefits, active ingredients, and holistic ritual guidelines..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all resize-none leading-relaxed placeholder-white/20"
            />
          </div>

          {/* Prices & Stock Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="24.00"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Compare At Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="32.00"
                value={formComparePrice}
                onChange={(e) => setFormComparePrice(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Stock Qty *</label>
              <input
                type="number"
                required
                placeholder="100"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>
          </div>

          {/* Category & Image URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CustomDropdown
              options={formCategoryOptions}
              value={formCategory}
              onChange={(val) => setFormCategory(val)}
              label="Category *"
            />

            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Cover Image URL *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Paste URL or upload image"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
                />
                <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center">
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div 
              onClick={() => setFormIsActive(!formIsActive)}
              className="flex items-center gap-4 p-4 bg-[#070908] border border-[#1a241e] rounded-2xl cursor-pointer select-none hover:border-[#2d4c38]/40 transition-colors"
            >
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                formIsActive 
                  ? "border-[#2d4c38] bg-[#2d4c38]" 
                  : "border-[#1a241e] bg-[#070908]"
              }`}>
                {formIsActive && <Check className="h-3.5 w-3.5 text-white stroke-[3.5]" />}
              </div>
              <div>
                <p className="font-bold text-white uppercase tracking-wider text-[10px]">Active Listing</p>
                <p className="text-[10px] text-[#a3b2a9] mt-0.5">Visible to customers in the store front</p>
              </div>
            </div>

            <div 
              onClick={() => setFormIsFeatured(!formIsFeatured)}
              className="flex items-center gap-4 p-4 bg-[#070908] border border-[#1a241e] rounded-2xl cursor-pointer select-none hover:border-[#2d4c38]/40 transition-colors"
            >
              <input
                type="checkbox"
                checked={formIsFeatured}
                onChange={(e) => setFormIsFeatured(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                formIsFeatured 
                  ? "border-[#2d4c38] bg-[#2d4c38]" 
                  : "border-[#1a241e] bg-[#070908]"
              }`}>
                {formIsFeatured && <Check className="h-3.5 w-3.5 text-white stroke-[3.5]" />}
              </div>
              <div>
                <p className="font-bold text-white uppercase tracking-wider text-[10px]">Featured Spotlight</p>
                <p className="text-[10px] text-[#a3b2a9] mt-0.5">Showcase inside featured homepage segments</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#1a241e]">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="h-12 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="h-12 rounded-xl bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving changes...
                </>
              ) : (
                "Save Formulation"
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
