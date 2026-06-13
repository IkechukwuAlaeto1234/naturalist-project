"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useSession } from "next-auth/react";
import { ShoppingBag, ArrowLeft, Loader2, ShieldCheck, CreditCard, Lock, Check } from "lucide-react";

const inputCls = "px-4 py-2.5 text-sm rounded-xl border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] focus:border-transparent transition-all placeholder:text-muted-foreground/40";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { cartItems, cartSubtotal, loading: cartLoading } = useCart();
  const { formatPrice, currency } = useCurrency();

  const token = searchParams.get("token");

  // Shipping & Token Validation
  const [shippingData, setShippingData] = useState<any>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // Form states
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState("");

  // Simulation state
  const [simulationPhase, setSimulationPhase] = useState<"idle" | "verifying" | "authorizing" | "capturing" | "success">("idle");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(`/checkout/payment?token=${token || ""}`)}`);
      return;
    }

    const sessionToken = sessionStorage.getItem("naturalist_checkout_token");
    if (!token || token !== sessionToken) {
      alert("Invalid checkout session. Redirecting back to shipping details.");
      router.replace("/checkout");
      setIsValidToken(false);
      return;
    }

    const cachedShipping = sessionStorage.getItem(`naturalist_shipping_${token}`);
    if (!cachedShipping) {
      alert("Missing shipping details. Redirecting back to shipping details.");
      router.replace("/checkout");
      setIsValidToken(false);
      return;
    }

    try {
      const parsed = JSON.parse(cachedShipping);
      if (!parsed.name || !parsed.email || !parsed.address || !parsed.city || !parsed.state || !parsed.zip || !parsed.phone) {
        alert("Incomplete shipping details. Redirecting back to shipping details.");
        router.replace("/checkout");
        setIsValidToken(false);
        return;
      }
      setShippingData(parsed);
      setIsValidToken(true);
    } catch (e) {
      console.error("Failed to parse cached shipping data:", e);
      alert("Error parsing checkout session. Redirecting back to shipping details.");
      router.replace("/checkout");
      setIsValidToken(false);
    }
  }, [token, status, router]);

  // Card formatting helpers
  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    raw = raw.slice(0, 16);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.substring(i, i + 4));
    }
    setCardNum(parts.join(" "));
    setError("");
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    raw = raw.slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
    setError("");
  };

  const handleCvc = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    setCardCvc(raw.slice(0, 3));
    setError("");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shippingData) return;

    // Validate sandbox input lengths
    const cardNumClean = cardNum.replace(/\s/g, "");
    if (cardNumClean.length !== 16) {
      setError("Please enter a valid 16-digit credit card number.");
      return;
    }

    const expiryParts = cardExpiry.split("/");
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setError("Expiration must be in MM/YY format.");
      return;
    }

    const month = parseInt(expiryParts[0], 10);
    const year = parseInt(expiryParts[1], 10);
    if (isNaN(month) || month < 1 || month > 12) {
      setError("Expiration month must be between 01 and 12.");
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear() % 100; // 2-digit year
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setError("This card has expired.");
      return;
    }

    if (cardCvc.length !== 3) {
      setError("CVC must be exactly 3 digits.");
      return;
    }

    // Run Bank simulation transitions
    setSimulationPhase("verifying");
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSimulationPhase("authorizing");
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSimulationPhase("capturing");
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSimulationPhase("success");
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Post order to /api/orders
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product: item.isBundle ? undefined : item.productId,
            bundle: item.isBundle ? item.productId : undefined,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          totalAmount: finalTotal,
          currency: currency || "USD",
          paymentMethod: "sandbox",
          paymentStatus: "paid",
          shippingAddress: {
            email: shippingData.email,
            name: shippingData.name,
            address: shippingData.address,
            city: shippingData.city,
            state: shippingData.state,
            zipCode: shippingData.zip,
            country: shippingData.country,
            phone: shippingData.phone,
          },
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit order.");
      }

      const data = await res.json();

      // Clear checkout sessions
      sessionStorage.removeItem("naturalist_checkout_token");
      sessionStorage.removeItem(`naturalist_shipping_${token}`);

      // Trigger brand loader cover
      window.dispatchEvent(new Event("naturalist:navigation-start"));

      const orderReference = data.orderNumber || data.orderId;
      router.push(`/order-confirmation?id=${data.orderId}&reference=${encodeURIComponent(orderReference)}&name=${encodeURIComponent(shippingData.name)}`);
    } catch (err) {
      setSimulationPhase("idle");
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(message);
    }
  };

  const shippingThreshold = shippingData?.countryCode === "US" ? 75 : 120;
  const shippingFee = cartSubtotal >= shippingThreshold ? 0 : 9;
  const finalTotal = cartSubtotal + shippingFee;

  if (cartLoading || isValidToken === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d4c38]" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
          <h2 className="font-serif text-xl font-bold">Checkout is locked</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please add products to your cart before entering checkout.
          </p>
          <Link href="/shop" className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md">
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Helper to get descriptive text for simulation phase
  const getButtonText = () => {
    switch (simulationPhase) {
      case "verifying":
        return "Verifying card details...";
      case "authorizing":
        return "Authorizing payment...";
      case "capturing":
        return "Capturing funds...";
      case "success":
        return "Success! Placing order...";
      default:
        return "Secure & Authorize Payment";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <Link href={`/checkout?token=${token || ""}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Shipping Address
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#141f19] dark:text-[#f4f6f4] tracking-tight leading-none mt-2">
            Secure Payment
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {/* PROGRESS HEADER */}
            <div className="bg-[#fcfbf7] dark:bg-[#151c18]/20 border border-[#e2dacd]/60 dark:border-white/[0.05] rounded-3xl p-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#2d4c38]/10 dark:bg-white/10 text-xs font-bold text-[#2d4c38] dark:text-white">1</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2d4c38]/75 dark:text-white/75">Shipping Address</span>
                <span className="text-xs text-muted-foreground/60">(✓ Verified)</span>
              </div>
              <div className="h-px bg-[#e2dacd]/60 dark:border-white/10 flex-1 mx-4 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#2d4c38] text-xs font-bold text-white shadow-sm animate-pulse">2</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white">Sandbox Payment</span>
              </div>
            </div>

            {/* SHIPPING PREVIEW */}
            {shippingData && (
              <div className="bg-[#fcfbf7] dark:bg-[#151c18]/20 border border-[#e2dacd]/60 dark:border-white/[0.05] rounded-3xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#e2dacd]/40 dark:border-white/[0.05]">
                  <h3 className="font-serif text-sm font-bold text-foreground">Delivery Summary</h3>
                  <Link href={`/checkout?token=${token || ""}`} className="text-[11px] font-bold text-[#b07e3a] hover:underline uppercase tracking-wider">
                    Edit Address
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground font-semibold">Recipient:</span>
                    <p className="font-bold text-foreground mt-0.5">{shippingData.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Email:</span>
                    <p className="font-bold text-foreground mt-0.5">{shippingData.email}</p>
                  </div>
                  <div className="sm:col-span-2 mt-1">
                    <span className="text-muted-foreground font-semibold">Address:</span>
                    <p className="font-bold text-foreground mt-0.5">
                      {shippingData.address}, {shippingData.city}, {shippingData.state} {shippingData.zip}, {shippingData.country}
                    </p>
                  </div>
                  <div className="mt-1">
                    <span className="text-muted-foreground font-semibold">Phone:</span>
                    <p className="font-bold text-foreground mt-0.5">{shippingData.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT DETAILS */}
            <form onSubmit={handleSubmitPayment} className="bg-white dark:bg-[#151c18]/30 rounded-3xl border border-[#e2dacd] dark:border-white/[0.08] p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2dacd]/40 dark:border-white/[0.05]">
                <h2 className="font-serif text-xl font-bold text-foreground">2. Sandbox Payment</h2>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">
                  <Lock className="h-3.5 w-3.5" /> Encrypted
                </span>
              </div>

              <div className="p-4 bg-[#f4efe6] dark:bg-[#1e2621]/30 border border-[#b07e3a]/30 rounded-2xl flex gap-3.5 items-start">
                <CreditCard className="h-5 w-5 text-[#b07e3a] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Sandbox Mode Active</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Please use sandbox credentials to complete your simulated order (e.g. Card: 4242 4242 4242 4242).
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credit Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    name="cardNum"
                    value={cardNum}
                    onChange={handleCardNumber}
                    required
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    disabled={simulationPhase !== "idle"}
                    className={`${inputCls} w-full pl-11 pr-4`}
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiration</label>
                  <input
                    type="text"
                    name="cardExpiry"
                    value={cardExpiry}
                    onChange={handleExpiry}
                    required
                    placeholder="MM / YY"
                    maxLength={5}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    disabled={simulationPhase !== "idle"}
                    className={`${inputCls} text-center tracking-widest`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CVC</label>
                  <input
                    type="text"
                    name="cardCvc"
                    value={cardCvc}
                    onChange={handleCvc}
                    required
                    placeholder="123"
                    maxLength={3}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    disabled={simulationPhase !== "idle"}
                    className={`${inputCls} text-center`}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-2 mt-4">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-[#2d4c38]" />
                  Secure checkout guaranteed by Naturalist
                </span>
                <button
                  type="submit"
                  disabled={simulationPhase !== "idle"}
                  className="w-full sm:w-auto flex h-12 min-w-[240px] items-center justify-center gap-2.5 rounded-xl bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {simulationPhase !== "idle" && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                  {getButtonText()}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT SIDEBAR: ORDER SUMMARY */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white/90 dark:bg-[#151c18]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[32px] p-6 shadow-xl flex flex-col gap-5">
              <h3 className="font-serif text-lg font-bold text-foreground">Your Selection</h3>
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative h-12 w-12 rounded-lg bg-muted border border-border/20 overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-foreground leading-normal truncate">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Qty {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#2d4c38] dark:text-[#f4f6f4] font-serif shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e2dacd]/60 dark:border-white/[0.05] pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="font-semibold text-foreground">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span><span className="font-semibold text-foreground">{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1 border-t border-[#e2dacd]/40 dark:border-white/[0.03]">
                  <span>Total</span>
                  <span className="text-base font-bold text-[#2d4c38] dark:text-white font-serif">{formatPrice(finalTotal)}</span>
                </div>
                {currency !== "USD" && (
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed pt-1">
                    * Prices shown in {currency} for reference. Payment is processed in USD.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentContentWrapper() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d4c38]" />
      </div>
    }>
      <PaymentContent />
    </React.Suspense>
  );
}
