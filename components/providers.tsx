"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";
import { CurrencyProvider } from "../context/CurrencyContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <ToastProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ToastProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}
