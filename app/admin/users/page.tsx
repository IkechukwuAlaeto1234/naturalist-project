"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  UserX,
  UserCheck,
  ShieldAlert,
  Trash2,
  Plus,
  Activity,
  Search,
  Key,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface UserType {
  _id: string;
  name: string;
  email: string;
  plainPassword?: string;
  role: "user" | "admin";
  isVerified: boolean;
  isSuspended?: boolean;
  createdAt: string;
}

interface AccountLog {
  _id: string;
  email: string;
  name: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [logs, setLogs] = useState<AccountLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");

  // Manual Add Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"user" | "admin">("user");
  const [addModalError, setAddModalError] = useState("");
  const [addModalSaving, setAddModalSaving] = useState(false);

  // Password visibility registry: map user ID -> boolean
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "User Directory & System Audit | Naturalist";
    fetchUsers();
    fetchLogs();
  }, []);

  // Read URL query parameters to support link redirection to tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "logs") {
        setActiveTab("logs");
      }
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to retrieve user directory.");
      const data = await res.json();
      setUsers(data);
    } catch (e: any) {
      setError(e.message || "Failed to load users directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load account tracking logs.", e);
    }
  };

  const handleToggleReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleToggleSuspend = async (user: UserType) => {
    try {
      const updatedSuspended = !user.isSuspended;
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: updatedSuspended }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Suspension modification failed.");
      }
      const data = await res.json();
      
      // Update state
      setUsers(users.map((u) => (u._id === user._id ? data : u)));
      fetchLogs(); // refresh audit logs
    } catch (e: any) {
      alert(e.message || "Failed to update account status.");
    }
  };

  const handleToggleRole = async (user: UserType) => {
    try {
      const updatedRole = user.role === "admin" ? "user" : "admin";
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: updatedRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Role modification failed.");
      }
      const data = await res.json();
      
      // Update state
      setUsers(users.map((u) => (u._id === user._id ? data : u)));
      fetchLogs();
    } catch (e: any) {
      alert(e.message || "Failed to toggle role.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user account? All order relations and profile data will remain in history, but log in credentials will be expunged. This is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed.");
      }
      setUsers(users.filter((u) => u._id !== userId));
      fetchLogs();
    } catch (e: any) {
      alert(e.message || "Failed to delete user account.");
    }
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAddPassword(generated);
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail || !addPassword) {
      setAddModalError("Please complete all required fields.");
      return;
    }
    try {
      setAddModalSaving(true);
      setAddModalError("");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          role: addRole,
          isVerified: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      setUsers([data, ...users]);
      setShowAddModal(false);
      fetchLogs(); // refresh logs
    } catch (err: any) {
      setAddModalError(err.message || "Manual creation failed.");
    } finally {
      setAddModalSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u._id.toLowerCase().includes(term);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Accounts & Auditing</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Users & Logs</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { fetchUsers(); fetchLogs(); }}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-xs font-bold text-[#a3b2a9] hover:text-white transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Ledger
          </button>
          <button
            onClick={() => {
              setAddName("");
              setAddEmail("");
              setAddPassword("");
              setAddRole("user");
              setAddModalError("");
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Manual Add User
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-[#1a241e] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all px-1 ${
            activeTab === "users"
              ? "border-[#b07e3a] text-white font-bold"
              : "border-transparent text-[#a3b2a9] hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all px-1 ${
            activeTab === "logs"
              ? "border-[#b07e3a] text-white font-bold"
              : "border-transparent text-[#a3b2a9] hover:text-white"
          }`}
        >
          <Activity className="h-4 w-4" />
          Tracking Audit Logs ({logs.length})
        </button>
      </div>

      {/* ── SEARCH / FILTER BAR (Only visible on Directory Tab) ── */}
      {activeTab === "users" && (
        <div className="flex flex-col sm:flex-row gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
            <input
              type="search"
              placeholder="Search users by name, email, account ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white focus:outline-none focus:border-[#b07e3a] transition-all cursor-pointer min-w-[160px]"
          >
            <option value="">All Roles</option>
            <option value="user">Standard User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Querying Records...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Auditing Connection Failed</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : activeTab === "users" ? (
        
        /* ── DIRECTORY VIEW ── */
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#1a241e]">
              <thead>
                <tr className="text-[#a3b2a9] font-bold uppercase tracking-wider bg-[#0c100e]">
                  <th className="p-4 sm:p-5">Name & ID</th>
                  <th className="p-4 sm:p-5">Email Address</th>
                  <th className="p-4 sm:p-5 text-center">User Role</th>
                  <th className="p-4 sm:p-5">Credential Password</th>
                  <th className="p-4 sm:p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a241e]/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-[#a3b2a9] text-sm">
                      No accounts cataloged matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRevealed = !!revealedPasswords[u._id];
                    const pwdDisplay = u.plainPassword
                      ? isRevealed ? u.plainPassword : "••••••••••••"
                      : u.email.includes("google") || !u.plainPassword ? "OAuth Sync (Google)" : "Encrypted (bcrypt)";
                    
                    const roleClass = u.role === "admin"
                      ? "bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/25"
                      : "bg-white/[0.03] text-[#a3b2a9] border border-[#1a241e]";

                    return (
                      <tr
                        key={u._id}
                        className={`hover:bg-white/[0.01] transition-colors ${
                          u.isSuspended ? "opacity-50" : ""
                        }`}
                      >
                        <td className="p-4 sm:p-5">
                          <p className="font-semibold text-white truncate max-w-[150px]">{u.name}</p>
                          <p className="text-[10px] text-[#a3b2a9] font-mono mt-0.5">{u._id}</p>
                        </td>
                        <td className="p-4 sm:p-5 font-medium text-white">{u.email}</td>
                        <td className="p-4 sm:p-5 text-center">
                          <button
                            onClick={() => handleToggleRole(u)}
                            className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full hover:scale-105 transition-transform ${roleClass}`}
                          >
                            {u.role}
                          </button>
                        </td>
                        <td className="p-4 sm:p-5 font-mono text-[11px]">
                          <div className="flex items-center gap-2 text-white">
                            <span>{pwdDisplay}</span>
                            {u.plainPassword && (
                              <button
                                onClick={() => handleToggleReveal(u._id)}
                                className="p-1 hover:bg-white/5 rounded text-[#a3b2a9] hover:text-white transition-colors"
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 sm:p-5 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className={`h-8 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                                u.isSuspended
                                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                  : "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              {u.isSuspended ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" /> Unsuspend
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3.5 w-3.5" /> Suspend
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="h-8 w-8 rounded-lg border border-red-500/30 hover:bg-red-500/5 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                              title="Expunge Account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* ── AUDIT LOGS VIEW ── */
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-[#b07e3a]" />
            <div>
              <h2 className="font-serif text-lg font-bold">User Registrations Activity Audit</h2>
              <p className="text-xs text-[#a3b2a9] mt-0.5">Chronological system tracking logs</p>
            </div>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-[#a3b2a9]">
                No tracking audits recorded yet.
              </div>
            ) : (
              logs.map((log) => {
                let badgeClass = "bg-white/[0.04] text-[#a3b2a9] border border-[#1a241e]";
                if (log.action === "signup") badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
                if (log.action === "suspend") badgeClass = "bg-red-500/10 text-red-400 border border-red-500/25";
                if (log.action === "delete") badgeClass = "bg-destructive/10 text-destructive border border-destructive/25";
                if (log.action === "create_manual") badgeClass = "bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/25";
                
                return (
                  <div
                    key={log._id}
                    className="p-4 bg-white/[0.005] border border-[#1a241e] rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-[#b07e3a]/20 transition-all"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="h-9 w-9 bg-white/[0.02] border border-[#1a241e] text-[#a3b2a9] rounded-xl flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {log.name?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{log.name}</p>
                        <p className="text-[10px] text-[#a3b2a9] truncate mt-0.5">{log.email}</p>
                        <p className="text-xs text-white/90 mt-2 font-medium leading-relaxed bg-white/[0.01] border border-[#1a241e]/40 p-2.5 rounded-xl max-w-xl">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0 text-right self-start sm:self-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${badgeClass}`}>
                        {log.action}
                      </span>
                      <span className="text-[9px] font-medium text-[#a3b2a9] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Manual Add User Account Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070908]/80 backdrop-blur-md">
          <div className="bg-[#0c100e] border border-[#1a241e] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            
            <div className="p-6 border-b border-[#1a241e] flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#b07e3a]" />
                Manually Add User Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#a3b2a9] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="p-6 space-y-4 text-xs">
              
              {addModalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{addModalError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alaeto Ikechukwu Miracle"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@email.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">Manual or Generated Password *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter raw password or click generate"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 border border-[#1a241e] text-[#a3b2a9] hover:text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
                    title="Generate Random Password"
                  >
                    <Key className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#a3b2a9] uppercase tracking-wider">System Role *</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as any)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all cursor-pointer"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator (Command Access)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a241e]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 rounded-xl border border-[#1a241e] text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:bg-white/5 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addModalSaving}
                  className="h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addModalSaving ? (
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
      )}

    </div>
  );
}
