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
    document.title = "Shipping Coordinates | Naturalist";
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
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      showToast("error", "Failed to update", e.message || "Failed to update shipping coordinates.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#a3b2a9] font-serif">Mapping Coordinates...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="h-16 w-16 bg-[#1a241e] rounded-full flex items-center justify-center mb-6 border border-[#2d4c38]/40">
          <MapPin className="h-8 w-8 text-[#b07e3a] animate-pulse" />
        </div>
        <h1 className="font-serif text-2xl font-bold mb-2">Private Portal</h1>
        <p className="text-sm text-[#a3b2a9] mb-6 leading-relaxed">
          Please sign in to your Naturalist account to view and update your shipping address coordinates.
        </p>
        <a
          href="/login"
          className="inline-flex h-11 items-center justify-center px-8 rounded-full bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#b07e3a] transition-all shadow-md"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070908] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* ── Botanical Background Grid Pattern ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" aria-hidden="true">
        <defs>
          <pattern id="addressPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M10 40 Q20 10 40 10 Q30 30 10 40Z" fill="#b07e3a" />
            <path d="M50 10 Q65 25 70 40 Q60 30 50 10Z" fill="#2d4c38" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#addressPattern)" />
      </svg>

      {/* Gold linear top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#b07e3a]/40 to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-10 relative z-10">
        
        {/* ── Navigation Header ── */}
        <div className="flex items-center justify-between">
          <a
            href="/account"
            className="group flex items-center gap-2.5 h-10 px-4 rounded-full bg-[#1a241e]/50 border border-[#2d4c38]/40 text-xs font-bold text-[#a3b2a9] hover:text-white hover:border-[#b07e3a]/50 hover:bg-[#1a241e] transition-all"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Hub
          </a>
          
          <span className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-[0.2em] bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/20 px-3 py-1 rounded-full">
            <Compass className="h-3 w-3 animate-spin-slow" /> Registered Member
          </span>
        </div>

        {/* ── Page Title ── */}
        <div className="text-center sm:text-left space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b07e3a] block">Portal Coordinates</span>
          <h1 className="font-serif text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
            Saved Shipping Address
          </h1>
          <p className="text-xs text-[#a3b2a9] max-w-xl leading-relaxed mt-2">
            Review and manage saved shipping address references used to calculate botanics dispatch logs.
          </p>
        </div>

        {/* ── Address Editor Card ── */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            
            {/* Form Section Headers */}
            <div className="border-b border-[#1a241e] pb-3 mb-6 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <MapPin className="h-4.5 w-4.5 text-[#b07e3a]" />
                Dispatch Location coordinates
              </h3>
              <p className="text-[10px] text-[#a3b2a9]">Fields marked * are required</p>
            </div>

            {/* Recipient Full Name */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-widest flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#b07e3a]" /> Recipient Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jane Doe"
                value={address.name}
                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>

            {/* Street Address */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-widest flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-[#b07e3a]" /> Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 108 Emerald Forest Drive"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>

            {/* City / State Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-widest">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portland"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-widest">State / Region *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oregon"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
                />
              </div>
            </div>

            {/* ZIP / Country Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-widest">Postal / ZIP Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 97201"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
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
              <label className="font-bold text-[#a3b2a9] uppercase tracking-widest flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#b07e3a]" /> Delivery Phone Contact *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +1 (503) 555-0199"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all font-semibold placeholder-white/20"
              />
            </div>

            {/* Submit Control Row */}
            <div className="pt-6 border-t border-[#1a241e] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] text-[#a3b2a9] flex items-center gap-2">
                {savedSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider animate-bounce">
                    <CheckCircle className="h-4.5 w-4.5" /> Coordinates registered!
                  </span>
                ) : (
                  <span>Dispatch logs sync automatically on purchase checkout checks.</span>
                )}
              </div>
              
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] hover:border-[#b07e3a]/40 hover:shadow-[0_2px_16px_rgba(45,76,56,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving coordinates...
                  </>
                ) : (
                  "Update Coordinates"
                )}
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}
