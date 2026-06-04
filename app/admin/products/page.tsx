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
import { proxyCloudinaryUrl } from "@/lib/utils";
import CustomDropdown from "@/components/ui/CustomDropdown";

const categoryFilterOptions = [
  { value: "", label: "All Categories" },
  { value: "skincare", label: "Skincare" },
  { value: "wellness", label: "Wellness" },
  { value: "ritual", label: "Rituals" },
];

const formCategoryOptions = [
  { value: "skincare", label: "Skincare" },
  { value: "wellness", label: "Wellness" },
  { value: "ritual", label: "Rituals" },
];

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  images?: string[];
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

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
          images: product.images || (product.image ? [product.image] : []),
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

  const filteredProducts = products.filter((p) => {
    const term = debouncedSearch.toLowerCase();
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
        <a
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </a>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search by product name, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
          )}
        </div>
        <CustomDropdown
          options={categoryFilterOptions}
          value={categoryFilter}
          onChange={(val) => setCategoryFilter(val)}
          className="w-full md:w-56 flex-shrink-0"
        />
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
                    src={p.images?.[0] || p.image || "/placeholder.jpg"}
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
                    <p className="text-[10px] text-[#a3b2a9] mt-1">{p.slug}</p>
                    
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
                    <a
                      href={`/admin/products/edit/${p.slug}`}
                      className="h-9 rounded-xl border border-[#1a241e] hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </a>
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

    </div>
  );
}
