"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "./ToastContext";

export interface CartItem {
  id: string; // Dynamic identifier (Mongoose ID if sync'd, or productSlug)
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  isBundle: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "quantity" | "id">, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartSubtotal: number;
  cartCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Minimum delay (ms) before the success/error modal fires, giving the
// spinner in ProductCard time to be visible before the overlay appears.
const TOAST_DELAY_MS = 750;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const { showToast } = useToast();

  const isServer = typeof window === "undefined";

  // Deferred toast so modals don't fire before the spinner has been visible
  const delayedToast = useCallback(
    (
      type: Parameters<typeof showToast>[0],
      title: string,
      message?: string,
      delay = TOAST_DELAY_MS
    ) => {
      setTimeout(() => showToast(type, title, message), delay);
    },
    [showToast]
  );

  // 1. Load initial cart from LocalStorage for guest users
  useEffect(() => {
    if (!isServer && status !== "authenticated") {
      try {
        const storedCart = localStorage.getItem("naturalist_cart");
        if (storedCart) {
          setCartItems(JSON.parse(storedCart));
        }
      } catch (err) {
        console.error("Failed to load local cart:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [status, isServer]);

  // 2. Fetch remote cart from MongoDB once authenticated
  const fetchRemoteCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        // Map backend schema cart items to frontend type
        const mappedItems: CartItem[] = data.items.map((item: any) => {
          const product = item.product || item.bundle;
          const isBundle = !!item.bundle;
          return {
            id: item._id, // backend Mongoose cart item ID
            productId: product._id,
            name: product.name,
            slug: product.slug,
            price: item.price,
            image: product.images?.[0] || "/placeholder.jpg",
            quantity: item.quantity,
            stock: product.stock !== undefined ? product.stock : 99,
            isBundle,
          };
        });
        setCartItems(mappedItems);
      }
    } catch (err) {
      console.error("Failed to fetch remote cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRemoteCart();
    }
  }, [status, fetchRemoteCart]);

  // 3. Save to localStorage for guests
  const saveLocalCart = (items: CartItem[]) => {
    if (!isServer && status !== "authenticated") {
      localStorage.setItem("naturalist_cart", JSON.stringify(items));
    }
  };

  // 4. Cart Mutations
  const addToCart = async (newItem: Omit<CartItem, "quantity" | "id">, quantity = 1) => {
    try {
      if (status === "authenticated") {
        // Sync with Backend
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: newItem.isBundle ? undefined : newItem.productId,
            bundleId: newItem.isBundle ? newItem.productId : undefined,
            quantity,
            price: newItem.price,
          }),
        });

        if (res.ok) {
          await fetchRemoteCart();
          delayedToast("success", "Added to ritual", `${newItem.name} has been added.`);
        } else {
          const errData = await res.json();
          delayedToast("error", "Failed to add", errData.error || "Please try again.");
        }
      } else {
        // Guest user local updates
        const existingItemIndex = cartItems.findIndex(
          (item) => item.productId === newItem.productId && item.isBundle === newItem.isBundle
        );

        let updatedCart = [...cartItems];
        if (existingItemIndex > -1) {
          const nextQuantity = updatedCart[existingItemIndex].quantity + quantity;
          if (nextQuantity > newItem.stock) {
            delayedToast("error", "Out of stock", `Only ${newItem.stock} units available.`);
            return;
          }
          updatedCart[existingItemIndex].quantity = nextQuantity;
        } else {
          updatedCart.push({
            ...newItem,
            id: newItem.slug, // Fallback temporary ID
            quantity,
          });
        }

        setCartItems(updatedCart);
        saveLocalCart(updatedCart);
        delayedToast("success", "Added to ritual", `${newItem.name} has been added.`);
      }
    } catch (err) {
      delayedToast("error", "Error", "Could not modify cart. Please try again.");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const itemToRemove = cartItems.find((i) => i.id === itemId);
      if (!itemToRemove) return;

      if (status === "authenticated") {
        const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
        if (res.ok) {
          await fetchRemoteCart();
          showToast("info", "Removed", `${itemToRemove.name} has been removed.`);
        } else {
          showToast("error", "Failed to remove", "Please try again.");
        }
      } else {
        const updatedCart = cartItems.filter((item) => item.id !== itemId);
        setCartItems(updatedCart);
        saveLocalCart(updatedCart);
        showToast("info", "Removed", `${itemToRemove.name} has been removed.`);
      }
    } catch (err) {
      showToast("error", "Error", "Failed to remove item.");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const item = cartItems.find((i) => i.id === itemId);
      if (!item) return;

      if (quantity > item.stock) {
        showToast("error", "Insufficient stock", `Only ${item.stock} items remaining.`);
        return;
      }

      if (status === "authenticated") {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.isBundle ? undefined : item.productId,
            bundleId: item.isBundle ? item.productId : undefined,
            quantity,
            price: item.price,
            isSet: true, // Signal to replace quantity rather than incrementing
          }),
        });

        if (res.ok) {
          await fetchRemoteCart();
        } else {
          showToast("error", "Update failed", "Please try again.");
        }
      } else {
        const updatedCart = cartItems.map((i) => (i.id === itemId ? { ...i, quantity } : i));
        setCartItems(updatedCart);
        saveLocalCart(updatedCart);
      }
    } catch (err) {
      showToast("error", "Error", "Failed to update item quantity.");
    }
  };

  const clearCart = async () => {
    try {
      if (status === "authenticated") {
        // Mapped delete calls or single endpoint - since we want to clear we can delete them
        for (const item of cartItems) {
          await fetch(`/api/cart/${item.id}`, { method: "DELETE" });
        }
        await fetchRemoteCart();
      } else {
        setCartItems([]);
        if (!isServer) localStorage.removeItem("naturalist_cart");
      }
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotal,
        cartCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
