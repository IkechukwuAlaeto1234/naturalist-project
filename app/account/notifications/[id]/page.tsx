"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bell, ArrowLeft, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  body?: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface LegalDiffItem {
  status: "unchanged" | "added" | "deleted" | "removed" | "modified";
  heading: string;
  body?: string | string[];
  oldBody?: string | string[];
  newBody?: string | string[];
}

interface LegalDiffBody {
  type: "legal-diff";
  pageKey: string;
  label: string;
  effectiveDate: string;
  diff: LegalDiffItem[];
}

/**
 * Safely render clause body text which can be a string or array of paragraphs.
 */
function renderBodyText(bodyVal: string | string[] | undefined) {
  if (!bodyVal) return null;
  if (Array.isArray(bodyVal)) {
    return (
      <div className="space-y-2">
        {bodyVal.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground/90">{p}</p>
        ))}
      </div>
    );
  }
  return <p className="text-sm leading-relaxed text-foreground/90">{bodyVal}</p>;
}

function LegalDiffViewer({ data }: { data: LegalDiffBody }) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleExpand = (idx: number) => {
    setExpandedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const addedCount = data.diff.filter((x) => x.status === "added").length;
  const deletedCount = data.diff.filter((x) => x.status === "deleted" || x.status === "removed").length;
  const modifiedCount = data.diff.filter((x) => x.status === "modified").length;

  return (
    <div className="space-y-6">
      {/* Diff Summary Card */}
      <div className="bg-[#faf8f4] border border-[#e2dacd] rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#b07e3a]">Document Update</span>
            <h2 className="font-serif text-lg font-bold text-foreground mt-0.5">{data.label} Changes</h2>
          </div>
          <div className="text-left md:text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Effective Date</span>
            <p className="text-xs font-bold text-foreground mt-0.5">{data.effectiveDate}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#e2dacd]/60">
          {addedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {addedCount} Clause{addedCount > 1 ? "s" : ""} Added
            </span>
          )}
          {modifiedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {modifiedCount} Clause{modifiedCount > 1 ? "s" : ""} Modified
            </span>
          )}
          {deletedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {deletedCount} Clause{deletedCount > 1 ? "s" : ""} Deleted
            </span>
          )}
        </div>
      </div>

      {/* Clause List */}
      <div className="space-y-4">
        {data.diff.map((item, idx) => {
          const isExpanded = expandedItems[idx] ?? false;

          if (item.status === "added") {
            return (
              <div
                key={idx}
                className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-sm font-bold text-foreground">{item.heading}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    Added
                  </span>
                </div>
                <div className="pl-1">
                  {renderBodyText(item.newBody || item.body)}
                </div>
              </div>
            );
          }

          if (item.status === "deleted" || item.status === "removed") {
            return (
              <div
                key={idx}
                className="bg-rose-50/15 border border-rose-100/60 rounded-2xl p-5 space-y-2 opacity-80"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-sm font-bold text-muted-foreground line-through">{item.heading}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                    Deleted
                  </span>
                </div>
                <div className="pl-1 opacity-75 line-through">
                  {renderBodyText(item.oldBody || item.body)}
                </div>
              </div>
            );
          }

          if (item.status === "modified") {
            return (
              <div
                key={idx}
                className="bg-amber-50/15 border border-amber-100/70 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif text-sm font-bold text-foreground">{item.heading}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                    Modified
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-rose-50/10 border border-rose-100/40 rounded-xl p-3.5 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-700">Previous Version</span>
                    {renderBodyText(item.oldBody || item.body)}
                  </div>
                  <div className="bg-emerald-50/10 border border-emerald-100/40 rounded-xl p-3.5 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Updated Version</span>
                    {renderBodyText(item.newBody)}
                  </div>
                </div>
              </div>
            );
          }

          // Unchanged section (collapsible)
          return (
            <div
              key={idx}
              className="bg-card border border-border/30 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleExpand(idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#faf8f4]/40 transition-colors cursor-pointer"
              >
                <span className="font-serif text-xs font-bold text-muted-foreground">{item.heading}</span>
                <span className="text-[10px] font-bold text-[#b07e3a] uppercase tracking-wider flex items-center gap-1">
                  {isExpanded ? "Collapse" : "View Details"}
                  <span className="ms" style={{ fontSize: 12 }}>
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                </span>
              </button>
              {isExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-border/10">
                  {renderBodyText(item.body || item.newBody || item.oldBody)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NotificationDetailPage() {
  const params   = useParams();
  const id       = params.id as string;
  const [notif, setNotif]     = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch("/api/user/notifications", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const all: Notification[] = await res.json();
        const found = all.find(n => n._id === id);
        if (!found) throw new Error("Notification not found");
        setNotif(found);
        setTimeout(() => {
          document.title = `${found.title} | Naturalist`;
        }, 150);
        // Mark as read
        if (!found.read) {
          await fetch("/api/user/notifications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#b07e3a]" />
      </div>
    );
  }

  if (error || !notif) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <p className="font-semibold text-foreground mb-1">Notification not found</p>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Link href="/account/notifications" className="text-sm font-bold text-[#b07e3a] hover:underline">
          ← Back to notifications
        </Link>
      </div>
    );
  }

  // Check if body is stringified JSON containing legal-diff
  let isJsonBody = false;
  let parsedJsonBody: any = null;
  if (notif.body) {
    try {
      const trimmed = notif.body.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        parsedJsonBody = JSON.parse(trimmed);
        if (parsedJsonBody && parsedJsonBody.type === "legal-diff") {
          isJsonBody = true;
        }
      }
    } catch (e) {
      // Treat as normal HTML body
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Back */}
      <Link
        href="/account/notifications"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Notifications
      </Link>

      {/* Card */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8 space-y-5">
          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#b07e3a]/10 border border-[#b07e3a]/20 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-[#b07e3a]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground leading-snug">{notif.title}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(notif.createdAt).toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Body — rich parsed component if legal diff, rich HTML if present, else plain message */}
          {isJsonBody ? (
            <LegalDiffViewer data={parsedJsonBody} />
          ) : notif.body ? (
            <div
              className="text-sm text-foreground leading-relaxed [&_p]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:rounded-xl [&_table]:overflow-hidden [&_th]:text-left [&_th]:text-[10px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:py-2 [&_th]:px-3 [&_td]:py-2.5 [&_td]:px-3 [&_td]:text-sm [&_strong]:font-bold [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: notif.body }}
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{notif.message}</p>
          )}

          {/* CTA link if present */}
          {notif.link && (
            <a
              href={notif.link}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#2d4c38] text-xs font-bold text-white uppercase tracking-wider hover:bg-[#b07e3a] transition-all"
            >
              {notif.type === "order" ? "Track My Order" : "Go there"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
