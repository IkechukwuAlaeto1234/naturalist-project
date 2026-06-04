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
  EyeOff,
  Boxes
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";
import CustomDropdown from "@/components/ui/CustomDropdown";

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "featured", label: "Featured Only" },
];

interface Product {
  _id: string;
  name: string;
  category: string;
}

interface BundleItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  products: (Product | string | any)[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<BundleItem[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

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
    document.title = "Ritual Bundles Manager | Naturalist";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [bundlesRes, productsRes] = await Promise.all([
        fetch("/api/bundles?includeInactive=true"),
        fetch("/api/products?includeInactive=true")
      ]);
      
      if (!bundlesRes.ok) throw new Error("Failed to load bundles.");
      if (!productsRes.ok) throw new Error("Failed to load products list.");
      
      const bundlesData = await bundlesRes.json();
      const productsData = await productsRes.json();
      
      setBundles(bundlesData);
      setProductsList(productsData);
    } catch (e: any) {
      setError(e.message || "Failed to fetch bundles catalog.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to permanently delete this ritual bundle? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/bundles/${slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setBundles(bundles.filter((b) => b.slug !== slug));
    } catch (e: any) {
      alert(e.message || "Failed to delete bundle.");
    }
  };

  const handleToggleActive = async (bundle: BundleItem) => {
    try {
      const updatedActive = !bundle.isActive;
      const prodIds = bundle.products.map((p: any) => typeof p === "string" ? p : p._id || p);
      
      const res = await fetch(`/api/bundles/${bundle.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bundle.name,
          description: bundle.description,
          price: bundle.price,
          compareAtPrice: bundle.compareAtPrice,
          images: bundle.images,
          products: prodIds.filter(Boolean),
          isFeatured: bundle.isFeatured,
          isActive: updatedActive,
        }),
      });
      if (!res.ok) throw new Error("Toggle active failed.");
      const data = await res.json();
      setBundles(bundles.map((b) => (b._id === bundle._id ? data : b)));
    } catch (e: any) {
      alert(e.message || "Failed to toggle status.");
    }
  };

  const filteredBundles = bundles.filter((b) => {
    const term = debouncedSearch.toLowerCase();
    const nameMatches = b.name.toLowerCase().includes(term) || b.slug.toLowerCase().includes(term);
    
    if (statusFilter === "active") return nameMatches && b.isActive;
    if (statusFilter === "inactive") return nameMatches && !b.isActive;
    if (statusFilter === "featured") return nameMatches && b.isFeatured;
    
    return nameMatches;
  });

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Inventory Control</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Ritual Bundles Catalog</h1>
        </div>
        <a
          href="/admin/bundles/new"
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.35)]"
        >
          <Plus className="h-4 w-4" />
          Add New Bundle
        </a>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search by bundle name, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
          )}
        </div>
        <CustomDropdown
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          className="w-full md:w-56 flex-shrink-0"
        />
      </div>

      {/* ── Grid ── */}
      {loading && bundles.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif animate-pulse">Cataloging Sets...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Failed to Load Bundles</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBundles.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#a3b2a9] text-sm">
              No ritual bundles found.
            </div>
          ) : (
            filteredBundles.map((b) => (
              <div
                key={b._id}
                className={`bg-[#0c100e] border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                  b.isActive ? "border-[#1a241e]" : "border-[#1a241e] opacity-60"
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full bg-[#161a17]/30">
                  <img
                    src={b.images?.[0] || "/placeholder.jpg"}
                    alt={b.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {b.isFeatured && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#b07e3a] px-2 py-0.5 rounded-full text-white">
                        Featured
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActive(b)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-[#0c100e]/80 backdrop-blur-md border border-[#1a241e] hover:bg-[#0c100e] text-[#a3b2a9] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title={b.isActive ? "Deactivate" : "Activate"}
                  >
                    {b.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-white leading-tight truncate">
                      {b.name}
                    </h3>
                    <p className="text-[10px] text-[#a3b2a9] mt-1">{b.slug}</p>
                    
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-sm font-bold text-white">${b.price.toFixed(2)}</span>
                      {b.compareAtPrice && (
                        <span className="text-xs text-[#a3b2a9] line-through">${b.compareAtPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Included Products count */}
                  <div className="flex justify-between items-center pt-3 border-t border-[#1a241e] text-[10px]">
                    <span className="text-[#a3b2a9]">Included Products:</span>
                    <span className="font-bold text-white">
                      {b.products?.length || 0} items
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`/admin/bundles/edit/${b.slug}`}
                      className="h-9 rounded-xl border border-[#1a241e] hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(b.slug)}
                      className="h-9 rounded-xl border border-[#1a241e] hover:bg-red-500/5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
