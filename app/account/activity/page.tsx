"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Activity,
  X,
} from "lucide-react";

export default function ActivityLedgerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "Security Ledger Audit | Naturalist";
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        fetchLogs();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Querying ledger logs...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="w-full min-h-[85vh] bg-[#fdfdfb] dark:bg-[#070908] py-10 px-4 sm:px-6 lg:px-8 pb-32 transition-colors duration-300">
      <div className="mx-auto max-w-xl space-y-6 animate-fade-in-up">
        
        {/* Back Link */}
        <div className="flex items-center justify-start">
          <a
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#c89348] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
          </a>
        </div>

        {/* Ledger Container */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Security Activity Ledger</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Chronological System Tracking</p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Review every administrative and authentication mutation recorded on this profile. Renders real-time security events mapped directly from MongoDB.
          </p>

          <div className="space-y-3 pt-2">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No historical actions logged in database.</p>
            ) : (
              logs.map((log) => {
                let actionBadge = "bg-white/[0.04] text-muted-foreground";
                if (log.action === "signup" || log.action === "verify_secondary_email") actionBadge = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                if (log.action === "login") actionBadge = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                if (log.action === "password_change" || log.action === "revoke_session") actionBadge = "bg-red-500/10 text-red-500";
                if (log.action === "cookie_preferences_update") actionBadge = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
                if (log.action === "cancel_order") actionBadge = "bg-[#b07e3a]/10 text-[#b07e3a]";

                return (
                  <div
                    key={log._id}
                    className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex items-center justify-between gap-4 hover:border-[#2d4c38]/30 transition-all text-xs"
                  >
                    <div className="min-w-0 space-y-1 text-left">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full ${actionBadge}`}>
                          {log.action}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground truncate max-w-sm leading-relaxed mt-0.5">{log.details}</p>
                    </div>

                    <button
                      onClick={() => setSelectedLog(log)}
                      className="h-8 px-4 rounded-xl border border-border/50 text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted bg-transparent cursor-pointer flex-shrink-0"
                    >
                      Audit
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* ── Log Audit Details View Modal ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070908]/75 backdrop-blur-md">
          <div className="bg-[#fdfdfb] dark:bg-[#0c100e] border border-border/60 dark:border-[#1a241e]/70 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-modal-slide-in">
            
            <div className="p-6 border-b border-border/30 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold flex items-center gap-2 text-foreground">
                <Activity className="h-4.5 w-4.5 text-[#b07e3a]" /> Deep Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted bg-transparent border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Log Record ID</p>
                <p className="font-mono text-foreground font-bold">{selectedLog._id}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Action Trigger Type</p>
                <p className="font-bold text-[#b07e3a] uppercase tracking-wider">{selectedLog.action}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Audit Details Description</p>
                <p className="text-foreground leading-relaxed p-3 bg-muted/10 border border-border/30 rounded-xl font-normal">
                  {selectedLog.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Client IP</p>
                  <p className="font-mono font-bold text-foreground">{selectedLog.ipAddress || "127.0.0.1"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OS Context</p>
                  <p className="font-bold text-foreground">{selectedLog.os || "Other"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Browser</p>
                  <p className="font-bold text-foreground">{selectedLog.browser || "Other"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Device signature</p>
                  <p className="font-bold text-foreground">{selectedLog.deviceType || "Desktop"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User-Agent Header</p>
                <p className="text-[10px] font-mono text-muted-foreground p-3 bg-muted/10 border border-border/30 rounded-xl leading-relaxed select-all">
                  {selectedLog.userAgent || "Unknown UA Header String"}
                </p>
              </div>

              <div className="pt-4 border-t border-border/30 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="h-10 px-6 rounded-full bg-[#2d4c38] text-white hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] border-0 cursor-pointer"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
