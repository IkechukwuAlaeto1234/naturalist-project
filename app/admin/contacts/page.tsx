"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Search,
  Loader2,
  AlertCircle,
  Trash2,
  Eye,
  Calendar,
  User,
  Mail,
  Tag,
  MessageSquare,
  X
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

interface ContactInquiry {
  _id: string;
  name: string;
  email: string;
  topic: string;
  otherTopic?: string;
  message: string;
  createdAt: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [topicFilter, setTopicFilter] = useState("");
  
  const { showToast } = useToast();

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
    document.title = "Contact Inquiries Command Center | Naturalist";
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
    if (!confirm("Are you sure you want to permanently delete this inquiry? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Deletion failed.");
      
      showToast("success", "Inquiry deleted", "The inquiry record has been permanently removed.");
      setContacts(contacts.filter((c) => c._id !== id));
    } catch (e: any) {
      showToast("error", "Failed to delete", e.message || "Failed to delete contact inquiry.");
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const term = debouncedSearch.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.message.toLowerCase().includes(term);
    const matchesTopic = !topicFilter || c.topic === topicFilter;
    return matchesSearch && matchesTopic;
  });

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case "Order Status":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Product Question":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Collaboration":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-8 pb-20 font-sans text-white">
      
      {/* ── Page Header ── */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b07e3a]">Inquiries Console</span>
        <h1 className="font-serif text-4xl font-extrabold tracking-tight mt-1">Contact Inquiries</h1>
        <p className="text-xs text-[#a3b2a9] mt-2">Manage customer correspondence, queries, and feedback submitted through the store contact portal.</p>
      </div>

      {/* ── Statistics Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9]">Total Inquiries</span>
            <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Inbox className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight">{contacts.length}</h3>
            <p className="text-[10px] text-[#a3b2a9] mt-1">Correspondence items submitted</p>
          </div>
        </div>

        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9]">Order Queries</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Tag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {contacts.filter((c) => c.topic === "Order Status").length}
            </h3>
            <p className="text-[10px] text-[#a3b2a9] mt-1">Order tracking and shipping topics</p>
          </div>
        </div>

        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9]">Other Queries</span>
            <span className="p-2 rounded-xl bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
              <MessageSquare className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {contacts.filter((c) => c.topic !== "Order Status" && c.topic !== "Product Question").length}
            </h3>
            <p className="text-[10px] text-[#a3b2a9] mt-1">Collaborations and miscellaneous items</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4 shadow-md">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search inquiries by client name, email, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
          )}
        </div>
        <CustomDropdown
          options={topicFilterOptions}
          value={topicFilter}
          onChange={(val) => setTopicFilter(val)}
          className="w-full md:w-56 flex-shrink-0"
        />
      </div>

      {/* ── Correspondence Grid / Table ── */}
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Cataloging correspondence...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Error retrieving inquiries</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-16 text-center text-[#a3b2a9] text-sm">
          <Inbox className="h-12 w-12 text-[#a3b2a9]/20 mx-auto mb-4" />
          <p className="font-semibold text-white">No inquiries found</p>
          <p className="text-xs text-[#a3b2a9] mt-1">There are no contact form entries matching your parameters.</p>
        </div>
      ) : (
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1a241e] bg-[#070908]/40 text-xs font-bold uppercase tracking-wider text-[#a3b2a9]">
                  <th className="p-5 font-semibold">Client</th>
                  <th className="p-5 font-semibold">Topic</th>
                  <th className="p-5 font-semibold">Snippet</th>
                  <th className="p-5 font-semibold">Submitted At</th>
                  <th className="p-5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a241e] text-xs">
                {filteredContacts.map((c) => (
                  <tr key={c._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-white leading-none">{c.name}</div>
                      <div className="text-[10px] text-[#a3b2a9] mt-1">{c.email}</div>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold border ${getTopicColor(c.topic)}`}>
                        {c.topic === "Other" && c.otherTopic ? `Other: ${c.otherTopic}` : c.topic}
                      </span>
                    </td>
                    <td className="p-5 text-[#a3b2a9] max-w-xs truncate">
                      {c.message}
                    </td>
                    <td className="p-5 text-[#a3b2a9]">
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="p-5 text-right">
                      <div className="inline-flex gap-2">
                        <a
                          href={`/admin/contacts/${c._id}`}
                          className="h-8 px-3 rounded-lg border border-[#1a241e] hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white flex items-center justify-center gap-1 transition-all"
                          title="Open details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </a>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="h-8 w-8 rounded-lg border border-[#1a241e] hover:bg-red-500/5 text-red-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
                          title="Delete inquiry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
