"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Boxes,
  Check
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
}

export default function AdminNewBundlePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [image, setImage] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Status/Upload states
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Add New Ritual Bundle | Naturalist";
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("/api/products?includeInactive=true");
      if (res.ok) {
        const data = await res.json();
        setProductsList(data);
      }
    } catch (e) {
      console.error("Failed to load products list", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError("");

      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "naturalist/bundles" }),
      });
      if (!sigRes.ok) throw new Error("Cloudinary upload signature failure.");
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", "naturalist/bundles");

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!upRes.ok) throw new Error("Image upload failed.");
      const upData = await upRes.json();

      const proxiedUrl = proxyCloudinaryUrl(upData.secure_url);
      setImage(proxiedUrl);

      // Log in CDN image logs
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

      showToast("success", "Upload Complete", "Bundle image uploaded to CDN successfully.");
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !price || !image || selectedProducts.length === 0) {
      setError("Please complete all required fields and select at least one product.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        compareAtPrice: comparePrice ? parseFloat(comparePrice) : undefined,
        images: [image.trim()],
        products: selectedProducts,
        isActive,
        isFeatured,
      };

      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bundle.");

      showToast("success", "Bundle Created", `Manual set ${name} published successfully.`);
      router.push("/admin/bundles");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-white max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <a
          href="/admin/bundles"
          className="h-10 w-10 rounded-xl border border-[#1a241e] bg-[#0c100e] text-[#a3b2a9] hover:text-white flex items-center justify-center transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Bundles Catalog</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight mt-1">Compose Ritual Bundle</h1>
        </div>
      </div>

      <div className="max-w-3xl bg-[#0c100e] border border-[#1a241e] rounded-3xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Slug info */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Bundle Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Skin Clarifying Kit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Ethos Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Write description detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold resize-none"
            />
          </div>

          {/* Price details row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Offer Price * ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="49.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Compare At Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="75.00"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Bundle Cover Image *</label>
            <div className="flex gap-4 items-center">
              <div className="h-20 w-20 rounded-2xl border border-[#1a241e] bg-[#070908] overflow-hidden flex items-center justify-center flex-shrink-0">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Boxes className="h-6 w-6 text-[#4a5c50]" />
                )}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="URL or select file upload"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full h-11 pl-4 pr-12 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <label className="p-2 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
                {uploading && <p className="text-[10px] text-[#b07e3a] mt-1.5 animate-pulse">Uploading set cover to CDN...</p>}
              </div>
            </div>
          </div>

          {/* Associated Products */}
          <div className="space-y-3">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Include Products * (Select at least one)</label>
            
            {loadingProducts ? (
              <div className="p-6 text-center text-[#a3b2a9]">
                <Loader2 className="h-5 w-5 animate-spin text-[#b07e3a] mx-auto" />
                <span className="text-[10px] uppercase mt-2 block">Loading products catalog...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto border border-[#1a241e] p-4 bg-[#070908] rounded-2xl">
                {productsList.map((prod) => {
                  const isSelected = selectedProducts.includes(prod._id);
                  return (
                    <button
                      key={prod._id}
                      type="button"
                      onClick={() => handleProductToggle(prod._id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between hover:scale-[1.01] transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#b07e3a] bg-[#b07e3a]/10"
                          : "border-[#1a241e] bg-[#0c100e]/30 text-[#a3b2a9]"
                      }`}
                    >
                      <span className="font-bold text-white block text-xs truncate max-w-full">{prod.name}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#b07e3a] mt-1 block font-semibold">{prod.category}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-[#070908] border border-[#1a241e] rounded-2xl">
            <div 
              onClick={() => setIsActive(!isActive)}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                isActive 
                  ? "border-[#2d4c38] bg-[#2d4c38]" 
                  : "border-[#1a241e] bg-[#070908]"
              }`}>
                {isActive && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
              </div>
              <label htmlFor="isActive" className="font-bold text-[#a3b2a9] hover:text-white cursor-pointer select-none text-xs">
                Active in Store
              </label>
            </div>

            <div 
              onClick={() => setIsFeatured(!isFeatured)}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="sr-only"
              />
              <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                isFeatured 
                  ? "border-[#b07e3a] bg-[#b07e3a]" 
                  : "border-[#1a241e] bg-[#070908]"
              }`}>
                {isFeatured && <Check className="h-3 w-3 text-black stroke-[3.5]" />}
              </div>
              <label htmlFor="isFeatured" className="font-bold text-[#a3b2a9] hover:text-white cursor-pointer select-none text-xs">
                Feature on Homepage
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a241e]">
            <a
              href="/admin/bundles"
              className="h-11 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all flex items-center justify-center"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={saving || uploading}
              className="h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-0 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Bundle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
