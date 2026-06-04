"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Inbox,
  Clock,
  Mail,
  Trash2,
  Tag,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface ContactInquiry {
  _id: string;
  name: string;
  email: string;
  topic: string;
  otherTopic?: string;
  message: string;
  createdAt: string;
}

export default function AdminViewContactPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inquiry, setInquiry] = useState<ContactInquiry | null>(null);

  useEffect(() => {
    if (id) {
      fetchInquiry();
    }
  }, [id]);

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/contacts/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Contact inquiry not found.");
      const data = await res.json();
      setInquiry(data);
      document.title = `Inquiry from ${data.name} | Naturalist`;
    } catch (e: any) {
      setError(e.message || "Failed to load inquiry.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this inquiry? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Deletion failed.");
      
      showToast("success", "Inquiry deleted", "The inquiry record has been permanently removed.");
      router.push("/admin/contacts");
      router.refresh();
    } catch (e: any) {
      showToast("error", "Failed to delete", e.message || "Failed to delete contact inquiry.");
    }
  };

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

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Retrieving ledger details...</p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4 text-white">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-destructive">Inquiry Failed to Load</p>
          <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          <a href="/admin/contacts" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider">
            <ArrowLeft className="h-3.5 w-3.5" /> Return to list
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
          href="/admin/contacts"
          className="h-10 w-10 rounded-xl border border-[#1a241e] bg-[#0c100e] text-[#a3b2a9] hover:text-white flex items-center justify-center transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Inquiries Console</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight mt-1">Correspondence Ledger</h1>
        </div>
      </div>

      <div className="max-w-2xl bg-[#0c100e] border border-[#1a241e] rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Client Profile Card */}
        <div className="bg-[#070908] border border-[#1a241e] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#2d4c38] flex items-center justify-center font-bold text-lg text-white border border-[#1a241e]">
              {inquiry.name[0].toUpperCase()}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{inquiry.name}</h4>
              <p className="text-xs text-[#a3b2a9] mt-0.5">{inquiry.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1a241e] text-xs">
            <div className="flex items-center gap-2.5 text-[#a3b2a9]">
              <Tag className="h-4 w-4 text-[#b07e3a] flex-shrink-0" />
              <span>Topic: <span className={`inline-flex ml-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getTopicColor(inquiry.topic)}`}>
                {inquiry.topic === "Other" && inquiry.otherTopic ? `Other: ${inquiry.otherTopic}` : inquiry.topic}
              </span></span>
            </div>
            <div className="flex items-center gap-2.5 text-[#a3b2a9]">
              <Calendar className="h-4 w-4 text-[#b07e3a] flex-shrink-0" />
              <span>Submitted: <strong className="text-white">
                {new Date(inquiry.createdAt).toLocaleString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </strong></span>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-2">
          <label className="font-bold text-[#a3b2a9] uppercase tracking-wider text-[10px]">Client Message</label>
          <div className="bg-[#070908] border border-[#1a241e] rounded-2xl p-6 text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
            {inquiry.message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a241e] text-xs">
          <a
            href={`mailto:${inquiry.email}?subject=Re: Naturalist Inquiry [${inquiry.topic}]`}
            className="h-11 rounded-xl bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Mail className="h-4 w-4" />
            Reply via Email
          </a>
          <button
            onClick={handleDelete}
            className="h-11 rounded-xl border border-red-500/20 bg-red-500/5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <Trash2 className="h-4 w-4" />
            Delete Entry
          </button>
        </div>

      </div>
    </div>
  );
}
