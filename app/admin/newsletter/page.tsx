"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  RefreshCw
} from "lucide-react";

import CustomDropdown from "@/components/ui/CustomDropdown";

interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  welcomeEmailSentAt?: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  // Add Subscriber State
  const [addEmail, setAddEmail] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Welcome Email Send Loading State
  const [sendingWelcomeId, setSendingWelcomeId] = useState<string | null>(null);

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
    document.title = "Newsletter Subscribers | Naturalist";
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/newsletter");
      if (!res.ok) throw new Error("Failed to load subscriber list.");
      const data = await res.json();
      setSubscribers(data);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve subscribers.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sub: Subscriber) => {
    try {
      const updatedStatus = !sub.isActive;
      const res = await fetch(`/api/admin/newsletter/${sub._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      if (!res.ok) throw new Error("Status update failed.");
      const data = await res.json();
      setSubscribers(subscribers.map((s) => (s._id === sub._id ? data : s)));
    } catch (e: any) {
      alert(e.message || "Failed to change active status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this subscriber?")) return;
    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete subscriber.");
      setSubscribers(subscribers.filter((s) => s._id !== id));
    } catch (e: any) {
      alert(e.message || "Delete failed.");
    }
  };

  const handleSendWelcome = async (id: string) => {
    try {
      setSendingWelcomeId(id);
      const res = await fetch(`/api/admin/newsletter/${id}/send-welcome`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send welcome email.");
      
      alert("Welcome email successfully sent and logged!");
      setSubscribers(subscribers.map((s) => (s._id === id ? data : s)));
    } catch (e: any) {
      alert(e.message || "Failed to send welcome email.");
    } finally {
      setSendingWelcomeId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail) return;
    try {
      setAddSaving(true);
      setAddError("");
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add email.");

      // Check if existing sub returned or new
      const exists = subscribers.some((s) => s._id === data._id);
      if (exists) {
        setSubscribers(subscribers.map((s) => (s._id === data._id ? data : s)));
      } else {
        setSubscribers([data, ...subscribers]);
      }
      setAddEmail("");
    } catch (err: any) {
      setAddError(err.message || "Failed to subscribe email.");
    } finally {
      setAddSaving(false);
    }
  };

  const filteredSubs = subscribers.filter((s) => {
    const emailMatches = s.email.toLowerCase().includes(debouncedSearch.toLowerCase());
    const statusMatches =
      !statusFilter ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "inactive" && !s.isActive);
    return emailMatches && statusMatches;
  });

  return (
    <div className="space-y-8 pb-20 font-sans">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a] font-sans">Audience Outreach</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Newsletter</h1>
        </div>
        <button
          onClick={fetchSubscribers}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-xs font-bold text-[#a3b2a9] hover:text-white transition-all disabled:opacity-50 font-sans cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Registry
        </button>
      </div>

      {/* ── Dynamic Form to add subscriber & Search ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Manual Addition Form */}
        <div className="md:col-span-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 h-fit space-y-4">
          <div>
            <h2 className="font-serif text-lg font-bold">Add Subscriber</h2>
            <p className="text-xs text-[#a3b2a9] mt-0.5 font-sans">Manually register a newsletter contact</p>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-sans">
            {addError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 font-sans">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-[#a3b2a9] uppercase tracking-wider font-sans">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. user@email.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1a241e] bg-[#070908] text-white focus:outline-none focus:border-[#b07e3a] transition-all font-sans text-sm font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addSaving || !addEmail}
              className="w-full h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-sans cursor-pointer border-0"
            >
              {addSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Subscribe Email
                </>
              )}
            </button>
          </form>
        </div>

        {/* Subscribers Directory */}
        <div className="md:col-span-8 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="font-serif text-lg font-bold">Subscribers List</h2>
              <p className="text-xs text-[#a3b2a9] mt-0.5 font-sans">Auditing subscribed audience registry</p>
            </div>
          </div>

          {/* Table Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
              <input
                type="search"
                placeholder="Search subscribers by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all font-sans"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
              )}
            </div>
            <CustomDropdown
              options={[
                { value: "", label: "All Subscriptions" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Unsubscribed" },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-full sm:w-52"
            />
          </div>

          {loading && subscribers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-[#a3b2a9]">
              <Loader2 className="h-6 w-6 animate-spin text-[#b07e3a]" />
              <span>Cataloging Subscribers...</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-destructive">Failed to Load Audience</p>
                <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pr-1">
              <table className="w-full text-left text-xs divide-y divide-[#1a241e]">
                <thead>
                  <tr className="text-[#a3b2a9] font-bold uppercase tracking-wider bg-[#0c100e]">
                    <th className="pb-3">Subscribed Email</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Welcome Email</th>
                    <th className="pb-3 text-right">Join Date</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a241e]/50">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#a3b2a9]">
                        No subscribers matched the filtering criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((s) => {
                      const statusClass = s.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20";
                      
                      return (
                        <tr key={s._id} className="hover:bg-white/[0.005]">
                          <td className="py-3.5 pr-2 font-semibold text-white truncate max-w-[200px]">{s.email}</td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleToggleActive(s)}
                              className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full hover:scale-105 transition-transform ${statusClass}`}
                              title={s.isActive ? "Unsubscribe contact" : "Subscribe contact"}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3.5 text-center">
                            {s.welcomeEmailSentAt ? (
                              <div
                                className="inline-flex items-center justify-center gap-1.5 text-emerald-400 font-bold"
                                title={`Sent at: ${new Date(s.welcomeEmailSentAt).toLocaleString()}`}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span className="text-[10px] uppercase tracking-wider">Sent</span>
                              </div>
                            ) : s.isActive ? (
                              <button
                                onClick={() => handleSendWelcome(s._id)}
                                disabled={sendingWelcomeId === s._id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#b07e3a]/30 hover:border-[#b07e3a] bg-[#b07e3a]/5 hover:bg-[#b07e3a]/15 text-[#b07e3a] hover:text-[#e4a853] text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                                title="Send Welcome Email"
                              >
                                {sendingWelcomeId === s._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Mail className="h-3 w-3" />
                                )}
                                <span>Send</span>
                              </button>
                            ) : (
                              <span className="text-[#5e6f64] italic text-[10px]">N/A</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right text-[#a3b2a9] text-[10px]">
                            {new Date(s.subscribedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleDelete(s._id)}
                              className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/5 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete Contact"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
