"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}

      {/* Global Toast Modal — centered popup */}
      {toasts.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => toasts.forEach(t => dismissToast(t.id))} />

          <div className="relative z-10 flex flex-col gap-3 w-full max-w-md mx-6">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="flex items-start gap-5 p-7 rounded-3xl bg-white dark:bg-[#1a2420] border border-border shadow-2xl animate-toast-pop"
                role="alert"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {toast.type === "success" && (
                    <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  {toast.type === "error" && (
                    <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                    </div>
                  )}
                  {toast.type === "info" && (
                    <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                      <Info className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-base font-bold text-foreground leading-tight">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
