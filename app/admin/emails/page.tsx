"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2, Send, Trash2, RotateCcw, Copy, Check, Sparkles, Database,
  Plus, MessageSquare, ChevronLeft, MoreHorizontal, Pencil, X,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/* Composer actions that Gemini can emit */
interface ComposerAction {
  setTo?: string;
  setSubject?: string;
  setBody?: string;
}

/* ─────────────────────────────────────────────────────────────
   Session storage helpers
   ───────────────────────────────────────────────────────────── */
const STORAGE_KEY = "naturalist_email_sessions";
const MAX_SESSIONS = 20;

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // storage full — silently fail
  }
}

function newSession(): ChatSession {
  return {
    id: Math.random().toString(36).slice(2, 11),
    name: "New chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function autoNameSession(messages: ChatMessage[]): string {
  // Use the first user message as the session name (truncated)
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  return first.content.slice(0, 40) + (first.content.length > 40 ? "…" : "");
}

/* ─────────────────────────────────────────────────────────────
   Misc helpers
   ───────────────────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Parse AI reply into:
 *  - composerActions: any [[SET_TO:...]], [[SET_SUBJECT:...]], [[SET_BODY:...]] tags
 *  - draft:           Subject/body email draft (if present)
 *  - conversationalText: everything else shown as chat
 */
function parseAIReply(text: string): {
  composerActions: ComposerAction;
  draft: { subject: string; body: string } | null;
  conversationalText: string;
} {
  let workingText = text;
  const composerActions: ComposerAction = {};

  // Extract and strip action tags from the text
  workingText = workingText.replace(/\[\[SET_TO:(.*?)\]\]/gi, (_, val) => {
    composerActions.setTo = val.trim();
    return "";
  });
  workingText = workingText.replace(/\[\[SET_SUBJECT:(.*?)\]\]/gi, (_, val) => {
    composerActions.setSubject = val.trim();
    return "";
  });
  workingText = workingText.replace(/\[\[SET_BODY:([\s\S]*?)\]\]/gi, (_, val) => {
    composerActions.setBody = val.trim();
    return "";
  });

  workingText = workingText.trim();

  // Strip admin notes after --- separator
  const cleanText = workingText.split(/\n---\n/)[0].trim();
  const lines = cleanText.split("\n");
  const subjectIndex = lines.findIndex((l) =>
    l.trim().toLowerCase().startsWith("subject:")
  );

  let draft: { subject: string; body: string } | null = null;
  let conversationalText = "";

  if (subjectIndex !== -1) {
    const subject = lines[subjectIndex].replace(/^subject:\s*/i, "").trim();
    if (subject) {
      const bodyLines = lines.slice(subjectIndex + 1);
      while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
      draft = { subject, body: bodyLines.join("\n").trim() };
    }
    // Everything before Subject: is conversational
    conversationalText = lines.slice(0, subjectIndex).join("\n").trim();
    conversationalText = conversationalText.split(/\n---\n/)[0].trim();
  } else {
    conversationalText = cleanText;
  }

  return { composerActions, draft, conversationalText };
}

/* ─────────────────────────────────────────────────────────────
   Lightweight markdown renderer
   ───────────────────────────────────────────────────────────── */
function inlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1] !== undefined)
      parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{match[1]}</strong>);
    else if (match[2] !== undefined)
      parts.push(<em key={key++}>{match[2]}</em>);
    else if (match[3] !== undefined)
      parts.push(<code key={key++} style={{ background: "#f0ebe2", borderRadius: 3, padding: "1px 4px", fontSize: "0.85em", fontFamily: "monospace" }}>{match[3]}</code>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^[*-] /.test(line.trim())) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[*-] /.test(lines[i].trim())) {
        items.push(<li key={i} style={{ marginBottom: 2 }}>{inlineMarkdown(lines[i].trim().replace(/^[*-] /, ""))}</li>);
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} style={{ margin: "4px 0", paddingLeft: 18, listStyleType: "disc" }}>{items}</ul>);
      continue;
    }
    if (line.trim() === "") {
      nodes.push(<div key={`sp-${i}`} style={{ height: 8 }} />);
      i++; continue;
    }
    nodes.push(<span key={i} style={{ display: "block" }}>{inlineMarkdown(line)}</span>);
    i++;
  }
  return <>{nodes}</>;
}

