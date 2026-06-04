"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Pencil,
  Loader2,
  AlertCircle,
  Key,
  Laptop,
  Smartphone,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface SessionType {
  id: string;
  ipAddress: string;
  os: string;
  browser: string;
  deviceType: string;
  lastActive: string;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  secondaryEmail?: string;
  isSecondaryEmailVerified?: boolean;
  role: string;
  isSuspended: boolean;
  sessions?: SessionType[];
}

export default function AdminEditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [isSecondaryVerified, setIsSecondaryVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load user information.");
      const data = await res.json();
      setUser(data);
      setName(data.name);
      setEmail(data.email);
      setSecondaryEmail(data.secondaryEmail || "");
      setIsSecondaryVerified(data.isSecondaryEmailVerified || false);
      setRole(data.role);
      document.title = `Override Profile: ${data.name} | Naturalist`;
    } catch (e: any) {
      setError(e.message || "Failed to retrieve user.");
    } finally {
      setLoading(false);
    }
  };

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
    if (!name || !email) {
      showToast("error", "Failed to update", "Name and primary email are required fields.");
      return;
    }
    try {
      setSaving(true);
      const body: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        secondaryEmail: secondaryEmail.trim(),
        isSecondaryEmailVerified: isSecondaryVerified,
        role: role,
      };

      if (password) {
        body.plainPassword = password;
      }

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user profile.");

      showToast("success", "Profile Updated", `Override saved for ${name} successfully.`);
      setPassword("");
      setUser(data);
    } catch (err: any) {
      showToast("error", "Override Failed", err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleForceRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to administratively evict this active device session?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeSessionId: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke active session.");

      setUser(data);
      showToast("success", "Session Revoked", "Active device session evicted.");
    } catch (err: any) {
      showToast("error", "Revoke Failed", err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Compiling credentials...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4 text-white">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-destructive">User override failed to load</p>
          <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          <a href="/admin/users" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to directory
          </a>
        </div>
      </div>
    );
  }

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
          <h1 className="font-serif text-3xl font-bold tracking-tight mt-1">Override User Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Form */}
        <div className="lg:col-span-7 bg-[#0c100e] border border-[#1a241e] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Account ID */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Account ID</label>
              <div className="p-3.5 bg-[#070908] border border-[#1a241e] rounded-xl text-sm text-[#a3b2a9] select-all font-semibold">
                {user._id}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
              />
            </div>

            {/* Primary Email */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Primary Email Address * (Change locks NextAuth)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
              />
            </div>

            {/* Secondary Email */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Backup Recovery Email</label>
              <input
                type="email"
                value={secondaryEmail}
                onChange={(e) => setSecondaryEmail(e.target.value)}
                placeholder="No backup email bound"
                className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
              />
            </div>

            {/* Secondary Email Verified Checkbox */}
            {secondaryEmail && (
              <div className="flex items-center gap-2.5 p-3.5 bg-[#070908] border border-[#1a241e] rounded-xl">
                <input
                  type="checkbox"
                  id="editIsSecondaryVerified"
                  checked={isSecondaryVerified}
                  onChange={(e) => setIsSecondaryVerified(e.target.checked)}
                  className="h-4 w-4 accent-[#b07e3a] rounded"
                />
                <label htmlFor="editIsSecondaryVerified" className="font-semibold text-white cursor-pointer select-none text-xs">
                  Mark Backup Email as Verified
                </label>
              </div>
            )}

            {/* Reset Password */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">Administrative Password Reset (Leave blank to keep current)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter new plain password overrides"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
                  title="Generate Password"
                >
                  <Key className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider block">System Role Privilege</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all cursor-pointer text-sm font-semibold"
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a241e]">
              <a
                href="/admin/users"
                className="h-11 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all flex items-center justify-center"
              >
                Return Directory
              </a>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-xl bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-black hover:bg-[#c89348] transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-0 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" /> Saving...
                  </>
                ) : (
                  "Save Overrides"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Device Sessions */}
        <div className="lg:col-span-5 bg-[#0c100e] border border-[#1a241e] rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1a241e] pb-4">
            <Laptop className="h-5 w-5 text-[#b07e3a]" />
            <h3 className="font-serif text-lg font-bold text-white">Session Eviction</h3>
          </div>

          <p className="text-xs text-[#a3b2a9] leading-relaxed">
            Administratively inspect and force-evict any active browser logins or machines validated for this account in real time.
          </p>

          <div className="space-y-4 pt-2">
            {!user.sessions || user.sessions.length === 0 ? (
              <p className="text-xs text-[#a3b2a9] italic text-center py-8 bg-[#070908] border border-[#1a241e] rounded-2xl">
                No active device sessions found.
              </p>
            ) : (
              user.sessions.map((sessionItem) => (
                <div
                  key={sessionItem.id}
                  className="p-4 bg-[#070908] border border-[#1a241e] rounded-2xl flex flex-col gap-3 relative group hover:border-[#b07e3a]/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 text-white font-bold">
                    {sessionItem.deviceType === "Mobile" ? <Smartphone className="h-4 w-4 text-[#a3b2a9]" /> : <Laptop className="h-4 w-4 text-[#a3b2a9]" />}
                    <span className="truncate">{sessionItem.browser} on {sessionItem.os}</span>
                  </div>
                  <div className="text-[11px] text-[#a3b2a9] leading-tight space-y-1">
                    <p>IP Address: <span className="text-white font-semibold">{sessionItem.ipAddress}</span></p>
                    <p>Last Active: <span className="text-white font-semibold">{new Date(sessionItem.lastActive).toLocaleString()}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleForceRevokeSession(sessionItem.id)}
                    className="flex items-center justify-center gap-1.5 h-8 w-full rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Force Evict Device
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
