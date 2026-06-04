"use client";

import React, { useEffect } from "react";
import { CheckCircle2, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  cancelText?: string;
  showCancel?: boolean;
  showClose?: boolean;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title = "Added to Skincare Ritual",
  message,
  actionText,
  onAction,
  actionIcon,
  cancelText = "Continue Browsing",
  showCancel = true,
  showClose = true,
}: SuccessModalProps) {
  const router = useRouter();

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

  const handleGoToCart = () => {
    onClose();
    router.push("/cart");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop overlay with blur */}
      <div
        className="fixed inset-0 bg-[#0c120e]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div
        className="relative w-full max-w-md transform overflow-hidden rounded-[32px] border border-[#b07e3a]/10 dark:border-white/10 bg-white/95 dark:bg-[#151c18]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 animate-modal-slide-in flex flex-col items-center text-center"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        {showClose && (
          <button
            onClick={onClose}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Brand Icon Header */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-icon-pop">
          <CheckCircle2 className="h-9 w-9 stroke-[2]" />
        </div>

        {/* Serif Typography Headers */}
        <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
          {title}
        </h3>

        {/* Body Message */}
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
          {message}
        </p>

        {/* Premium Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {showCancel && (
            <button
              onClick={onClose}
              className="flex-1 flex h-12 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-xs font-bold uppercase tracking-widest text-foreground transition-all cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onAction || handleGoToCart}
            className={`flex-grow-[1.3] flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] hover:scale-[1.01] active:scale-[0.99] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-[#2d4c38]/10 cursor-pointer ${
              !showCancel ? "w-full" : ""
            }`}
          >
            {actionText || "View Shopping Bag"}{" "}
            {actionIcon === undefined ? <ShoppingBag className="h-3.5 w-3.5" /> : actionIcon}
          </button>
        </div>
      </div>
    </div>
  );
}
