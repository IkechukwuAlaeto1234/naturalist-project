"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  Send,
  Download,
  FileText,
  Image as ImageIcon,
  Star,
  RefreshCw,
  X,
  UserCheck
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface ChatAttachment {
  type: "image" | "pdf" | "text";
  name: string;
  url: string;
  publicId?: string;
  size?: number;
  contentSnippet?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: ChatAttachment[];
  timestamp: string;
  senderName: string;
}

interface ChatSession {
  _id: string;
  sessionId: string;
  name?: string;
  email?: string;
  status: "active" | "resolved";
  mode: "ai" | "human";
  messages: ChatMessage[];
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "ai" | "human">("all");

  // Input states
  const [replyText, setReplyText] = useState("");

  // Loading indicators
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Document modal viewer
  const [activeDoc, setActiveDoc] = useState<ChatAttachment | null>(null);

  const { showToast } = useToast();
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch list of chats
  const fetchChats = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    try {
      const res = await fetch("/api/admin/chats");
      if (!res.ok) throw new Error("Failed to retrieve chat sessions.");
      const data = await res.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load chats.");
    } finally {
      setListLoading(false);
    }
  }, []);

  // Fetch detail for selected chat
  const fetchChatDetail = useCallback(async (id: string, silent = false) => {
    if (!silent) setDetailLoading(true);
    try {
      const res = await fetch("/api/admin/chats");
      if (!res.ok) throw new Error("Failed to load details.");
      const data: ChatSession[] = await res.json();
      const match = data.find((c) => c._id === id);
      if (match) {
        setSelectedSession(match);
      }
    } catch (err) {
      console.error("Error loading chat detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    document.title = "Support Chats | Naturalist Admin";
    fetchChats();
  }, [fetchChats]);

  // General poller: Poll chat list every 15s to check for new session arrivals
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Detail poller: Poll selected chat detail every 4s to fetch customer replies
  useEffect(() => {
    if (selectedId) {
      fetchChatDetail(selectedId, true);
      const interval = setInterval(() => {
        fetchChatDetail(selectedId, true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedId, fetchChatDetail]);

  // Auto-scroll chat history bottom on selection
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedSession?.messages]);

  // Handle click on chat item
  const handleSelectSession = (id: string) => {
    setSelectedId(id);
    const found = sessions.find((s) => s._id === id);
    if (found) setSelectedSession(found);
    fetchChatDetail(id);
  };

  // Toggle mode (AI Specialist vs Human Takeover)
  const handleToggleMode = async (targetMode: "ai" | "human") => {
    if (!selectedSession) return;
    setDetailLoading(true);
    try {
      const res = await fetch("/api/admin/chats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSession._id, mode: targetMode }),
      });
      if (!res.ok) throw new Error("Failed to toggle mode.");
      const data = await res.json();
      setSelectedSession(data.chat);
      showToast(
        "success",
        targetMode === "human" ? "Human Takeover Active" : "AI Mode Active",
        targetMode === "human"
          ? "You have taken control. AI is now silenced."
          : "AI is back in charge of this session."
      );
      fetchChats(true);
    } catch (err: any) {
      showToast("error", "Action Failed", err.message || "Failed to alter chat settings.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Resolve chat session
  const handleResolveSession = async () => {
    if (!selectedSession) return;
    setDetailLoading(true);
    try {
      const res = await fetch("/api/admin/chats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSession._id, status: "resolved" }),
      });
      if (!res.ok) throw new Error("Failed to resolve session.");
      const data = await res.json();
      setSelectedSession(data.chat);
      showToast("success", "Session Resolved", "Chat has been successfully closed and archived.");
      fetchChats(true);
    } catch (err: any) {
      showToast("error", "Action Failed", err.message || "Failed to resolve chat.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Send Manual Admin Reply
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !replyText.trim() || sending) return;

    setSending(true);
    const tempText = replyText;
    setReplyText("");

    try {
      const res = await fetch(`/api/admin/chats/${selectedSession._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tempText }),
      });

      if (!res.ok) throw new Error("Could not send reply.");
      const data = await res.json();
      
      // Update selected session messages
      setSelectedSession((prev) => prev ? { ...prev, messages: data.messages, mode: data.mode } : null);
      fetchChats(true);
    } catch (err: any) {
      showToast("error", "Delivery Failed", err.message || "Could not dispatch reply.");
      setReplyText(tempText);
    } finally {
      setSending(false);
    }
  };

  // Filtering chats list
  const filteredSessions = sessions.filter((s) => {
    const emailMatch = s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const nameMatch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const sessionMatch = s.sessionId.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatches = !searchQuery || emailMatch || nameMatch || sessionMatch;

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesMode = modeFilter === "all" || s.mode === modeFilter;

    return queryMatches && matchesStatus && matchesMode;
  });

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col font-sans text-[#141f19]">
      
      {/* Page Title & Control Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#e2dacd]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b07e3a]">Customer Care Console</span>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight mt-0.5">Support Center</h1>
        </div>
        <button
          onClick={() => fetchChats()}
          className="h-9 w-9 rounded-full border border-[#e2dacd] flex items-center justify-center text-[#5e6f64] hover:text-[#141f19] hover:bg-[#f5f2ed] transition-all cursor-pointer flex-shrink-0"
          title="Refresh logs"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 mt-6 flex overflow-hidden border border-[#e2dacd] rounded-3xl bg-white shadow-sm">
        
        {/* ── LEFT PANEL: SESSIONS LIST ── */}
        <div className="w-80 border-r border-[#e2dacd] flex flex-col bg-[#faf8f4]/50">
          {/* Filters */}
          <div className="p-4 border-b border-[#e2dacd] space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8a9e90]" />
              <input
                type="search"
                placeholder="Search user, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#e2dacd] bg-[#faf8f4] text-xs text-[#141f19] placeholder-[#8a9e90] focus:outline-none focus:border-[#b07e3a] focus:bg-white transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-[#e2dacd] bg-[#faf8f4] text-[10px] font-bold px-2 focus:outline-none text-[#5e6f64]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={modeFilter}
                onChange={(e: any) => setModeFilter(e.target.value)}
                className="h-8 rounded-lg border border-[#e2dacd] bg-[#faf8f4] text-[10px] font-bold px-2 focus:outline-none text-[#5e6f64]"
              >
                <option value="all">All Modes</option>
                <option value="ai">AI Bot</option>
                <option value="human">Human</option>
              </select>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f5f2ed]">
            {listLoading ? (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#b07e3a]" />
                <p className="text-[9px] uppercase font-bold tracking-widest text-[#8a9e90]">Loading chats…</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-[#8a9e90] space-y-1">
                <MessageSquare className="h-8 w-8 text-[#e2dacd] mx-auto mb-2" />
                <p className="text-xs font-bold">No sessions found</p>
                <p className="text-[10px] leading-relaxed">No customer support chats match the criteria.</p>
              </div>
            ) : (
              filteredSessions.map((sessionItem) => {
                const isActive = selectedId === sessionItem._id;
                const isSessionActive = sessionItem.status === "active";
                const isModeHuman = sessionItem.mode === "human";
                const lastMessage = sessionItem.messages[sessionItem.messages.length - 1];

                return (
                  <button
                    key={sessionItem._id}
                    onClick={() => handleSelectSession(sessionItem._id)}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-1.5 border-l-4 cursor-pointer hover:bg-[#f5f2ed]/50 ${
                      isActive 
                        ? "bg-[#e8f0eb]/70 border-[#2d4c38]" 
                        : "border-transparent bg-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate max-w-[140px]">
                        {sessionItem.name || "Guest Customer"}
                      </span>
                      <span className="text-[8px] text-[#8a9e90] uppercase font-mono">
                        {new Date(sessionItem.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#8a9e90] truncate leading-tight">
                      {sessionItem.email || `Session: ${sessionItem.sessionId.substring(5, 12)}...`}
                    </p>

                    {lastMessage && (
                      <p className="text-[11px] text-[#5e6f64] truncate leading-normal italic mt-0.5">
                        "{lastMessage.content || "Uploaded attachment"}"
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                        isSessionActive 
                          ? "bg-amber-50 text-amber-700 border-amber-200" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {sessionItem.status}
                      </span>
                      {isSessionActive && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          isModeHuman
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {isModeHuman ? "Human Specialist" : "AI Guide"}
                        </span>
                      )}
                      {sessionItem.rating && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#b07e3a]">
                          <Star className="h-2.5 w-2.5 fill-[#b07e3a]" /> {sessionItem.rating}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: CHAT INTERACTION ── */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3 text-red-700">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold">Error retrieving details</p>
                <p className="text-[11px] text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!selectedSession ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
              <div className="h-16 w-16 bg-[#f5f2ed] border border-[#e2dacd] rounded-full flex items-center justify-center text-[#8a9e90] mb-2">
                <span className="ms ms-filled" style={{ fontSize: "28px" }}>
                  forum
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">No Chat Selected</h3>
              <p className="text-xs text-[#8a9e90] max-w-sm leading-relaxed">
                Choose a customer conversation history from the left queue to view transcripts, trigger live takeover, or resolve issues.
              </p>
            </div>
          ) : (
            /* Selected Session Content */
            <>
              {/* Detail Header */}
              <div className="px-6 py-4 border-b border-[#e2dacd] bg-[#faf8f4]/60 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-serif text-base font-bold leading-tight">
                    {selectedSession.name || "Anonymous Customer"}
                  </h3>
                  <p className="text-[11px] text-[#8a9e90] mt-0.5">
                    {selectedSession.email || "No email provided"} · Session: {selectedSession.sessionId}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    selectedSession.status === "active"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {selectedSession.status}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    selectedSession.mode === "human"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {selectedSession.mode === "human" ? "Human Specialist" : "AI Automated"}
                  </span>
                </div>
              </div>

              {/* Status Action Banner */}
              <div className="px-6 py-3 border-b border-[#e2dacd] bg-[#fdfdfc] flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#b07e3a]" />
                  <span className="font-semibold">
                    {selectedSession.status === "resolved" 
                      ? "Ticket Resolved & Closed" 
                      : selectedSession.mode === "human" 
                      ? "Specialist Override Enabled"
                      : "AI Guide Responding"
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedSession.status === "active" ? (
                    <>
                      {selectedSession.mode === "ai" ? (
                        <button
                          onClick={() => handleToggleMode("human")}
                          disabled={detailLoading}
                          className="h-8 px-3 rounded-lg border border-[#e2dacd] bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        >
                          Take Over Chat
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleMode("ai")}
                          disabled={detailLoading}
                          className="h-8 px-3 rounded-lg border border-[#e2dacd] bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                        >
                          Hand Back to AI
                        </button>
                      )}
                      <button
                        onClick={handleResolveSession}
                        disabled={detailLoading}
                        className="h-8 px-3 rounded-lg bg-[#2d4c38] hover:bg-[#396047] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                      >
                        Resolve Chat
                      </button>
                    </>
                  ) : (
                    /* Display reviews if resolved */
                    selectedSession.rating && (
                      <div className="flex items-center gap-3 bg-[#faf8f4] border border-[#e2dacd] px-3.5 py-1 rounded-xl">
                        <span className="text-[10px] text-[#8a9e90] font-bold uppercase">Customer Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= (selectedSession.rating || 0) ? "fill-[#b07e3a] text-[#b07e3a]" : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Feedback Comment Panel if exists */}
              {selectedSession.feedback && (
                <div className="px-6 py-3 border-b border-[#e2dacd] bg-amber-50/20 text-xs italic text-[#5e6f64] leading-relaxed flex-shrink-0">
                  <strong>Customer Feedback:</strong> "{selectedSession.feedback}"
                </div>
              )}

              {/* ── MESSAGE LOG VIEWER ── */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#faf8f4]/25">
                {selectedSession.messages.map((msg, idx) => {
                  const isSystem = msg.role === "system";
                  const isUser = msg.role === "user";
                  const isAI = msg.role === "assistant" && msg.senderName === "Maya";
                  const isAdminReply = msg.role === "assistant" && msg.senderName !== "Maya";

                  if (isSystem) {
                    return (
                      <div key={idx} className="flex justify-center my-2">
                        <span className="text-[10px] text-[#8a9e90] italic bg-[#faf8f4] border border-[#e2dacd] px-3 py-1 rounded-full text-center">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? "items-start" : "items-end"} max-w-[80%] ${
                        isUser ? "mr-auto" : "ml-auto"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8a9e90] px-1 mb-1">
                        {isUser ? msg.senderName : msg.senderName === "Maya" ? "AI Responder (Maya)" : `${msg.senderName} (Specialist)`}
                      </span>

                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 border ${
                          isUser
                            ? "bg-[#f5f2ed] border-[#e2dacd] text-[#141f19] rounded-tl-none"
                            : isAdminReply
                            ? "bg-[#2d4c38] border-[#2d4c38]/10 text-white rounded-tr-none"
                            : "bg-blue-50 border-blue-200 text-blue-900 rounded-tr-none"
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* Attachments rendering */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-black/5 dark:border-white/5 mt-2">
                            {msg.attachments.map((attach, aIdx) => {
                              const isImg = attach.type === "image";
                              const isPdf = attach.type === "pdf";

                              return (
                                <button
                                  key={aIdx}
                                  type="button"
                                  onClick={() => setActiveDoc(attach)}
                                  className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all text-left group cursor-pointer ${
                                    isUser
                                      ? "bg-white border-[#e2dacd] hover:border-[#b07e3a] text-[#141f19]"
                                      : isAdminReply
                                      ? "bg-white/10 border-white/20 hover:bg-white/15 text-white"
                                      : "bg-white border-blue-200 hover:border-blue-400 text-blue-900"
                                  }`}
                                >
                                  {isImg ? (
                                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-black/10 bg-black/5 flex-shrink-0">
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
                                      <p className="text-[9px] text-[#8a9e90] mt-0.5 leading-none">
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

                      <span className="text-[8px] text-[#8a9e90]/80 px-1 mt-1">
                        {new Date(msg.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* ── RESPONSE BOX FOR ADMIN ── */}
              {selectedSession.status === "active" && (
                <div className="p-4 border-t border-[#e2dacd] bg-[#faf8f4]/60 flex-shrink-0">
                  <form onSubmit={handleSendAdminReply} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={selectedSession.mode === "ai" 
                        ? "Typing here will silence the AI bot and takeover the conversation..."
                        : "Type reply to specialist chat..."
                      }
                      className="flex-1 h-10 px-4 text-xs rounded-xl border border-[#e2dacd] bg-white text-[#141f19] placeholder-[#8a9e90] focus:outline-none focus:border-[#b07e3a] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="h-10 px-4 rounded-xl bg-[#2d4c38] text-[#b07e3a] hover:opacity-95 transition-all flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" /> Send
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── PDF/DOCUMENT MODAL READER ── */}
      {activeDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActiveDoc(null)} />
          <div className="relative bg-white border border-[#e2dacd] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#e2dacd] flex items-center justify-between bg-[#faf8f4]">
              <div className="flex items-center gap-2.5">
                {activeDoc.type === "image" ? (
                  <ImageIcon className="h-5 w-5 text-[#b07e3a]" />
                ) : (
                  <FileText className="h-5 w-5 text-[#b07e3a]" />
                )}
                <div>
                  <h4 className="text-xs font-bold truncate max-w-xs sm:max-w-md">{activeDoc.name}</h4>
                  {activeDoc.size && (
                    <p className="text-[9px] text-[#8a9e90] mt-0.5">
                      {(activeDoc.size / 1024).toFixed(1)} KB · {activeDoc.type.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveDoc(null)}
                className="h-8 w-8 rounded-full border border-[#e2dacd] flex items-center justify-center text-[#5e6f64] hover:text-[#141f19] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#faf8f4]/20">
              {activeDoc.type === "image" ? (
                <div className="w-full flex items-center justify-center">
                  <img
                    src={activeDoc.url}
                    alt={activeDoc.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl border border-[#e2dacd] shadow-sm"
                  />
                </div>
              ) : activeDoc.type === "pdf" ? (
                <div className="w-full h-[55vh] rounded-xl overflow-hidden border border-[#e2dacd] bg-white shadow-sm">
                  <iframe
                    src={`${activeDoc.url}#toolbar=0&navpanes=0`}
                    className="w-full h-full"
                    title={activeDoc.name}
                  />
                </div>
              ) : (
                <div className="w-full p-5 rounded-2xl border border-[#e2dacd] bg-white shadow-sm">
                  {activeDoc.contentSnippet ? (
                    <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap text-[#141f19] max-h-[50vh] overflow-y-auto select-text">
                      {activeDoc.contentSnippet}
                      {activeDoc.contentSnippet.length >= 300 && "\n\n[Truncated Preview. Open original to read full details.]"}
                    </pre>
                  ) : (
                    <p className="text-xs text-[#8a9e90] italic text-center py-10">No content snippet preview available.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e2dacd] flex justify-end gap-3 bg-[#faf8f4]">
              <a
                href={activeDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                download={activeDoc.name}
                className="h-10 px-5 rounded-xl border border-[#b07e3a]/30 hover:border-[#b07e3a] bg-white text-[#b07e3a] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5" /> Download File
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

    </div>
  );
}
