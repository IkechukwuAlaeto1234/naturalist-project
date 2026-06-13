"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "primary";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "primary",
}: ConfirmModalProps) {
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

  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop overlay with blur */}
      <div
        className="fixed inset-0 bg-[#0c120e]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div
        className="relative w-full max-w-sm sm:max-w-md transform overflow-hidden rounded-[28px] sm:rounded-[32px] border border-border bg-white/95 dark:bg-[#151c18]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-300 animate-modal-slide-in flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer flex-shrink-0"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Icon Header */}
        <div className={`mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full animate-icon-pop ${
          isDanger
            ? "bg-red-500/10 text-red-500"
            : "bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400"
        }`}>
          {isDanger ? (
            <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2]" />
          ) : (
            <Info className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2]" />
          )}
        </div>

        {/* Serif Typography Headers */}
        <h3 className="font-serif text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
          {title}
        </h3>

        {/* Body Message */}
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-6 sm:mb-8">
          {message}
        </p>

        {/* Premium Action Buttons */}
        <div className="flex flex-row gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 flex h-11 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground transition-all cursor-pointer select-none"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 flex h-11 items-center justify-center rounded-full hover:scale-[1.01] active:scale-[0.99] text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer select-none ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/10"
                : "bg-[#2d4c38] hover:bg-[#3a6349] shadow-[#2d4c38]/10"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
