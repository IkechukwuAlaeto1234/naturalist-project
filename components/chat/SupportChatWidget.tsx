"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  Star,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";

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

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"active" | "resolved">("active");
  const [mode, setMode] = useState<"ai" | "human">("ai");
  
  // Input fields
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<TempAttachment[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  
  // Loading & status states
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Feedback states
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Active Document Viewer modal
  const [activeDoc, setActiveDoc] = useState<ChatAttachment | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Session ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedId = localStorage.getItem("naturalist_support_session_id");
      if (!storedId) {
        storedId = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        localStorage.setItem("naturalist_support_session_id", storedId);
      }
      setSessionId(storedId);
    }
  }, []);

  // Fetch Chat History
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
      console.error("Error fetching support chat history:", err);
    } finally {
      setSessionLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchHistory();
    }
  }, [sessionId, fetchHistory]);

  // Polling for Specialist Messages (mode === "human" and status === "active")
  useEffect(() => {
    if (open && mode === "human" && status === "active") {
      pollerRef.current = setInterval(fetchHistory, 5000);
    } else {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    }
    return () => {
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, [open, mode, status, fetchHistory]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Helper to convert Raw Cloudinary URL to proxied local CDN path
  const toCdnUrl = (cloudinarySecureUrl: string): string => {
    if (!cloudinarySecureUrl) return "";
    const cloudName = "dtpwhaxvh"; // Cloudinary account name
    return cloudinarySecureUrl.replace(
      new RegExp(`https://res\\.cloudinary\\.com/${cloudName}`),
      "/cdn"
    );
  };

  // Signed Direct Cloudinary Upload for support attachment files
  const uploadFileToCloudinary = async (file: File): Promise<ChatAttachment | null> => {
    try {
      // 1. Fetch direct signed signature from server
      const sigRes = await fetch("/api/support/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!sigRes.ok) throw new Error("Could not retrieve upload signature.");
      const sigData = await sigRes.json();

      // 2. Upload directly to Cloudinary using secure token
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);
      formData.append("folder", "naturalist/support");

      const cloudUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;
      const upRes = await fetch(cloudUrl, {
        method: "POST",
        body: formData,
      });

      if (!upRes.ok) throw new Error("Cloudinary file transmission failed.");
      const upData = await upRes.json();

      // 3. Map file type
      let type: "image" | "pdf" | "text" = "text";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type === "application/pdf") type = "pdf";

      // 4. Create text snippet if text file
      let snippet = "";
      if (type === "text") {
        const text = await file.text();
        snippet = text.slice(0, 300);
      }

      return {
        type,
        name: file.name,
        url: toCdnUrl(upData.secure_url),
        publicId: upData.public_id,
        size: file.size,
        contentSnippet: snippet || undefined,
      };
    } catch (err: any) {
      console.error("Cloudinary upload failure:", err);
      setUploadError(err.message || "Failed to upload file.");
      return null;
    }
  };

  // Handles select file event
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Limit to 1MB
    if (file.size > 1024 * 1024) {
      setUploadError("Max file size is 1MB. Please compress and try again.");
      return;
    }

    const tempId = Math.random().toString();
    const type: "image" | "pdf" | "text" = file.type.startsWith("image/")
      ? "image"
      : file.type === "application/pdf"
      ? "pdf"
      : "text";

    const newAttach = {
      type,
      name: file.name,
      size: file.size,
      file,
      uploading: true,
    };

    setAttachments((prev) => [...prev, newAttach]);

    const uploaded = await uploadFileToCloudinary(file);

    if (uploaded) {
      setAttachments((prev) =>
        prev.map((item) =>
          item.file === file ? { ...item, url: uploaded.url, publicId: uploaded.publicId, contentSnippet: uploaded.contentSnippet, uploading: false } : item
        )
      );
    } else {
      setAttachments((prev) => prev.filter((item) => item.file !== file));
    }
  };

  // Claude-style paste detection (>500 characters packages as pseudo-file)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText && pastedText.length > 500) {
      e.preventDefault();
      setUploadError("");

      const dateStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const filename = `Pasted Text - ${dateStr}.txt`;
      const blob = new Blob([pastedText], { type: "text/plain" });
      const file = new File([blob], filename, { type: "text/plain" });

      if (blob.size > 1024 * 1024) {
        setUploadError("Pasted content exceeds 1MB limit.");
        return;
      }

      const newAttach = {
        type: "text" as const,
        name: filename,
        size: blob.size,
        file,
        uploading: true,
      };

      setAttachments((prev) => [...prev, newAttach]);

      const uploaded = await uploadFileToCloudinary(file);

      if (uploaded) {
        setAttachments((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, url: uploaded.url, publicId: uploaded.publicId, contentSnippet: uploaded.contentSnippet, uploading: false } : item
          )
        );
      } else {
        setAttachments((prev) => prev.filter((item) => item.file !== file));
      }
    }
  };

  // Remove attachment card
  const removeAttachment = (file: File) => {
    setAttachments((prev) => prev.filter((item) => item.file !== file));
  };

  // Start chat session with Name & Email
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      setError("Please fill in both name and email fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(emailInput)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: nameInput.trim(),
          email: emailInput.toLowerCase().trim(),
          message: "Joined support chat.",
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize session.");
      const data = await res.json();
      setMessages(data.messages || []);
      setStatus(data.status || "active");
      setMode(data.mode || "ai");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = customText !== undefined ? customText : inputText;
    const isUploading = attachments.some((a) => a.uploading);
    
    if (isUploading) return;
    if (!textToSend.trim() && attachments.length === 0) return;

    setLoading(true);
    setInputText("");
    
    // Optimistic user bubble additions
    const tempAttachments = attachments.map((a) => ({
      type: a.type,
      name: a.name,
      url: a.url || "",
      size: a.size,
      contentSnippet: a.contentSnippet,
    }));
    
    const optimisticMessage: ChatMessage = {
      role: "user",
      content: textToSend,
      attachments: tempAttachments,
      timestamp: new Date().toISOString(),
      senderName: nameInput || "Customer",
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setAttachments([]);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: textToSend,
          attachments: tempAttachments,
        }),
      });

      if (!res.ok) throw new Error("Could not deliver message.");
      const data = await res.json();
      setMessages(data.messages || []);
      setStatus(data.status || "active");
      setMode(data.mode || "ai");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Close/End support chat session
  const handleEndChat = async () => {
    setShowFeedback(true);
  };

  // Submit Feedback & Close widget
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/support/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          rating,
          feedback: feedbackText,
        }),
      });

      if (res.ok) {
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setShowFeedback(false);
          setFeedbackSubmitted(false);
          setFeedbackText("");
          setMessages([]);
          // Force generating a new session id for subsequent sessions
          const newSessId = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
          localStorage.setItem("naturalist_support_session_id", newSessId);
          setSessionId(newSessId);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export Chat history transcript as text file
  const handleDownloadTranscript = () => {
    if (messages.length === 0) return;
    const formattedLog = messages
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleString();
        let attachmentsLog = "";
        if (msg.attachments && msg.attachments.length > 0) {
          attachmentsLog = `\n[Attachments: ${msg.attachments.map((a) => `${a.name} (${a.type})`).join(", ")}]`;
        }
        return `[${time}] ${msg.senderName}: ${msg.content}${attachmentsLog}`;
      })
      .join("\n\n");

    const blob = new Blob([formattedLog], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `naturalist-support-transcript-${sessionId.substring(5, 12)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasIntakeCompleted = messages.length > 0 || (messages.length === 0 && !sessionLoading && nameInput && emailInput);

  return (
    <>
      {/* ── Floating Launcher ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full bg-[#2d4c38] text-white border border-[#b07e3a]/40 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300 cursor-pointer focus:outline-none"
        aria-label="Toggle support assistant chat"
      >
        <span className="ms ms-filled" style={{ fontSize: "26px" }}>
          support_agent
        </span>
      </button>

      {/* ── Slide Drawer Chat ── */}
      <div
        className={`fixed inset-y-0 right-0 z-[150] w-full max-w-md bg-white dark:bg-[#0d100e] border-l border-border/40 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } font-sans text-foreground`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/40 dark:border-white/10 bg-[#f7f5f0] dark:bg-[#0f1411]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#b07e3a] animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-[#2d4c38] dark:text-[#f4f6f4] leading-tight">
                Skincare Advisor
              </h4>
              <p className="text-[10px] text-muted-foreground font-medium">
                {mode === "ai" ? "Maya (Support Specialist)" : "Live Specialist"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && status === "active" && (
              <>
                <button
                  onClick={handleDownloadTranscript}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                  title="Download transcript"
                  aria-label="Download transcript"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={handleEndChat}
                  className="px-2.5 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-all cursor-pointer"
                  title="End conversation"
                >
                  End Chat
                </button>
              </>
            )}
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Main Drawer Area ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {sessionLoading ? (
            /* Session Loading Indicator */
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                Connecting Support…
              </p>
            </div>
          ) : !hasIntakeCompleted ? (
            /* ── Pre-chat intake form ── */
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-full bg-[#2d4c38]/10 text-[#2d4c38] dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <span className="ms ms-filled" style={{ fontSize: "28px" }}>
                    spa
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#2d4c38] dark:text-[#f4f6f4]">
                  Welcome to Naturalist
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  Let us know how to contact you, and a skincare specialist will assist you with your skin rituals.
                </p>
              </div>

              <form onSubmit={handleIntakeSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                {error && (
                  <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#2d4c38] hover:bg-[#396047] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Start Conversation"
                  )}
                </button>
              </form>
            </div>
          ) : showFeedback ? (
            /* ── Star Feedback Panel ── */
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-center gap-6 bg-[#faf8f4] dark:bg-[#0f1411]">
              {feedbackSubmitted ? (
                <div className="text-center space-y-3 animate-in fade-in duration-500">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">Feedback Logged</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Thank you. Your feedback helps us refine the skincare guidance system.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      Rate your experience
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      How was your interaction with our support team today?
                    </p>
                  </div>

                  {/* Interactive Star Row */}
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                        aria-label={`Rate ${star} Stars`}
                      >
                        <Star
                          className={`h-7 w-7 transition-all ${
                            star <= rating
                              ? "fill-[#b07e3a] text-[#b07e3a] scale-110"
                              : "text-muted-foreground/30 hover:text-[#b07e3a]/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Comments & feedback
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Were there any issues or inaccuracies? Let us know..."
                      className="w-full p-3.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/30 transition-all resize-none placeholder:text-muted-foreground/40"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowFeedback(false)}
                      className="flex-1 h-11 border border-border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-11 bg-[#2d4c38] hover:bg-[#396047] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ── Chat Messages Log ── */
            <>
              <div className="flex-grow overflow-y-auto px-5 py-4 space-y-4">
                {messages.length === 0 && (
                  /* Welcome card */
                  <div className="p-4 rounded-2xl bg-[#f7f5f0] dark:bg-[#0f1411] border border-border/20 text-center space-y-2 mt-4">
                    <p className="text-xs font-bold text-foreground">
                      Hello! I'm Maya from Naturalist.
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      How may I assist you with your skincare routine or order questions?
                    </p>
                  </div>
                )}

                {messages
                  .filter((m) => !(m.role === "user" && m.content === "Joined support chat."))
                  .map((msg, idx) => {
                    const isUser = msg.role === "user";
                    const isSystem = msg.role === "system";

                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-2.5">
                          <span className="text-[10px] text-muted-foreground/80 italic bg-[#f7f5f0] dark:bg-[#0f1411] border border-border/20 px-3 py-1 rounded-full text-center">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[85%] ${
                          isUser ? "ml-auto" : "mr-auto"
                        }`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 px-1 mb-1">
                          {isUser ? "You" : msg.senderName}
                        </span>
                        
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 shadow-sm border ${
                            isUser
                              ? "bg-[#2d4c38] text-white border-[#2d4c38]/10 rounded-tr-none"
                              : "bg-[#f7f5f0] dark:bg-[#0f1411] text-foreground border-border/30 dark:border-white/5 rounded-tl-none"
                          }`}
                        >
                          {/* Text content */}
                          {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                          {/* Render Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-col gap-2 pt-1.5 border-t border-white/10 dark:border-white/5 mt-1.5">
                              {msg.attachments.map((attach, aIdx) => {
                                const isImg = attach.type === "image";
                                const isPdf = attach.type === "pdf";

                                return (
                                  <button
                                    key={aIdx}
                                    type="button"
                                    onClick={() => setActiveDoc(attach)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group cursor-pointer ${
                                      isUser
                                        ? "bg-white/10 border-white/20 hover:bg-white/15 text-white"
                                        : "bg-background border-border/50 dark:border-white/10 hover:border-[#b07e3a] text-foreground"
                                    }`}
                                  >
                                    {isImg ? (
                                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/20 bg-black/5 flex-shrink-0">
                                        <img src={attach.url} alt={attach.name} className="h-full w-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isPdf ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                      }`}>
                                        <FileText className="h-5 w-5" />
                                      </div>
                                    )}

                                    <div className="min-w-0 flex-grow">
                                      <p className="text-[11px] font-semibold truncate leading-tight">
                                        {attach.name}
                                      </p>
                                      {attach.size && (
                                        <p className={`text-[9px] mt-0.5 leading-none ${
                                          isUser ? "text-white/60" : "text-muted-foreground"
                                        }`}>
                                          {(attach.size / 1024).toFixed(1)} KB · {attach.type.toUpperCase()}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[8px] text-muted-foreground/60 px-1 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                {loading && (
                  /* Typist loader */
                  <div className="flex items-start max-w-[85%] mr-auto">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/75 px-1 mb-1">
                        Maya
                      </span>
                      <div className="rounded-2xl px-4 py-3 bg-[#f7f5f0] dark:bg-[#0f1411] border border-border/30 dark:border-white/5 rounded-tl-none flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-[#b07e3a] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 bg-[#b07e3a] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 bg-[#b07e3a] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Chat Suggestions Chips ── */}
              {messages.length <= 1 && (
                <div className="px-5 py-2.5 flex flex-wrap gap-2 border-t border-border/20 dark:border-white/5 bg-[#faf8f4]/30 dark:bg-[#0f1411]/10">
                  {[
                    "Routine recommendations for dry skin",
                    "How can I track my order?",
                    "Shipping and Return policies"
                  ].map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleSendMessage(undefined, chip)}
                      className="px-3 py-1.5 rounded-full border border-border/50 dark:border-white/10 hover:border-[#b07e3a] bg-white dark:bg-[#0d100e] text-[10px] font-semibold text-muted-foreground hover:text-[#b07e3a] transition-all cursor-pointer shadow-sm"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* ── File Input Attachments & Textarea Container ── */}
              <div className="p-4 border-t border-border/40 dark:border-white/10 bg-[#f7f5f0] dark:bg-[#0f1411]">
                <form onSubmit={handleSendMessage} className="space-y-3.5">
                  {/* Attachment lists */}
                  {attachments.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                      {attachments.map((attach, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/55 dark:border-white/10 animate-in slide-in-from-bottom-2 duration-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {attach.type === "image" ? (
                              <ImageIcon className="h-4 w-4 text-[#b07e3a] flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-[#b07e3a] flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium truncate leading-tight">
                                {attach.name}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5 leading-none">
                                {((attach.size ?? 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {attach.uploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#b07e3a]" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeAttachment(attach.file)}
                              className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Errors */}
                  {uploadError && (
                    <p className="text-[10px] font-semibold text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {uploadError}
                    </p>
                  )}

                  {/* Input row */}
                  <div className="flex items-end gap-2.5 h-11 border border-border bg-white dark:bg-[#0d100e] rounded-xl overflow-hidden pr-2">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onPaste={handlePaste}
                      placeholder="Message your skincare specialist..."
                      className="flex-1 px-3.5 py-3 h-full text-xs bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground/40 leading-relaxed font-sans"
                    />

                    {/* Upload attachment trigger */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf,text/plain"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#b07e3a] hover:bg-[#faf8f4] dark:hover:bg-white/5 transition-all cursor-pointer mb-1.5 flex-shrink-0"
                      title="Attach file (Image, PDF, Text - Max 1MB)"
                    >
                      <Paperclip className="h-4.5 w-4.5" />
                    </button>

                    {/* Send trigger */}
                    <button
                      type="submit"
                      disabled={loading || (!inputText.trim() && attachments.length === 0)}
                      className="h-8 w-8 rounded-lg bg-[#2d4c38] text-[#b07e3a] hover:opacity-90 transition-all flex items-center justify-center cursor-pointer mb-1.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Document/Media Reader Modal ── */}
      {activeDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveDoc(null)} />
          <div className="relative bg-white dark:bg-[#0f1411] border border-border/30 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300 text-foreground">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/40 dark:border-white/10 flex items-center justify-between bg-[#f7f5f0] dark:bg-[#0f1411]/50">
              <div className="flex items-center gap-2.5">
                {activeDoc.type === "image" ? (
                  <ImageIcon className="h-5 w-5 text-[#b07e3a]" />
                ) : (
                  <FileText className="h-5 w-5 text-[#b07e3a]" />
                )}
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate max-w-sm sm:max-w-md">{activeDoc.name}</h4>
                  {activeDoc.size && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {(activeDoc.size / 1024).toFixed(1)} KB · {activeDoc.type.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="h-8 w-8 rounded-full border border-border/50 dark:border-white/15 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Viewer Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#faf8f4]/30 dark:bg-[#0d100e]/30">
              {activeDoc.type === "image" ? (
                <div className="w-full flex items-center justify-center">
                  <img
                    src={activeDoc.url}
                    alt={activeDoc.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl border border-border/40 shadow-sm"
                  />
                </div>
              ) : activeDoc.type === "pdf" ? (
                /* PDF view container */
                <div className="w-full h-[55vh] rounded-xl overflow-hidden border border-border/40 bg-background shadow-sm">
                  <iframe
                    src={`${activeDoc.url}#toolbar=0&navpanes=0`}
                    className="w-full h-full"
                    title={activeDoc.name}
                  />
                </div>
              ) : (
                /* Raw text/snippet display */
                <div className="w-full p-5 rounded-2xl border border-border bg-background shadow-sm">
                  {activeDoc.contentSnippet ? (
                    <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground max-h-[50vh] overflow-y-auto select-text">
                      {activeDoc.contentSnippet}
                      {activeDoc.contentSnippet.length >= 300 && "\n\n[Content truncated for preview. Open the original document to view full details.]"}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-10">No document text preview available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/40 dark:border-white/10 flex justify-end gap-3 bg-[#f7f5f0] dark:bg-[#0f1411]/50">
              <a
                href={activeDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                download={activeDoc.name}
                className="h-10 px-5 rounded-xl border border-[#b07e3a]/30 hover:border-[#b07e3a] bg-white dark:bg-background text-[#b07e3a] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" /> Original File
              </a>
              <button
                onClick={() => setActiveDoc(null)}
                className="h-10 px-5 rounded-xl bg-[#2d4c38] text-white text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer shadow-sm"
              >
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
