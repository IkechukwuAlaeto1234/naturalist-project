"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  Star,
  Loader2,
  Check,
  AlertCircle,
  X,
  ArrowUp,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ChatAttachment {
  type: "image" | "pdf" | "text";
  name: string;
  url: string;
  publicId?: string;
  size?: number;
  contentSnippet?: string;
}

interface TempAttachment {
  type: "image" | "pdf" | "text";
  name: string;
  url?: string;
  publicId?: string;
  size?: number;
  contentSnippet?: string;
  file: File;
  uploading: boolean;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: ChatAttachment[];
  timestamp: string;
  senderName: string;
}

/* ─── Suggestion chips ───────────────────────────────────────────────────── */

const CHIPS = [
  "Routine recommendations for dry skin",
  "How can I track my order?",
  "Shipping and return policies",
  "Which product is best for hyperpigmentation?",
];

/* ═══════════════════════════════════════════════════════════════════════════
   Support Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus]     = useState<"active" | "resolved">("active");
  const [mode, setMode]         = useState<"ai" | "human">("ai");

  // Input
  const [inputText, setInputText]     = useState("");
  const [attachments, setAttachments] = useState<TempAttachment[]>([]);
  const [nameInput, setNameInput]     = useState("");
  const [emailInput, setEmailInput]   = useState("");

  // Loading / error
  const [loading, setLoading]           = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError]               = useState("");
  const [uploadError, setUploadError]   = useState("");

  // Feedback
  const [showFeedback, setShowFeedback]         = useState(false);
  const [rating, setRating]                     = useState(5);
  const [feedbackText, setFeedbackText]         = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Document viewer
  const [activeDoc, setActiveDoc] = useState<ChatAttachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const pollerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Session init ── */
  useEffect(() => {
    document.title = "Support | Naturalist";
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("naturalist_support_session_id");
      if (!id) {
        id = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        localStorage.setItem("naturalist_support_session_id", id);
      }
      setSessionId(id);
    }
  }, []);

  /* ── Fetch history ── */
  const fetchHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/support/chat?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setStatus(data.status || "active");
        setMode(data.mode || "ai");
      }
    } catch (err) {
      console.error("fetch history error:", err);
    } finally {
      setSessionLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) fetchHistory();
  }, [sessionId, fetchHistory]);

  /* ── Polling when specialist takes over ── */
  useEffect(() => {
    if (mode === "human" && status === "active") {
      pollerRef.current = setInterval(fetchHistory, 5000);
    } else {
      if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
    }
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [mode, status, fetchHistory]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Auto-resize textarea ── */
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  /* ── CDN proxy helper ── */
  const toCdnUrl = (url: string) => {
    if (!url) return "";
    return url.replace(
      new RegExp(`https://res\\.cloudinary\\.com/dtpwhaxvh`),
      "/cdn"
    );
  };

  /* ── Signed Cloudinary upload ── */
  const uploadFile = async (file: File): Promise<ChatAttachment | null> => {
    try {
      const sigRes = await fetch("/api/support/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!sigRes.ok) throw new Error("Could not get upload signature.");
      const sig = await sigRes.json();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", sig.timestamp.toString());
      fd.append("signature", sig.signature);
      fd.append("folder", "naturalist/support");

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
        method: "POST",
        body: fd,
      });
      if (!upRes.ok) throw new Error("Upload failed.");
      const up = await upRes.json();

      let type: "image" | "pdf" | "text" = "text";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type === "application/pdf") type = "pdf";

      let snippet = "";
      if (type === "text") snippet = (await file.text()).slice(0, 300);

      return {
        type,
        name: file.name,
        url: toCdnUrl(up.secure_url),
        publicId: up.public_id,
        size: file.size,
        contentSnippet: snippet || undefined,
      };
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
      return null;
    }
  };

  /* ── File picker ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    if (file.size > 1024 * 1024) { setUploadError("Max file size is 1 MB."); return; }

    const type: "image" | "pdf" | "text" = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "text";
    const temp: TempAttachment = { type, name: file.name, size: file.size, file, uploading: true };
    setAttachments((p) => [...p, temp]);

    const result = await uploadFile(file);
    if (result) {
      setAttachments((p) => p.map((a) => a.file === file ? { ...a, url: result.url, publicId: result.publicId, contentSnippet: result.contentSnippet, uploading: false } : a));
    } else {
      setAttachments((p) => p.filter((a) => a.file !== file));
    }
    // Reset so same file can be picked again
    e.target.value = "";
  };

  /* ── Paste-to-file (long pastes) ── */
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    if (text && text.length > 500) {
      e.preventDefault();
      const name = `Pasted Text — ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.txt`;
      const blob = new Blob([text], { type: "text/plain" });
      const file = new File([blob], name, { type: "text/plain" });
      if (blob.size > 1024 * 1024) { setUploadError("Pasted content exceeds 1 MB limit."); return; }

      const temp: TempAttachment = { type: "text", name, size: blob.size, file, uploading: true };
      setAttachments((p) => [...p, temp]);

      const result = await uploadFile(file);
      if (result) {
        setAttachments((p) => p.map((a) => a.file === file ? { ...a, url: result.url, publicId: result.publicId, contentSnippet: result.contentSnippet, uploading: false } : a));
      } else {
        setAttachments((p) => p.filter((a) => a.file !== file));
      }
    }
  };

  /* ── Intake submit ── */
  const handleIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) { setError("Please fill in both fields."); return; }
    if (!/^\S+@\S+\.\S+$/.test(emailInput)) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name: nameInput.trim(), email: emailInput.toLowerCase().trim(), message: "Joined support chat." }),
      });
      if (!res.ok) throw new Error("Failed to start session.");
      const data = await res.json();
      setMessages(data.messages || []);
      setStatus(data.status || "active");
      setMode(data.mode || "ai");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Send message ── */
  const sendMessage = async (text?: string) => {
    const content = text !== undefined ? text : inputText;
    if (attachments.some((a) => a.uploading)) return;
    if (!content.trim() && attachments.length === 0) return;

    setLoading(true);
    setInputText("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }

    const tempAttachments = attachments.map((a) => ({
      type: a.type,
      name: a.name,
      url: a.url || "",
      size: a.size,
      contentSnippet: a.contentSnippet,
    }));

    setMessages((p) => [...p, {
      role: "user",
      content,
      attachments: tempAttachments,
      timestamp: new Date().toISOString(),
      senderName: nameInput || "You",
    }]);
    setAttachments([]);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: content, attachments: tempAttachments }),
      });
      if (!res.ok) throw new Error("Failed to send.");
      const data = await res.json();
      setMessages(data.messages || []);
      setStatus(data.status || "active");
      setMode(data.mode || "ai");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Feedback submit ── */
  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/support/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, rating, feedback: feedbackText }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
        setTimeout(() => {
          const newId = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
          localStorage.setItem("naturalist_support_session_id", newId);
          setSessionId(newId);
          setMessages([]);
          setShowFeedback(false);
          setFeedbackSubmitted(false);
          setFeedbackText("");
          setNameInput("");
          setEmailInput("");
          setSessionLoading(false);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Transcript download ── */
  const downloadTranscript = () => {
    if (!messages.length) return;
    const log = messages.map((m) => {
      const t = new Date(m.timestamp).toLocaleString();
      const att = m.attachments?.length ? `\n[Attachments: ${m.attachments.map((a) => `${a.name} (${a.type})`).join(", ")}]` : "";
      return `[${t}] ${m.senderName}: ${m.content}${att}`;
    }).join("\n\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([log], { type: "text/plain;charset=utf-8" }));
    link.download = `naturalist-support-${sessionId.substring(5, 12)}.txt`;
    link.click();
  };

  const hasSession = messages.length > 0;
  const canSend    = (inputText.trim().length > 0 || attachments.length > 0) && !attachments.some((a) => a.uploading) && !loading;

  /* ════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#faf8f4] dark:bg-[#0a0d0b] flex flex-col font-sans">

      {/* ── Loading skeleton ── */}
      {sessionLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Connecting…</p>
          </div>
        </div>
      )}

      {/* ════════════════════
          INTAKE FORM
          ════════════════════ */}
      {!sessionLoading && !hasSession && !showFeedback && (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">

            {/* Brand mark */}
            <div className="text-center mb-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#2d4c38]/10 text-[#2d4c38] dark:text-emerald-400 mb-4">
                <span className="ms ms-filled" style={{ fontSize: 32 }}>spa</span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#2d4c38] dark:text-emerald-400">
                How can we help?
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
                Tell us your name and email and a skincare specialist will be with you shortly.
              </p>
            </div>

            <form onSubmit={handleIntake} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your full name"
                  className="h-12 w-full px-4 text-sm rounded-2xl border border-border bg-white dark:bg-[#0f1411] focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  className="h-12 w-full px-4 text-sm rounded-2xl border border-border bg-white dark:bg-[#0f1411] focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 transition-all placeholder:text-muted-foreground/40"
                />
              </div>
              {error && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#2d4c38] hover:bg-[#396047] text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Conversation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════
          FEEDBACK PANEL
          ════════════════════ */}
      {!sessionLoading && showFeedback && (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {feedbackSubmitted ? (
              <div className="text-center space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Thank you</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">Your feedback helps us improve. Starting a new session…</p>
              </div>
            ) : (
              <form onSubmit={handleFeedback} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="font-serif text-2xl font-bold text-foreground">Rate your experience</h2>
                  <p className="text-sm text-muted-foreground">How was your interaction with our team today?</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)} className="cursor-pointer">
                      <Star className={`h-8 w-8 transition-all ${s <= rating ? "fill-[#b07e3a] text-[#b07e3a] scale-110" : "text-muted-foreground/30 hover:text-[#b07e3a]/50"}`} />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comments</label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Any issues or suggestions…"
                    className="w-full p-4 text-sm rounded-2xl border border-border bg-white dark:bg-[#0f1411] focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 transition-all resize-none placeholder:text-muted-foreground/40"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 h-12 border border-border hover:bg-black/5 dark:hover:bg-white/5 text-sm font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 bg-[#2d4c38] hover:bg-[#396047] text-white text-sm font-bold rounded-2xl transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════
          CHAT VIEW
          ════════════════════ */}
      {!sessionLoading && hasSession && !showFeedback && (
        <div className="flex-1 flex flex-col min-h-0">

          {/* ── Thin top bar ── */}
          <div className="border-b border-border/40 bg-white dark:bg-[#0f1411] px-4 sm:px-8 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#b07e3a] animate-pulse" />
              <div>
                <p className="text-sm font-bold text-foreground leading-none">
                  {mode === "ai" ? "Maya — Skincare Specialist" : "Live Specialist"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {status === "resolved" ? "Session ended" : mode === "ai" ? "AI-assisted support" : "Human specialist active"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={downloadTranscript}
                  className="h-8 px-3 rounded-xl border border-border/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-border transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Transcript
                </button>
              )}
              {status === "active" && (
                <button
                  onClick={() => setShowFeedback(true)}
                  className="h-8 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  End Chat
                </button>
              )}
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 min-h-0">

            {/* Welcome card (first time, no messages beyond intake) */}
            {messages.filter((m) => !(m.role === "user" && m.content === "Joined support chat.")).length === 0 && (
              <div className="max-w-2xl mx-auto text-center py-12 space-y-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2d4c38]/8 text-[#2d4c38] dark:text-emerald-400">
                  <span className="ms ms-filled" style={{ fontSize: 28 }}>support_agent</span>
                </div>
                <p className="text-base font-bold text-foreground">Hello, {nameInput || "there"}! I'm Maya.</p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  I'm here to help with skincare questions, order updates, and anything Naturalist. What can I assist you with today?
                </p>
              </div>
            )}

            {/* Suggestion chips — only before any real exchange */}
            {messages.filter((m) => m.role !== "system" && !(m.role === "user" && m.content === "Joined support chat.")).length === 0 && (
              <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-2">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="px-4 py-2 rounded-full border border-border/60 hover:border-[#b07e3a] bg-white dark:bg-[#0f1411] text-xs font-medium text-muted-foreground hover:text-[#b07e3a] transition-all cursor-pointer shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Message bubbles */}
            {messages
              .filter((m) => !(m.role === "user" && m.content === "Joined support chat."))
              .map((msg, idx) => {
                const isUser   = msg.role === "user";
                const isSystem = msg.role === "system";

                if (isSystem) return (
                  <div key={idx} className="flex justify-center">
                    <span className="text-[10px] text-muted-foreground/70 italic bg-white dark:bg-[#0f1411] border border-border/30 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    {/* Avatar */}
                    {!isUser && (
                      <div className="h-7 w-7 rounded-full bg-[#2d4c38] flex-shrink-0 flex items-center justify-center mt-1">
                        <span className="ms ms-filled text-white" style={{ fontSize: 14 }}>support_agent</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 min-w-0">
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-2 ${
                          isUser
                            ? "bg-[#2d4c38] text-white rounded-tr-sm"
                            : "bg-white dark:bg-[#0f1411] border border-border/40 text-foreground rounded-tl-sm shadow-sm"
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-2">
                            {msg.attachments.map((att, ai) => (
                              <button
                                key={ai}
                                onClick={() => setActiveDoc(att)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  isUser
                                    ? "bg-white/10 border-white/20 hover:bg-white/15"
                                    : "bg-muted/30 border-border/40 hover:border-[#b07e3a]"
                                }`}
                              >
                                {att.type === "image" ? (
                                  <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
                                    <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${att.type === "pdf" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                                    <FileText className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold truncate">{att.name}</p>
                                  {att.size && <p className={`text-[9px] mt-0.5 ${isUser ? "text-white/60" : "text-muted-foreground"}`}>{(att.size / 1024).toFixed(1)} KB · {att.type.toUpperCase()}</p>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className={`text-[9px] text-muted-foreground/60 px-1 ${isUser ? "text-right" : "text-left"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 max-w-2xl mr-auto">
                <div className="h-7 w-7 rounded-full bg-[#2d4c38] flex-shrink-0 flex items-center justify-center mt-1">
                  <span className="ms ms-filled text-white" style={{ fontSize: 14 }}>support_agent</span>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#0f1411] border border-border/40 rounded-tl-sm shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-[#b07e3a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 bg-[#b07e3a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 bg-[#b07e3a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ═══════════════════════════════════════
              INPUT BAR — Claude / Anthropic style
              ═══════════════════════════════════════ */}
          {status === "active" && (
            <div className="flex-shrink-0 px-4 sm:px-8 py-4 bg-[#faf8f4] dark:bg-[#0a0d0b]">
              <div className="max-w-2xl mx-auto">

                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-col gap-1.5">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#0f1411] border border-border/40">
                        <div className="flex items-center gap-2 min-w-0">
                          {att.type === "image" ? <ImageIcon className="h-4 w-4 text-[#b07e3a] flex-shrink-0" /> : <FileText className="h-4 w-4 text-[#b07e3a] flex-shrink-0" />}
                          <p className="text-[11px] font-medium truncate">{att.name}</p>
                          <p className="text-[9px] text-muted-foreground flex-shrink-0">{att.size ? `${(att.size / 1024).toFixed(1)} KB` : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {att.uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#b07e3a]" /> : <Check className="h-3.5 w-3.5 text-emerald-500" />}
                          <button onClick={() => setAttachments((p) => p.filter((a) => a.file !== att.file))} className="h-5 w-5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer">
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload error */}
                {uploadError && (
                  <p className="mb-2 text-[10px] font-semibold text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {uploadError}
                  </p>
                )}

                {/* Main input box — styled exactly like Anthropic/Claude */}
                <div className="relative flex flex-col rounded-3xl border border-border/60 bg-white dark:bg-[#0f1411] shadow-sm overflow-hidden focus-within:border-[#2d4c38]/50 focus-within:shadow-md transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); autoResize(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    onPaste={handlePaste}
                    placeholder="Message your skincare specialist…"
                    rows={1}
                    className="w-full px-5 pt-4 pb-2 text-sm bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground/40 text-foreground leading-relaxed min-h-[52px]"
                    style={{ maxHeight: 160 }}
                  />

                  {/* Bottom action row */}
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    {/* Attach button */}
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*,application/pdf,text/plain" onChange={handleFileChange} className="hidden" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                        title="Attach file (image, PDF, text — max 1 MB)"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Arrow-up send button — exactly like Anthropic */}
                    <button
                      onClick={() => sendMessage()}
                      disabled={!canSend}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        canSend
                          ? "bg-[#2d4c38] text-white hover:bg-[#396047] shadow-sm"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      aria-label="Send message"
                    >
                      <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                  Press <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> for new line
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ════════════════════
          DOCUMENT MODAL
          ════════════════════ */}
      {activeDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveDoc(null)} />
          <div className="relative bg-white dark:bg-[#0f1411] border border-border/30 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl z-10">

            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activeDoc.type === "image" ? <ImageIcon className="h-5 w-5 text-[#b07e3a]" /> : <FileText className="h-5 w-5 text-[#b07e3a]" />}
                <div>
                  <h4 className="text-xs font-bold truncate max-w-xs">{activeDoc.name}</h4>
                  {activeDoc.size && <p className="text-[9px] text-muted-foreground mt-0.5">{(activeDoc.size / 1024).toFixed(1)} KB · {activeDoc.type.toUpperCase()}</p>}
                </div>
              </div>
              <button onClick={() => setActiveDoc(null)} className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeDoc.type === "image" ? (
                <img src={activeDoc.url} alt={activeDoc.name} className="max-w-full max-h-[55vh] object-contain rounded-xl border border-border/40 mx-auto block" />
              ) : activeDoc.type === "pdf" ? (
                <div className="w-full h-[55vh] rounded-xl overflow-hidden border border-border/40">
                  <iframe src={`${activeDoc.url}#toolbar=0&navpanes=0`} className="w-full h-full" title={activeDoc.name} />
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-border bg-muted/30">
                  {activeDoc.contentSnippet ? (
                    <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground max-h-[48vh] overflow-y-auto select-text">
                      {activeDoc.contentSnippet}
                      {activeDoc.contentSnippet.length >= 300 && "\n\n[Truncated — open original for full content]"}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-8">No preview available.</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-3">
              <a href={activeDoc.url} target="_blank" rel="noopener noreferrer" download={activeDoc.name}
                className="h-10 px-5 rounded-xl border border-[#b07e3a]/30 hover:border-[#b07e3a] text-[#b07e3a] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
              <button onClick={() => setActiveDoc(null)}
                className="h-10 px-5 rounded-xl bg-[#2d4c38] text-white text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
