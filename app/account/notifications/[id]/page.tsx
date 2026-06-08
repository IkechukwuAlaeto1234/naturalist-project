"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function NotificationDetailPage() {
  const params   = useParams();
  const router   = useRouter();
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
        document.title = `${found.title} | Naturalist`;
        // Mark as read
        if (!found.read) {
          await fetch("/api/user/notifications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        }
      } catch (e: any) {
        setError(e.message);
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
        <a href="/account/notifications" className="text-sm font-bold text-[#b07e3a] hover:underline">
          ← Back to notifications
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Back */}
      <a
        href="/account/notifications"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Notifications
      </a>

      {/* Card */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-[#2d4c38] via-[#b07e3a] to-[#2d4c38]" />

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

          {/* Body — rich HTML if present, else plain message */}
          {notif.body ? (
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
