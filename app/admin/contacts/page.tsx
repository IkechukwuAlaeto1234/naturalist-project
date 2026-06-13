"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Search,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import CustomDropdown from "@/components/ui/CustomDropdown";

const topicFilterOptions = [
  { value: "", label: "All Topics" },
  { value: "Order Status", label: "Order Status" },
  { value: "Product Question", label: "Product Question" },
  { value: "Collaboration", label: "Collaboration" },
  { value: "Other", label: "Other" },
];

const statusFilterOptions = [
  { value: "", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
];

interface ContactInquiry {
  _id: string;
  name: string;
  email: string;
  topic: string;
  otherTopic?: string;
  message: string;
  ticketId?: string;
  status?: "open" | "replied" | "closed";
  createdAt: string;
}

/* ── Confirm Delete Modal ── */
function ConfirmDeleteModal({
  onConfirm,
  onCancel,
  name,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  name: string;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-[#e2dacd] shadow-2xl p-6 w-full max-w-sm animate-scale-up">
        <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="font-serif text-lg font-bold text-[#141f19] mb-1">Delete Inquiry?</h3>
        <p className="text-sm text-[#5e6f64] mb-5">
          Permanently remove the inquiry from <strong className="text-[#141f19]">{name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-[#e2dacd] bg-[#faf8f4] text-xs font-bold uppercase tracking-wider text-[#5e6f64] hover:bg-[#f0ebe2] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-red-500 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-600 transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  open:    "bg-amber-50 text-amber-700 border-amber-200",
  replied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed:  "bg-zinc-100 text-zinc-500 border-zinc-200",
};

const STATUS_ICONS = {
  open:    Clock,
  replied: CheckCircle2,
  closed:  XCircle,
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (!searchQuery) { setDebouncedSearch(""); setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(() => { setDebouncedSearch(searchQuery); setSearchLoading(false); }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    document.title = "Support Tickets | Naturalist Admin";
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/contacts");
      if (!res.ok) throw new Error("Failed to load contact inquiries.");
      const data = await res.json();
      setContacts(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch contact inquiries.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed.");
      showToast("success", "Inquiry deleted", "The inquiry record has been permanently removed.");
      setContacts(contacts.filter((c) => c._id !== id));
    } catch (e: any) {
      showToast("error", "Failed to delete", e.message || "Failed to delete contact inquiry.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = contacts.filter((c) => {
    const term = debouncedSearch.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.message.toLowerCase().includes(term) ||
      (c.ticketId?.toLowerCase().includes(term) ?? false);
    const matchesTopic  = !topicFilter  || c.topic  === topicFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesTopic && matchesStatus;
  });

  const openCount    = contacts.filter(c => c.status === "open").length;
  const repliedCount = contacts.filter(c => c.status === "replied").length;
  const closedCount  = contacts.filter(c => c.status === "closed").length;

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case "Order Status":     return "bg-amber-50 text-amber-700 border-amber-200";
      case "Order & Shipping": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Product Question": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Account Help":     return "bg-violet-50 text-violet-700 border-violet-200";
      case "Collaboration":    return "bg-pink-50 text-pink-700 border-pink-200";
      default:                 return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  return (
    <div className="space-y-8 pb-20 font-sans text-[#141f19]">

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}

      {/* Page Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b07e3a]">Inquiries Console</span>
        <h1 className="font-serif text-4xl font-extrabold tracking-tight mt-1">Support Tickets</h1>
        <p className="text-xs text-[#5e6f64] mt-2">Manage customer correspondence and support requests submitted through the contact portal.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets",   value: contacts.length, icon: Inbox,        color: "text-[#2d4c38] bg-[#f0ebe2]" },
          { label: "Open",            value: openCount,       icon: Clock,         color: "text-amber-700 bg-amber-50" },
          { label: "Replied",         value: repliedCount,    icon: CheckCircle2,  color: "text-emerald-700 bg-emerald-50" },
          { label: "Closed",          value: closedCount,     icon: XCircle,       color: "text-zinc-500 bg-zinc-100" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-[#e2dacd] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#141f19] leading-none">{value}</p>
              <p className="text-[11px] text-[#8a9e90] mt-0.5 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white border border-[#e2dacd] rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a9e90]" />
          <input
            type="search"
            placeholder="Search by name, email, ticket ID, keywords…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-10 rounded-xl border border-[#e2dacd] bg-[#faf8f4] text-sm text-[#141f19] placeholder-[#8a9e90] focus:outline-none focus:border-[#b07e3a] transition-all"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
          )}
        </div>
        <CustomDropdown options={topicFilterOptions}  value={topicFilter}  onChange={setTopicFilter}  className="w-full md:w-48 flex-shrink-0" />
        <CustomDropdown options={statusFilterOptions} value={statusFilter} onChange={setStatusFilter} className="w-full md:w-44 flex-shrink-0" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#8a9e90] tracking-wider uppercase font-serif">Loading tickets…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Error retrieving tickets</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#e2dacd] rounded-2xl p-16 text-center">
          <Inbox className="h-12 w-12 text-[#e2dacd] mx-auto mb-4" />
          <p className="font-semibold text-[#141f19]">No tickets found</p>
          <p className="text-xs text-[#8a9e90] mt-1">No contact inquiries match your current filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#e2dacd] rounded-2xl overflow-hidden shadow-sm">
          {/* Mobile scroll hint */}
          <div className="flex items-center justify-end gap-1.5 px-4 py-2 border-b border-[#f0ebe2] md:hidden bg-[#faf8f4]">
            <span className="text-[10px] text-[#8a9e90] font-semibold">Scroll for more</span>
            <span className="ms text-[#8a9e90]" style={{ fontSize: 16 }}>chevron_right</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e2dacd] bg-[#faf8f4] text-[10px] font-black uppercase tracking-wider text-[#8a9e90]">
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Topic</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Snippet</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe2] text-xs">
                {filtered.map((c) => {
                  const status = c.status ?? "open";
                  const StatusIcon = STATUS_ICONS[status];
                  return (
                    <tr key={c._id} className="hover:bg-[#faf8f4] transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-[11px] font-bold text-[#b07e3a] bg-[#b07e3a]/8 px-2 py-0.5 rounded-md border border-[#b07e3a]/15">
                          #{c.ticketId ?? "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[#141f19] leading-none">{c.name}</div>
                        <div className="text-[10px] text-[#8a9e90] mt-0.5">{c.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getTopicColor(c.topic)}`}>
                          {c.topic === "Other" && c.otherTopic ? c.otherTopic : c.topic}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${STATUS_STYLES[status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-[#5e6f64] max-w-xs truncate">{c.message}</td>
                      <td className="p-4 text-[#8a9e90]">
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          <a
                            href={`/admin/contacts/${c._id}`}
                            className="h-8 px-2 sm:px-3 rounded-lg border border-[#e2dacd] hover:bg-[#f5f2ed] text-[10px] font-bold uppercase tracking-wider text-[#5e6f64] hover:text-[#141f19] flex items-center gap-1 transition-all whitespace-nowrap flex-shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">View</span>
                          </a>
                          <button
                            onClick={() => setDeleteTarget({ id: c._id, name: c.name })}
                            className="h-8 w-8 rounded-lg border border-[#e2dacd] hover:bg-red-50 text-[#8a9e90] hover:text-red-500 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                            title="Delete inquiry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
