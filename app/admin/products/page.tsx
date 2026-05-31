"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formComparePrice, setFormComparePrice] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formCategory, setFormCategory] = useState("skincare");
  const [formStock, setFormStock] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  
  // CDN integration state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    document.title = "Product Catalog Manager | Naturalist";
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      // includeInactive = true to fetch inactive products as well
      const res = await fetch("/api/products?includeInactive=true");
      if (!res.ok) throw new Error("Failed to load products.");
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch products catalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormComparePrice("");
    setFormImage("");
    setFormCategory("skincare");
    setFormStock("50");
    setFormIsActive(true);
    setFormIsFeatured(false);
    setModalError("");
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || "");
    setFormPrice(String(product.price));
    setFormComparePrice(product.compareAtPrice ? String(product.compareAtPrice) : "");
    setFormImage(product.image);
    setFormCategory(product.category);
    setFormStock(String(product.stock));
    setFormIsActive(product.isActive);
    setFormIsFeatured(product.isFeatured || false);
    setModalError("");
    setShowModal(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to permanently delete this product? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setProducts(products.filter((p) => p.slug !== slug));
    } catch (e: any) {
      alert(e.message || "Failed to delete product.");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const updatedActive = !product.isActive;
      const res = await fetch(`/api/products/${product.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image,
          category: product.category,
          stock: product.stock,
          isFeatured: product.isFeatured,
          isActive: updatedActive,
        }),
      });
      if (!res.ok) throw new Error("Toggle active failed.");
      const data = await res.json();
      setProducts(products.map((p) => (p._id === product._id ? data : p)));
    } catch (e: any) {
      alert(e.message || "Failed to toggle status.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setModalError("");
      
      // Get signature
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "naturalist/products" }),
      });
      if (!sigRes.ok) throw new Error("Cloudinary upload signature failure.");
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
      if (!upRes.ok) throw new Error("Image upload failed.");
      const upData = await upRes.json();
      
      setFormImage(upData.secure_url);

      // Log upload in our CDN image registry
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
      setModalError(err.message || "Upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDescription || !formPrice || !formImage || !formStock) {
      setModalError("Please complete all required fields.");
      return;
    }

    try {
      setModalSaving(true);
      setModalError("");

      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        price: parseFloat(formPrice),
        compareAtPrice: formComparePrice ? parseFloat(formComparePrice) : undefined,
        image: formImage.trim(),
        category: formCategory,
        stock: parseInt(formStock),
        isActive: formIsActive,
        isFeatured: formIsFeatured,
      };

      const url = editingProduct
        ? `/api/products/${editingProduct.slug}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product.");

      // Refresh catalog
      if (editingProduct) {
        setProducts(products.map((p) => (p._id === editingProduct._id ? data : p)));
      } else {
        setProducts([data, ...products]);
      }

      setShowModal(false);
    } catch (err: any) {
      setModalError(err.message || "An error occurred while saving.");
    } finally {
      setModalSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    const nameMatches = p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term);
    const categoryMatches = !categoryFilter || p.category === categoryFilter;
    return nameMatches && categoryMatches;
  });

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Inventory Control</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Products Catalog</h1>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search by product name, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all cursor-pointer min-w-[160px]"
        >
          <option value="">All Categories</option>
          <option value="skincare">Skincare</option>
          <option value="wellness">Wellness</option>
          <option value="ritual">Rituals</option>
        </select>
      </div>

      {/* ── Products Grid ── */}
      {loading && products.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Cataloging Stock...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Failed to Load Stock</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#a3b2a9] text-sm">
              No products found in stock catalog.
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div
                key={p._id}
                className={`bg-[#0c100e] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                  p.isActive ? "border-[#1a241e]" : "border-[#1a241e] opacity-60"
                }`}
              >
                {/* Image & Badges */}
                <div className="relative aspect-square w-full bg-[#161a17]/30">
                  <img
                    src={p.image || "/placeholder.jpg"}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-[#0c100e]/80 backdrop-blur-md border border-[#1a241e] px-2 py-0.5 rounded-full text-white">
                      {p.category}
                    </span>
                    {p.isFeatured && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#b07e3a] px-2 py-0.5 rounded-full text-white">
                        Featured
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActive(p)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-[#0c100e]/80 backdrop-blur-md border border-[#1a241e] hover:bg-[#0c100e] text-[#a3b2a9] hover:text-white flex items-center justify-center transition-all"
                    title={p.isActive ? "Deactivate" : "Activate"}
                  >
                    {p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                {/* Info details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-white leading-tight truncate">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-[#a3b2a9] font-mono mt-1">{p.slug}</p>
                    
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-sm font-bold text-white">${p.price.toFixed(2)}</span>
                      {p.compareAtPrice && (
                        <span className="text-xs text-[#a3b2a9] line-through">${p.compareAtPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Stock status */}
                  <div className="flex justify-between items-center pt-3 border-t border-[#1a241e] text-[10px]">
                    <span className="text-[#a3b2a9]">Inventory stock:</span>
                    <span className={`font-bold ${p.stock <= 5 ? "text-red-400" : "text-white"}`}>
                      {p.stock} units
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="h-9 rounded-xl border border-[#1a241e] hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.slug)}
                      className="h-9 rounded-xl border border-[#1a241e] hover:bg-red-500/5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Product Slide-over / Modal Form ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070908]/80 backdrop-blur-md">
          <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            
            <div className="p-6 border-b border-[#1a241e] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">
                {editingProduct ? `Edit ${editingProduct.name}` : "Create Skincare Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#a3b2a9] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-xs">
              
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lavender Soothing Balm"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize benefits, ingredients, application rituals..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all resize-none"
                />
              </div>

              {/* Prices & Stock Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="24.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Compare At ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="32.00"
                    value={formComparePrice}
                    onChange={(e) => setFormComparePrice(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                  />
                </div>
              </div>

              {/* Category & Image URL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all cursor-pointer"
                  >
                    <option value="skincare">Skincare</option>
                    <option value="wellness">Wellness</option>
                    <option value="ritual">Rituals</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Cover Image *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Paste URL or upload image"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                    />
                    <label className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg cursor-pointer hover:bg-white/10 transition-all flex items-center justify-center">
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
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3.5 bg-[#070908] border border-[#1a241e] rounded-xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-[#1a241e] text-[#2d4c38] focus:ring-0"
                  />
                  <div>
                    <p className="font-bold text-white uppercase tracking-wider text-[9px]">Active Listing</p>
                    <p className="text-[10px] text-[#a3b2a9] mt-0.5">Visible in public shop</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 bg-[#070908] border border-[#1a241e] rounded-xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-[#1a241e] text-[#2d4c38] focus:ring-0"
                  />
                  <div>
                    <p className="font-bold text-white uppercase tracking-wider text-[9px]">Featured Product</p>
                    <p className="text-[10px] text-[#a3b2a9] mt-0.5">Showcase on homepage</p>
                  </div>
                </label>
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
                  disabled={modalSaving || uploadingImage}
                  className="h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {modalSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Product"
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
