"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Home,
  Phone,
  User,
  Globe,
  Compass
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useSession } from "next-auth/react";
import CustomDropdown from "@/components/ui/CustomDropdown";

const countryOptions = [
  { value: "United States", label: "United States", icon: Globe },
  { value: "Canada", label: "Canada", icon: Globe },
  { value: "United Kingdom", label: "United Kingdom", icon: Globe },
  { value: "Australia", label: "Australia", icon: Globe },
  { value: "Germany", label: "Germany", icon: Globe },
  { value: "France", label: "France", icon: Globe },
  { value: "Nigeria", label: "Nigeria", icon: Globe },
];

interface AddressFields {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export default function AccountAddressesPage() {
  const { data: session, status } = useSession();
  const [address, setAddress] = useState<AddressFields>({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    phone: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setTimeout(() => { document.title = "Shipping Coordinates | Naturalist"; }, 150);
    if (status === "authenticated") {
      fetchAddress();
    }
  }, [status]);

  const fetchAddress = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/address");
      if (!res.ok) throw new Error("Failed to load saved coordinates.");
      const data = await res.json();
      if (data && data.name) {
        setAddress(data);
      }
    } catch (e: any) {
      showToast("error", "Error loading address", e.message || "Failed to load saved shipping address.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.name || !address.street || !address.city || !address.state || !address.zip || !address.country || !address.phone) {
      showToast("error", "Invalid fields", "Please complete all coordinates fields before registering.");
      return;
    }

    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/user/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save address coordinates.");
      }

      showToast("success", "Coordinates Updated", "Your shipping address details have been registered.");
      setSavedSuccess(true);
      setTimeout(() => {
        window.location.href = "/account";
      }, 800);
    } catch (e: any) {
      showToast("error", "Failed to update", e.message || "Failed to update shipping coordinates.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Mapping coordinates...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="w-full animate-fade-in-up">
      {/* ── Address Editor Card ── */}
      <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 sm:p-10 shadow-sm relative overflow-hidden">
        
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          
          {/* Form Section Headers */}
          <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-3 mb-6 flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-[#b07e3a]" />
              Shipping Location Coordinates
            </h3>
            <p className="text-[10px] text-muted-foreground">Fields marked * are required</p>
          </div>

          {/* Recipient Full Name */}
          <div className="space-y-2">
            <label className="font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              Recipient Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jane Doe"
              value={address.name}
              onChange={(e) => setAddress({ ...address, name: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[#2d4c38] transition-all font-semibold"
            />
          </div>

          {/* Street Address */}
          <div className="space-y-2">
            <label className="font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              Street Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 108 Emerald Forest Drive"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[#2d4c38] transition-all font-semibold"
            />
          </div>

          {/* City / State Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-bold text-muted-foreground uppercase tracking-widest">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Portland"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[#2d4c38] transition-all font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-muted-foreground uppercase tracking-widest">State / Region *</label>
              <input
                type="text"
                required
                placeholder="e.g. Oregon"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[#2d4c38] transition-all font-semibold"
              />
            </div>
          </div>

          {/* ZIP / Country Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-bold text-muted-foreground uppercase tracking-widest">Postal / ZIP Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 97201"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[#2d4c38] transition-all font-semibold"
              />
            </div>

            <CustomDropdown
              options={countryOptions}
              value={address.country}
              onChange={(val) => setAddress({ ...address, country: val })}
              label="Country *"
              className="mt-0.5"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <label className="font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              Delivery Phone Contact *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +1 (503) 555-0199"
              value={address.phone}
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-[#2d4c38] transition-all font-semibold"
            />
          </div>

          {/* Submit Control Row */}
          <div className="pt-6 border-t border-border/20 dark:border-[#1a241e]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] text-muted-foreground flex items-center gap-2">
              {savedSuccess ? (
                <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider animate-bounce">
                  <CheckCircle className="h-4.5 w-4.5" /> Coordinates registered!
                </span>
              ) : (
                <span>Dispatch logs sync automatically on purchase checkout checks.</span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto h-12 px-8 rounded-full bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] hover:shadow-[0_2px_16px_rgba(45,76,56,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving coordinates...
                </>
              ) : (
                "Update Address"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