/* ─────────────────────────────────────────────────────────────
   Chat bubble
   ───────────────────────────────────────────────────────────── */
function ChatBubble({
  msg,
  onUseDraft,
}: {
  msg: ChatMessage;
  onUseDraft: (subject: string, body: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const { composerActions, draft, conversationalText } = !isUser
    ? parseAIReply(msg.content)
    : { composerActions: {}, draft: null, conversationalText: "" };

  const isDraft = draft !== null;

  const handleCopy = () => {
    if (draft) {
      navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    } else {
      navigator.clipboard.writeText(msg.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div className="h-7 w-7 rounded-full bg-[#2d4c38] flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5 text-white">
          A
        </div>
        <div className="flex-1 max-w-[85%] flex flex-col items-end">
          <div className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed bg-[#2d4c38] text-white">
            {msg.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-row">
      <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#b07e3a]/15 text-[#b07e3a] border border-[#b07e3a]/20 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-[#b07e3a]" />
      </div>

      <div className="flex-1 max-w-[90%] flex flex-col gap-2">
        {/* Composer action pills — shown when Gemini fills fields */}
        {(composerActions.setTo || composerActions.setSubject) && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {composerActions.setTo && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                <span className="ms" style={{ fontSize: 11 }}>check_circle</span>
                To: {composerActions.setTo}
              </span>
            )}
            {composerActions.setSubject && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                <span className="ms" style={{ fontSize: 11 }}>check_circle</span>
                Subject set
              </span>
            )}
            {composerActions.setBody && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-700">
                <span className="ms" style={{ fontSize: 11 }}>check_circle</span>
                Body filled
              </span>
            )}
          </div>
        )}

        {conversationalText && (
          <div className="text-sm text-[#2d3a30] leading-relaxed">
            {renderMarkdown(conversationalText)}
          </div>
        )}

        {isDraft && (
          <div className="rounded-xl border border-[#d4c9b8] bg-[#fffdf9] overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f0e8] border-b border-[#e8dfd0]">
              <span className="ms text-[#b07e3a]" style={{ fontSize: 13 }}>draft</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#b07e3a]">Email Draft</span>
              <span className="ml-auto text-[10px] text-[#a89880] font-medium truncate max-w-[160px]">{draft.subject}</span>
            </div>
            <div className="px-3 py-3 text-xs text-[#3a2e22] leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
              {draft.body}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-t border-[#e8dfd0] bg-[#faf7f2]">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg text-[10px] font-bold text-[#8a9e90] hover:text-[#141f19] hover:bg-[#ede8e0] transition-all cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => onUseDraft(draft.subject, draft.body)}
                className="flex items-center gap-1.5 h-6 px-3 rounded-lg text-[10px] font-extrabold text-white bg-[#2d4c38] hover:bg-[#3a6349] transition-all cursor-pointer ml-auto"
              >
                <span className="ms" style={{ fontSize: 11 }}>arrow_upward</span>
                Use this draft
              </button>
            </div>
          </div>
        )}

        {!isDraft && conversationalText && (
          <button
            onClick={handleCopy}
            className="self-start flex items-center gap-1.5 h-6 px-2 rounded-lg text-[10px] font-bold text-[#c4b89a] hover:text-[#8a9e90] transition-all cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sessions sidebar - FIXED (no nested buttons)
   ───────────────────────────────────────────────────────────── */
function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  collapsed,
  onToggle,
}: {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const startRename = (session: ChatSession) => {
    setEditingId(session.id);
    setEditValue(session.name);
    setMenuId(null);
  };

  const commitRename = (id: string) => {
    if (editValue.trim()) onRename(id, editValue.trim());
    setEditingId(null);
  };

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={`flex flex-col h-full bg-[#faf8f4] border-r border-[#e2dacd] transition-all duration-300 flex-shrink-0 ${collapsed ? "w-10" : "w-[200px]"}`}>
      {/* Sidebar header */}
      <div className="h-14 flex items-center justify-between px-2.5 border-b border-[#e2dacd] flex-shrink-0">
        {!collapsed && (
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] pl-1">Chats</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {!collapsed && (
            <button
              onClick={onNew}
              title="New chat"
              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5e6f64] hover:text-[#2d4c38] hover:bg-[#eee8de] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onToggle}
            title={collapsed ? "Expand" : "Collapse"}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#8a9e90] hover:text-[#141f19] hover:bg-[#eee8de] transition-all cursor-pointer"
          >
            <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Session list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {sorted.length === 0 && (
            <p className="text-[10px] text-[#c4b89a] text-center py-6 px-2 leading-relaxed">
              No chats yet. Start a new one.
            </p>
          )}
          {sorted.map((s) => (
            <div key={s.id} className="relative group" ref={menuId === s.id ? menuRef : undefined}>
              {editingId === s.id ? (
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitRename(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(s.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 text-xs text-[#141f19] bg-white border border-[#b07e3a] rounded-lg px-2 py-1 outline-none"
                  />
                  <button onClick={() => commitRename(s.id)} className="text-[#2d4c38]"><Check className="h-3 w-3" /></button>
                </div>
              ) : (
                /* FIXED: Changed from button to div to avoid nested buttons */
                <div
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-xl transition-all cursor-pointer group ${
                    s.id === activeId
                      ? "bg-white border border-[#e2dacd] shadow-sm text-[#141f19]"
                      : "text-[#5e6f64] hover:bg-white/70 hover:text-[#141f19]"
                  }`}
                >
                  <MessageSquare className="h-3 w-3 flex-shrink-0 opacity-60" />
                  <span className="text-[11px] font-medium truncate flex-1">{s.name}</span>
                  {s.messages.length > 0 && (
                    <span className="text-[9px] text-[#c4b89a] flex-shrink-0">{s.messages.length}</span>
                  )}
                  {/* Kebab menu - now a button inside a div (valid HTML) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuId(menuId === s.id ? null : s.id); }}
                    className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[#eee8de] transition-all flex-shrink-0"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Dropdown menu */}
              {menuId === s.id && (
                <div className="absolute right-0 top-8 z-50 bg-white border border-[#e2dacd] rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                  <button
                    onClick={() => startRename(s)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#5e6f64] hover:bg-[#f5f2ed] hover:text-[#141f19] transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" /> Rename
                  </button>
                  <button
                    onClick={() => { onDelete(s.id); setMenuId(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collapsed: just show new-chat icon */}
      {collapsed && (
        <div className="flex flex-col items-center pt-3 gap-2">
          <button
            onClick={onNew}
            title="New chat"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#5e6f64] hover:text-[#2d4c38] hover:bg-[#eee8de] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   Email Hub Page
   ═════════════════════════════════════════════════════════════ */
export default function AdminEmailHubPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-[#8a9e90]" /></div>}>
      <EmailHubInner />
    </Suspense>
  );
}

function EmailHubInner() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const prefillTo      = searchParams.get("replyTo") ?? "";
  const prefillSubject = searchParams.get("subject") ?? "";
  const prefillTicket  = searchParams.get("ticketId") ?? "";
  const prefillInquiry = searchParams.get("inquiryId") ?? "";

  /* ── Composer state ── */
  const [to, setTo]           = useState(prefillTo);
  const [subject, setSubject] = useState(prefillSubject);
  const [body, setBody]       = useState("");
  const [sending, setSending] = useState(false);
  const [charCount, setCharCount] = useState(0);

  /* ── Session state ── */
  const [sessions, setSessions]         = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  /* ── AI Chat state ── */
  const [chatInput, setChatInput]   = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [panelOpen, setPanelOpen]   = useState(true);
  const [aiContext, setAiContext]   = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const chatEndRef   = useRef<HTMLDivElement>(null);
  const bodyRef      = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  /* ── Active session messages (derived) ── */
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages: ChatMessage[] = activeSession?.messages ?? [];

  /* ── Load sessions from localStorage on mount ── */
  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setActiveSessionId(stored.sort((a, b) => b.updatedAt - a.updatedAt)[0].id);
    } else {
      const first = newSession();
      setSessions([first]);
      setActiveSessionId(first.id);
    }
    setSessionsLoaded(true);
  }, []);

  /* ── Persist sessions to localStorage whenever they change ── */
  useEffect(() => {
    if (sessionsLoaded) saveSessions(sessions);
  }, [sessions, sessionsLoaded]);

  useEffect(() => {
    document.title = "Email Hub | Naturalist Admin";
  }, []);

  useEffect(() => {
    const fetchContext = async () => {
      setContextLoading(true);
      try {
        const params = new URLSearchParams();
        if (prefillInquiry) params.set("inquiryId", prefillInquiry);
        const res = await fetch(`/api/admin/email/ai/context?${params}`);
        if (res.ok) setAiContext(await res.json());
      } catch (e) {
        console.warn("Could not load AI context:", e);
      } finally {
        setContextLoading(false);
      }
    };
    fetchContext();
  }, [prefillInquiry]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  useEffect(() => {
    setCharCount(body.length);
  }, [body]);

  /* ── Session operations ── */
  const updateSession = useCallback((id: string, patch: Partial<ChatSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s))
    );
  }, []);

  const handleNewSession = useCallback(() => {
    if (sessions.length >= MAX_SESSIONS) {
      // Remove oldest session to make room
      const sorted = [...sessions].sort((a, b) => a.updatedAt - b.updatedAt);
      setSessions((prev) => prev.filter((s) => s.id !== sorted[0].id));
    }
    const s = newSession();
    setSessions((prev) => [...prev, s]);
    setActiveSessionId(s.id);
  }, [sessions]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = newSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) {
        const sorted = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt);
        setActiveSessionId(sorted[0].id);
      }
      return remaining;
    });
  }, [activeSessionId]);

  const handleRenameSession = useCallback((id: string, name: string) => {
    updateSession(id, { name });
  }, [updateSession]);

  /* ── Inject AI draft into composer ── */
  const handleUseDraft = useCallback((draftSubject: string, draftBody: string) => {
    setSubject(draftSubject);
    setBody(draftBody);
    bodyRef.current?.focus();
    showToast("success", "Draft applied", "The AI draft has been loaded into the composer.");
  }, [showToast]);

  /* ── Apply composer actions from Gemini response ── */
  const applyComposerActions = useCallback((actions: ComposerAction) => {
    if (actions.setTo) {
      setTo(actions.setTo);
      showToast("success", "Recipient set", `To field updated to ${actions.setTo}`);
    }
    if (actions.setSubject) {
      setSubject(actions.setSubject);
    }
    if (actions.setBody) {
      setBody(actions.setBody);
    }
  }, [showToast]);

  /* ── Send email ── */
  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      showToast("error", "Missing fields", "To, subject, and body are all required.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/email/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(), subject: subject.trim(), body: body.trim(),
          ticketId: prefillTicket || undefined,
          inquiryId: prefillInquiry || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email.");
      showToast("success", "Email sent", data.message || "Email dispatched successfully.");
      if (!prefillTo) setTo("");
      setSubject("");
      setBody("");
    } catch (e: any) {
      showToast("error", "Send failed", e.message || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  /* ── Send AI message ── */
  const handleAiSend = async () => {
    const input = chatInput.trim();
    if (!input || aiLoading || !activeSessionId) return;
    if (contextLoading) {
      showToast("info", "Please wait", "Context is still loading, try again in a moment.");
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: input, id: uid() };
    const updatedMessages = [...messages, userMsg];

    // Update session with new user message (and auto-name on first message)
    const isFirstMessage = messages.length === 0;
    updateSession(activeSessionId, {
      messages: updatedMessages,
      ...(isFirstMessage ? { name: autoNameSession(updatedMessages) } : {}),
    });

    setChatInput("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/admin/email/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          context: aiContext ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed.");

      const aiMsg: ChatMessage = { role: "assistant", content: data.reply, id: uid() };
      const finalMessages = [...updatedMessages, aiMsg];
      updateSession(activeSessionId, { messages: finalMessages });

      // Apply any composer actions Gemini emitted
      const { composerActions } = parseAIReply(data.reply);
      if (Object.keys(composerActions).length > 0) {
        applyComposerActions(composerActions);
      }
    } catch (e: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `⚠️ ${e.message || "Something went wrong. Please try again."}`,
        id: uid(),
      };
      updateSession(activeSessionId, { messages: [...updatedMessages, errMsg] });
    } finally {
      setAiLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiSend();
    }
  };

  const handleClearComposer = () => {
    if (!prefillTo) setTo("");
    setSubject("");
    setBody("");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-64px)] -m-6 lg:-m-8 overflow-hidden font-sans">

      {/* ══════════════════════════════════════════════════════
          LEFT — Email Composer
          ══════════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-[#e2dacd] bg-white overflow-hidden">

        <div className="h-14 flex items-center gap-3 px-5 border-b border-[#e2dacd] flex-shrink-0 bg-[#faf8f4]">
          <span className="ms text-[#2d4c38]" style={{ fontSize: 20 }}>mail</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-sm font-extrabold text-[#141f19] leading-none">Email Composer</h2>
            {prefillTicket && (
              <p className="text-[10px] text-[#b07e3a] font-bold mt-0.5">Replying to Ticket #{prefillTicket}</p>
            )}
          </div>
          <button onClick={handleClearComposer} title="Clear composer"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#8a9e90] hover:text-[#141f19] hover:bg-[#f0ebe2] transition-all cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* To */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f0ebe2]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] w-14 flex-shrink-0">To</span>
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="flex-1 text-sm text-[#141f19] placeholder-[#c4b89a] bg-transparent outline-none" />
            {prefillTicket && to && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                Ticket reply
              </span>
            )}
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f0ebe2]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] w-14 flex-shrink-0">Subject</span>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="flex-1 text-sm text-[#141f19] placeholder-[#c4b89a] bg-transparent outline-none font-medium" />
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col min-h-0 px-5 pt-4 pb-2">
            <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your email…"
              className="flex-1 w-full min-h-[200px] resize-none text-sm text-[#141f19] placeholder-[#c4b89a] bg-transparent outline-none leading-relaxed" />
          </div>

          {/* Toolbar */}
          <div className="flex-shrink-0 border-t border-[#f0ebe2] px-5 py-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-[#8a9e90] font-medium">{charCount} chars</span>
            <div className="flex items-center gap-2">
              <button onClick={handleClearComposer}
                className="h-9 px-4 rounded-xl border border-[#e2dacd] text-[10px] font-bold uppercase tracking-wider text-[#5e6f64] hover:bg-[#f5f2ed] transition-all cursor-pointer flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
              <button onClick={handleSend} disabled={sending || !to || !subject || !body}
                className="h-9 px-5 rounded-xl bg-[#2d4c38] text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-[#3a6349] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2">
                {sending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <><Send className="h-3.5 w-3.5" /> Send Email</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT — Gemini AI Panel (sessions sidebar + chat)
          ══════════════════════════════════════════════════════ */}
      <div className={`flex flex-row bg-[#faf8f4] border-l border-[#e2dacd] transition-all duration-300 ${panelOpen ? "w-full lg:w-[480px] xl:w-[520px]" : "w-12"} flex-shrink-0 overflow-hidden`}>

        {/* Sessions sidebar — only shown when panel is open */}
        {panelOpen && sessionsLoaded && (
          <SessionSidebar
            sessions={sessions}
            activeId={activeSessionId}
            onSelect={setActiveSessionId}
            onNew={handleNewSession}
            onDelete={handleDeleteSession}
            onRename={handleRenameSession}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />
        )}

        {/* Main chat area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Panel Header */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#e2dacd] flex-shrink-0 bg-white">
            <div className="h-7 w-7 rounded-full bg-[#b07e3a]/15 border border-[#b07e3a]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#b07e3a]" />
            </div>
            {panelOpen && (
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-sm font-extrabold text-[#141f19] leading-none truncate">
                  {activeSession?.name || "Gemini AI"}
                </h2>
                <p className="text-[10px] text-[#8a9e90] mt-0.5 flex items-center gap-1">
                  {contextLoading ? (
                    <><Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading context...</>
                  ) : aiContext?.inquiry ? (
                    <><Database className="h-2.5 w-2.5 text-emerald-500" />
                      <span className="text-emerald-600 font-semibold">
                        Grounded — {aiContext.inquiry.name}, {aiContext.products?.length ?? 0} products
                        {aiContext.customer ? ", account" : ""}
                        {aiContext.customerOrders?.length ? `, ${aiContext.customerOrders.length} orders` : ""}
                      </span>
                    </>
                  ) : aiContext ? (
                    <><Database className="h-2.5 w-2.5 text-[#b07e3a]" />
                      <span className="text-[#b07e3a] font-semibold">
                        {aiContext.products?.length ?? 0} products
                        {aiContext.siteStats ? ` · ${aiContext.siteStats.activeSubscribers} subscribers · ${aiContext.siteStats.totalOrders} orders` : ""}
                      </span>
                    </>
                  ) : (
                    "Draft emails with AI assistance"
                  )}
                </p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-1">
              {panelOpen && messages.length > 0 && (
                <button
                  onClick={() => updateSession(activeSessionId, { messages: [] })}
                  title="Clear this chat"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-[#8a9e90] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setPanelOpen((p) => !p)}
                title={panelOpen ? "Collapse AI panel" : "Expand AI panel"}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-[#8a9e90] hover:text-[#141f19] hover:bg-[#f0ebe2] transition-all cursor-pointer"
              >
                <span className="ms transition-transform duration-300"
                  style={{ fontSize: 18, transform: panelOpen ? "rotate(0deg)" : "rotate(180deg)" }}>
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {!panelOpen && (
            <div className="flex flex-col items-center pt-4 gap-3">
              <button onClick={() => setPanelOpen(true)} title="Open AI panel"
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#b07e3a]/10 border border-[#b07e3a]/20 text-[#b07e3a] hover:bg-[#b07e3a]/20 transition-all cursor-pointer">
                <span className="ms" style={{ fontSize: 16 }}>chevron_left</span>
              </button>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8a9e90]"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                Gemini AI
              </span>
            </div>
          )}

          {panelOpen && (
            <>
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-12 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-[#b07e3a]/10 flex items-center justify-center border border-[#b07e3a]/15">
                      <Sparkles className="h-6 w-6 text-[#b07e3a]" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-[#141f19] text-sm">Gemini Email Assistant</p>
                      <p className="text-xs text-[#8a9e90] mt-1.5 max-w-[220px] leading-relaxed">
                        Ask me to draft an email, fill in a recipient, or query your store data.
                      </p>
                    </div>
                    <div className="w-full space-y-2 mt-2">
                      {[
                        prefillTicket
                          ? `Write a professional reply for ticket #${prefillTicket}`
                          : "Write a follow-up email for a delayed order",
                        "Send to jane@email.com and draft a restock announcement",
                        "How many newsletter subscribers do we have?",
                      ].map((prompt) => (
                        <button key={prompt}
                          onClick={() => { setChatInput(prompt); chatInputRef.current?.focus(); }}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-[#e2dacd] bg-white hover:bg-[#f5f2ed] text-xs text-[#5e6f64] hover:text-[#141f19] transition-all cursor-pointer leading-relaxed font-medium">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} onUseDraft={handleUseDraft} />
                ))}

                {aiLoading && (
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-[#b07e3a]/15 border border-[#b07e3a]/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-[#b07e3a] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-[#e2dacd] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="flex-shrink-0 border-t border-[#e2dacd] p-3 bg-white">
                <div className="flex gap-2 items-end bg-[#faf8f4] border border-[#e2dacd] rounded-2xl px-3 py-2 focus-within:border-[#b07e3a] focus-within:bg-white transition-all">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Ask Gemini to draft an email, set a recipient…"
                    rows={1}
                    className="flex-1 text-sm text-[#141f19] placeholder-[#c4b89a] bg-transparent outline-none resize-none leading-relaxed max-h-32 overflow-y-auto"
                    style={{ minHeight: "24px" }}
                  />
                  <button onClick={handleAiSend}
                    disabled={!chatInput.trim() || aiLoading || contextLoading}
                    className="h-8 w-8 rounded-xl bg-[#2d4c38] flex items-center justify-center text-white hover:bg-[#3a6349] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0">
                    {aiLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <span className="ms" style={{ fontSize: 16 }}>send</span>}
                  </button>
                </div>
                <p className="text-[9px] text-[#c4b89a] text-center mt-1.5 font-medium">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}