"use client";

import React, { useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  title = "Authentication Error",
  message,
}: ErrorModalProps) {
  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay with blur */}
      <div
        className="fixed inset-0 bg-[#0c120e]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div
        className="relative w-full max-w-md transform overflow-hidden rounded-[32px] border border-red-500/10 dark:border-white/10 bg-white/95 dark:bg-[#151c18]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 animate-scale-up flex flex-col items-center text-center"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Icon Header */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-500/10 text-destructive dark:text-red-400">
          <AlertCircle className="h-9 w-9 stroke-[2]" />
        </div>

        {/* Serif Typography Headers */}
        <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
          {title}
        </h3>

        {/* Body Message */}
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
          {message}
        </p>

        {/* Premium Action Button */}
        <button
          onClick={onClose}
          className="w-full flex h-12 items-center justify-center rounded-full bg-destructive hover:bg-destructive/90 hover:scale-[1.01] active:scale-[0.99] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-destructive/10 cursor-pointer"
        >
          Acknowledge & Try Again
        </button>
      </div>
    </div>
  );
}
