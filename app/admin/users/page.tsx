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
  ShieldCheck,
  X,
  Pencil,
  Laptop,
  Smartphone,
  Check,
} from "lucide-react";
import CustomDropdown from "@/components/ui/CustomDropdown";

interface SessionType {
  id: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: string;
  lastActive: string;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  secondaryEmail?: string;
  isSecondaryEmailVerified?: boolean;
  sessions?: SessionType[];
  password?: string;
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
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "requests">("users");

  // Password visibility registry: map user ID -> boolean
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

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
    document.title = "User Directory & System Audit | Naturalist";
    fetchUsers();
    fetchLogs();
    fetchDataRequests();
  }, []);

  const fetchDataRequests = async () => {
    try {
      const res = await fetch("/api/admin/data-requests");
      if (res.ok) {
        const data = await res.json();
        setDataRequests(data);
      }
    } catch (e) {
      console.error("Failed to load user GDPR requests.", e);
    }
  };

  const handleApproveDataRequest = async (requestId: string) => {
    const downloadUrl = prompt("Enter the GDPR data archive download URL (JSON/ZIP) for this user:");
    if (downloadUrl === null) return;
    if (!downloadUrl.trim()) {
      alert("Download URL is required to approve the request.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/data-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", downloadUrl: downloadUrl.trim() }),
      });
      if (res.ok) {
        alert("GDPR Data Request Approved!");
        fetchDataRequests();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update request.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to process request.");
    }
  };

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

  const filteredUsers = users.filter((u) => {
    const term = debouncedSearch.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u._id.toLowerCase().includes(term);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 pb-20 text-foreground">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Accounts & Auditing</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground mt-1">Users & Logs</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { fetchUsers(); fetchLogs(); fetchDataRequests(); }}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Ledger
          </button>
          <a
            href="/admin/users/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#2d4c38] text-xs font-bold text-white hover:bg-[#3a6349] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Manual Add User
          </a>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-border gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all px-1 bg-transparent border-0 cursor-pointer ${
            activeTab === "users"
              ? "border-[#b07e3a] text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all px-1 bg-transparent border-0 cursor-pointer ${
            activeTab === "logs"
              ? "border-[#b07e3a] text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" />
          Tracking Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all px-1 bg-transparent border-0 cursor-pointer ${
            activeTab === "requests"
              ? "border-[#b07e3a] text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          User GDPR Data Requests ({dataRequests.length})
        </button>
      </div>

      {/* ── SEARCH / FILTER BAR (Only visible on Directory Tab) ── */}
      {activeTab === "users" && (
        <div className="flex flex-col sm:flex-row gap-4 bg-card border border-border rounded-2xl p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
            <input
              type="search"
              placeholder="Search users by name, email, account ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-[#b07e3a] transition-all"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
            )}
          </div>
          <CustomDropdown
            options={[
              { value: "", label: "All Roles" },
              { value: "user", label: "Standard User" },
              { value: "admin", label: "Administrator" },
            ]}
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            className="w-full sm:w-48"
          />
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-muted-foreground tracking-wider uppercase font-serif">Querying Records...</p>
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
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#1a241e]">
              <thead>
                <tr className="text-muted-foreground font-bold uppercase tracking-wider bg-card">
                  <th className="p-4 sm:p-5">Name & ID</th>
                  <th className="p-4 sm:p-5">Email Address</th>
                  <th className="p-4 sm:p-5 text-center">User Role</th>
                  <th className="p-4 sm:p-5">Credential Password</th>
                  <th className="p-4 sm:p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">
                      No accounts cataloged matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRevealed = !!revealedPasswords[u._id];
                    const pwdDisplay = u.plainPassword
                      ? isRevealed ? u.plainPassword : "••••••••••••"
                      : u.password ? "Encrypted (bcrypt)" : "OAuth Sync (Google)";
                    
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
                          <p className="font-semibold text-foreground truncate max-w-[150px]">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{u._id}</p>
                        </td>
                        <td className="p-4 sm:p-5">
                          <p className="font-medium text-foreground">{u.email}</p>
                          {u.secondaryEmail && (
                            <p className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[180px]">
                              Backup: {u.secondaryEmail} {u.isSecondaryEmailVerified ? "✓" : "✗"}
                            </p>
                          )}
                        </td>
                        <td className="p-4 sm:p-5 text-center">
                          <button
                            onClick={() => handleToggleRole(u)}
                            className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full hover:scale-105 transition-transform bg-transparent border-0 cursor-pointer"
                          >
                            <span className={`inline-block px-2.5 py-0.5 rounded-full ${roleClass}`}>{u.role}</span>
                          </button>
                        </td>
                        <td className="p-4 sm:p-5 text-[11px]">
                          <div className="flex items-center gap-2 text-foreground">
                            <span>{pwdDisplay}</span>
                            {u.plainPassword && (
                              <button
                                onClick={() => handleToggleReveal(u._id)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
                              >
                                {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 sm:p-5 text-center">
                          <div className="inline-flex gap-2">
                            <a
                              href={`/admin/users/edit/${u._id}`}
                              className="h-8 px-3 rounded-lg border border-[#b07e3a]/30 bg-[#b07e3a]/5 text-[#b07e3a] hover:bg-[#b07e3a] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit Profile
                            </a>
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className={`h-8 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
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
                              className="h-8 w-8 rounded-lg border border-red-500/30 hover:bg-red-500/5 text-red-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
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
      ) : activeTab === "logs" ? (
        
        /* ── AUDIT LOGS VIEW ── */
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-[#b07e3a]" />
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">User Registrations Activity Audit</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Chronological system tracking logs</p>
            </div>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
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
                    className="p-4 bg-muted/30 border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-[#b07e3a]/20 transition-all"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="h-9 w-9 bg-muted border border-border text-muted-foreground rounded-xl flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {log.name?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{log.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{log.email}</p>
                        <p className="text-xs text-foreground/90 mt-2 font-medium leading-relaxed bg-muted/50 border border-border/40 p-2.5 rounded-xl max-w-xl">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0 text-right self-start sm:self-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${badgeClass}`}>
                        {log.action}
                      </span>
                      <span className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
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
      ) : (
        /* ── GDPR DATA EXPORT REQUESTS VIEW ── */
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-[#b07e3a]" />
            <div>
              <h2 className="font-serif text-lg font-bold text-foreground">User GDPR Data Export Requests</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Review and authorize data download packages for users</p>
            </div>
          </div>

          <div className="space-y-4">
            {dataRequests.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No GDPR data requests submitted.
              </div>
            ) : (
              dataRequests.map((req) => {
                let badgeClass = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
                if (req.status === "approved") badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";

                return (
                  <div
                    key={req._id}
                    className="p-4 bg-muted/30 border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-[#b07e3a]/20 transition-all"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="h-9 w-9 bg-muted border border-border text-muted-foreground rounded-xl flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        {req.userName?.[0]?.toUpperCase() || "D"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{req.userName}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{req.userEmail}</p>
                        <p className="text-[9px] text-muted-foreground mt-1">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                        {req.downloadUrl && (
                          <p className="text-xs text-foreground/90 mt-2 font-medium font-mono leading-relaxed bg-muted/50 border border-border/40 p-2.5 rounded-xl max-w-xl break-all">
                            Archive: {req.downloadUrl}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 flex-shrink-0 text-left sm:text-right">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${badgeClass} inline-block self-start sm:self-auto`}>
                        {req.status}
                      </span>
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleApproveDataRequest(req._id)}
                          className="h-8 px-3 rounded-lg border border-emerald-500/30 bg-[#2d4c38] text-white hover:bg-[#3a6349] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Approve & Set Link
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
