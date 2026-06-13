"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Loader2, RefreshCw } from "lucide-react";

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [warning, setWarning] = useState<{ type: string; message: string } | null>(null);

  // 1. Listen for offline/online and monkeypatch window.fetch for timeout/error control
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!window.navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      window.location.reload();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Intercept native fetch to add timeouts and dispatch network warnings
    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
      const controller = new AbortController();
      const signal = controller.signal;

      // Merge original abort signal if specified
      let originalSignal = init?.signal;
      if (originalSignal) {
        originalSignal.addEventListener("abort", () => controller.abort());
      }

      // Check request URL details
      const urlString = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
          
      const isLocalRequest = urlString.startsWith("/") || urlString.startsWith(window.location.origin);
      const isAuthRequest = urlString.includes("/api/auth/");

      // Bypass timeout interceptor entirely for Auth.js endpoints to prevent session validation crashes
      if (isAuthRequest) {
        return originalFetch(input, init);
      }

      // Default timeout of 15 seconds for local APIs, 30 seconds for external
      const timeoutMs = isLocalRequest ? 15000 : 30000;
      
      const timeoutId = setTimeout(() => {
        try {
          controller.abort(new DOMException("The operation was aborted due to a timeout.", "AbortError"));
        } catch (e) {
          controller.abort();
        }
      }, timeoutMs);

      try {
        const response = await originalFetch(input, {
          ...init,
          signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);

        const isTimeout = err.name === "AbortError" && !originalSignal?.aborted;
        const isNetworkError =
          err.message?.includes("fetch") ||
          err.message?.includes("NetworkError") ||
          err.name === "TypeError";

        if ((isTimeout || isNetworkError) && isLocalRequest && window.navigator.onLine) {
          setWarning({
            type: isTimeout ? "timeout" : "network",
            message: isTimeout
              ? "The request is taking longer than expected. Please check your connection."
              : "We're having trouble connecting to the server. Some actions may not complete.",
          });
        }

        throw err;
      }
    };

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.fetch = originalFetch;
    };
  }, []);

  // 2. Auto-dismiss floating network warnings after 7 seconds
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => {
        setWarning(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const handleRetry = async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch("/api/health", { 
        method: "HEAD", 
        cache: "no-store",
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        setIsOffline(false);
        window.location.reload();
        return;
      }
    } catch (e) {
      // Still offline
    }
    
    setTimeout(() => {
      setChecking(false);
    }, 800);
  };

  return (
    <>
      {isOffline && (
        <div className="fixed inset-0 z-[9999] bg-[#141f19]/95 dark:bg-[#070908]/98 backdrop-blur-xl flex items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="max-w-md w-full bg-[#fdfdfb]/05 dark:bg-white/05 border border-[#eae5db]/10 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 backdrop-blur-md relative overflow-hidden">
            
            {/* Decorative Gold Radial Highlight */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#b07e3a]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#2d4c38]/20 rounded-full blur-3xl pointer-events-none" />

            {/* pulsing WifiOff icon */}
            <div className="relative mx-auto w-20 h-20 rounded-full bg-[#b07e3a]/10 dark:bg-[#b07e3a]/15 flex items-center justify-center border border-[#b07e3a]/30">
              <div className="absolute inset-0 rounded-full bg-[#b07e3a]/5 animate-ping opacity-75" />
              <WifiOff className="h-9 w-9 text-[#b07e3a]" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-[#faf9f5]">
                Connection Lost
              </h2>
              <p className="text-xs sm:text-sm text-[#eae5db]/75 dark:text-[#eae5db]/70 leading-relaxed font-sans max-w-sm mx-auto">
                It looks like your internet connection is offline. Some checkout pages or features may not load properly. We will reload the page once connection is restored.
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#b07e3a]/80 uppercase tracking-widest animate-pulse">
              {checking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Checking connection...
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] animate-ping" />
                  Waiting for network
                </>
              )}
            </div>

            <button
              onClick={handleRetry}
              disabled={checking}
              className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#b07e3a] hover:bg-[#c28e47] disabled:opacity-50 text-xs font-bold text-[#141f19] hover:text-[#141f19] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {!isOffline && warning && (
        <div className="fixed bottom-6 right-6 z-[9998] max-w-sm w-full bg-[#141f19]/95 dark:bg-[#0c100e]/98 border border-[#eae5db]/20 dark:border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-toast-pop backdrop-blur-md">
          <div className="h-8 w-8 rounded-lg bg-[#b07e3a]/10 flex items-center justify-center flex-shrink-0 border border-[#b07e3a]/20">
            <WifiOff className="h-4.5 w-4.5 text-[#b07e3a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#faf9f5]">Network Problem</p>
            <p className="text-[11px] text-[#eae5db]/80 mt-0.5 leading-normal">{warning.message}</p>
          </div>
          <button
            onClick={() => setWarning(null)}
            className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#faf9f5] cursor-pointer border-0 bg-transparent px-1 mt-0.5"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
