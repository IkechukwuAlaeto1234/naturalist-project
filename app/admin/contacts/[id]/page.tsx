"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Mail,
  Trash2,
  Tag,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Hash,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

/* ── Confirm Delete Modal ── */
function ConfirmDeleteModal({
  onConfirm,
  onCancel,
  ticketId,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  ticketId: string;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-[#e2dacd] shadow-2xl p-6 w-full max-w-sm animate-scale-up">
        <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="font-serif text-lg font-bold text-[#141f19] mb-1">Delete Ticket?</h3>
        <p className="text-sm text-[#5e6f64] mb-5">
          Permanently remove ticket <strong className="font-mono text-[#b07e3a]">#{ticketId}</strong>? This action cannot be undone.
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

interface ContactReply {
  sender: string;
  message: string;
  sentAt: string;
}

interface ContactInquiry {
  _id: string;
  name: string;
  email: string;
  topic: string;
  otherTopic?: string;
  message: string;
  ticketId?: string;
  status?: "open" | "replied" | "closed";
  replies?: ContactReply[];
  createdAt: string;
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

export default function AdminViewContactPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [inquiry, setInquiry]   = useState<ContactInquiry | null>(null);
  const [closing, setClosing]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => { if (id) fetchInquiry(); }, [id]);

  const fetchInquiry = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/contacts/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Contact inquiry not found.");
      const data = await res.json();
      setInquiry(data);
      document.title = `${data.ticketId ?? "Ticket"} — ${data.name} | Naturalist`;
    } catch (e: any) {
      setError(e.message || "Failed to load inquiry.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed.");
      showToast("success", "Inquiry deleted", "The inquiry record has been permanently removed.");
      router.push("/admin/contacts");
      router.refresh();
    } catch (e: any) {
      showToast("error", "Failed to delete", e.message || "Failed to delete contact inquiry.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!inquiry) return;
    const newStatus = inquiry.status === "closed" ? "open" : "closed";
    try {
      setClosing(true);
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed.");
      setInquiry(prev => prev ? { ...prev, status: newStatus } : prev);
      showToast("success", newStatus === "closed" ? "Ticket closed" : "Ticket reopened", "Status updated successfully.");
    } catch (e: any) {
      showToast("error", "Update failed", e.message);
    } finally {
      setClosing(false);
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case "Order Status":     return "bg-amber-50 text-amber-700 border-amber-200";
      case "Product Question": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Collaboration":    return "bg-blue-50 text-blue-700 border-blue-200";
      default:                 return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs text-[#8a9e90] tracking-wider uppercase font-serif">Loading ticket…</p>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-700">Failed to Load Ticket</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <a href="/admin/contacts" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
          </a>
        </div>
      </div>
    );
  }

  const status = inquiry.status ?? "open";
  const StatusIcon = STATUS_ICONS[status];

  return (
    <div className="space-y-6 pb-20 text-[#141f19] max-w-3xl mx-auto">

      {/* Delete confirmation modal */}
      {showDeleteModal && inquiry && (
        <ConfirmDeleteModal
          ticketId={inquiry.ticketId ?? ""}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <a
          href="/admin/contacts"
          className="h-10 w-10 rounded-xl border border-[#e2dacd] bg-white text-[#5e6f64] hover:text-[#141f19] hover:bg-[#f5f2ed] flex items-center justify-center transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Inquiries Console</span>
          <h1 className="font-serif text-2xl font-bold tracking-tight mt-0.5">Ticket Detail</h1>
        </div>
      </div>

      {/* Ticket Metadata Bar */}
      <div className="bg-white border border-[#e2dacd] rounded-2xl p-5 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-[#b07e3a]" />
          <span className="font-mono text-sm font-black text-[#b07e3a]">#{inquiry.ticketId ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[status]}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#8a9e90]">
          <Calendar className="h-4 w-4" />
          {new Date(inquiry.createdAt).toLocaleString("en-US", {
            month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Tag className="h-4 w-4 text-[#5e6f64]" />
          <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold border ${getTopicColor(inquiry.topic)}`}>
            {inquiry.topic === "Other" && inquiry.otherTopic ? `Other: ${inquiry.otherTopic}` : inquiry.topic}
          </span>
        </div>
      </div>

      {/* Client Card */}
      <div className="bg-white border border-[#e2dacd] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[#f0ebe2] flex items-center justify-center font-bold text-2xl text-[#2d4c38] flex-shrink-0 border border-[#e2dacd]">
            {inquiry.name[0].toUpperCase()}
          </div>
          <div>
            <h4 className="text-lg font-black text-[#141f19]">{inquiry.name}</h4>
            <p className="text-sm text-[#8a9e90]">{inquiry.email}</p>
          </div>
        </div>

        {/* Original message */}
        <div className="mt-5 pt-5 border-t border-[#f0ebe2]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-3">Original Message</p>
          <div className="bg-[#faf8f4] border border-[#e2dacd] rounded-xl p-5 text-sm text-[#141f19] leading-relaxed whitespace-pre-wrap">
            {inquiry.message}
          </div>
        </div>
      </div>

      {/* Reply Thread */}
      {inquiry.replies && inquiry.replies.length > 0 && (
        <div className="bg-white border border-[#e2dacd] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#b07e3a]" />
            <p className="text-sm font-black text-[#141f19] uppercase tracking-wider">Correspondence Thread</p>
            <span className="ml-auto text-[10px] font-bold text-[#8a9e90] bg-[#f5f2ed] px-2 py-0.5 rounded-full">{inquiry.replies.length} reply{inquiry.replies.length !== 1 ? "ies" : ""}</span>
          </div>
          <div className="space-y-3">
            {inquiry.replies.map((reply, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-[#2d4c38] flex items-center justify-center text-[10px] font-bold text-[#b07e3a] flex-shrink-0 mt-0.5">
                  {reply.sender[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex-1 bg-[#faf8f4] border border-[#e2dacd] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#141f19]">{reply.sender}</span>
                    <span className="text-[10px] text-[#8a9e90]">
                      {new Date(reply.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-[#5e6f64] leading-relaxed">{reply.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white border border-[#e2dacd] rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-4">Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Reply via Email Powerhouse */}
          <a
            href={`/admin/emails?ticketId=${inquiry.ticketId}&replyTo=${inquiry.email}&subject=Re: Ticket ${inquiry.ticketId} - ${inquiry.topic}&inquiryId=${inquiry._id}`}
            className="h-11 rounded-xl bg-[#2d4c38] text-xs font-extrabold uppercase tracking-widest text-white hover:bg-[#3a6349] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Send className="h-4 w-4 text-white" />
            Reply via Email Hub
          </a>

          {/* Close / Reopen */}
          <button
            onClick={handleCloseTicket}
            disabled={closing}
            className={`h-11 rounded-xl border text-xs font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
              status === "closed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {closing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : status === "closed"
                ? <><CheckCircle2 className="h-4 w-4" /> Reopen Ticket</>
                : <><XCircle className="h-4 w-4" /> Close Ticket</>
            }
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="h-11 rounded-xl border border-red-200 bg-red-50 text-xs font-extrabold uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete Entry
          </button>
        </div>
      </div>

    </div>
  );
}
