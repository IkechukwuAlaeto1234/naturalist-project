"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
