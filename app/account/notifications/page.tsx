"use client";

import React, { useEffect, useState } from "react";
import { Bell, Loader2, AlertCircle, CheckCheck } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");

  useEffect(() => {
    document.title = "Notifications | Naturalist";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await fetch("/api/user/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      setNotifications(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/user/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider cursor-pointer"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#b07e3a]" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto" />
          <p className="font-semibold text-muted-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground/60">We&apos;ll let you know when something arrives.</p>
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm divide-y divide-border/30">
          {notifications.map((notif) => (
            <a
              key={notif._id}
              href={`/account/notifications/${notif._id}`}
              className={`flex gap-4 items-start px-5 py-4 hover:bg-muted/40 transition-colors ${
                !notif.read ? "bg-[#b07e3a]/5" : ""
              }`}
            >
              <span className={`mt-2 h-2 w-2 rounded-full flex-shrink-0 ${
                !notif.read ? "bg-[#b07e3a]" : "bg-transparent"
              }`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-snug ${!notif.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {new Date(notif.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
