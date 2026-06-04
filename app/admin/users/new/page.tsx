"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Loader2, AlertCircle, Key, ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdminNewUserPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Manually Add User Account | Naturalist";
  }, []);

  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          isVerified: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      showToast("success", "Account Created", `Manually registered ${name} successfully.`);
      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Manual creation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 text-white">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <a
          href="/admin/users"
          className="h-10 w-10 rounded-xl border border-[#1a241e] bg-[#0c100e] text-[#a3b2a9] hover:text-white flex items-center justify-center transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Users Directory</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight mt-1">Add New User Account</h1>
        </div>
      </div>

      <div className="max-w-xl bg-[#0c100e] border border-[#1a241e] rounded-3xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Account Holder Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Alaeto Ikechukwu Miracle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. user@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Manual or Generated Password *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Enter raw password or click generate"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-4 pr-12 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
              />
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
                title="Generate Random Password"
              >
                <Key className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">System Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all cursor-pointer text-sm font-semibold"
            >
              <option value="user">Standard User</option>
              <option value="admin">Administrator (Command Access)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a241e]">
            <a
              href="/admin/users"
              className="h-11 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all flex items-center justify-center"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-0 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
