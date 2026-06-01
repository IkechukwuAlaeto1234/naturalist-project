"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { ShoppingBag, ArrowLeft, Loader2, ShieldCheck, CreditCard, Lock, ChevronDown, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { getAllCountries, getStatesOfCountry } from "@/lib/geo";

/* ─── Phone Country Data ─── */
const PHONE_COUNTRIES = [
  { name: "United States",  code: "US",  dial: "+1",   format: "(XXX) XXX-XXXX", max: 10 },
  { name: "Canada",         code: "CA",  dial: "+1",   format: "(XXX) XXX-XXXX", max: 10 },
  { name: "United Kingdom", code: "GB",  dial: "+44",  format: "XXXX XXX XXXX",  max: 11 },
  { name: "Nigeria",        code: "NG",  dial: "+234", format: "XXX XXX XXXX",   max: 10 },
  { name: "Germany",        code: "DE",  dial: "+49",  format: "XXX XXXXXXXX",   max: 11 },
  { name: "France",         code: "FR",  dial: "+33",  format: "X XX XX XX XX",  max: 9  },
  { name: "Australia",      code: "AU",  dial: "+61",  format: "XXX XXX XXX",    max: 9  },
  { name: "India",          code: "IN",  dial: "+91",  format: "XXXXX XXXXX",    max: 10 },
  { name: "South Africa",   code: "ZA",  dial: "+27",  format: "XX XXX XXXX",    max: 9  },
  { name: "Kenya",          code: "KE",  dial: "+254", format: "XXX XXX XXX",    max: 9  },
  { name: "Ghana",          code: "GH",  dial: "+233", format: "XX XXX XXXX",    max: 9  },
  { name: "Brazil",         code: "BR",  dial: "+55",  format: "XX XXXXX XXXX",  max: 11 },
  { name: "China",          code: "CN",  dial: "+86",  format: "XXX XXXX XXXX",  max: 11 },
  { name: "Japan",          code: "JP",  dial: "+81",  format: "XX XXXX XXXX",   max: 10 },
  { name: "UAE",            code: "AE",  dial: "+971", format: "XX XXX XXXX",    max: 9  },
  { name: "Saudi Arabia",   code: "SA",  dial: "+966", format: "XX XXX XXXX",    max: 9  },
  { name: "Pakistan",       code: "PK",  dial: "+92",  format: "XXX XXX XXXX",   max: 10 },
  { name: "Indonesia",      code: "ID",  dial: "+62",  format: "XXX XXXX XXXX",  max: 11 },
  { name: "Netherlands",    code: "NL",  dial: "+31",  format: "X XXXX XXXX",    max: 9  },
  { name: "Sweden",         code: "SE",  dial: "+46",  format: "XX XXX XX XX",   max: 9  },
  { name: "Spain",          code: "ES",  dial: "+34",  format: "XXX XXX XXX",    max: 9  },
  { name: "Italy",          code: "IT",  dial: "+39",  format: "XXX XXX XXXX",   max: 10 },
  { name: "Portugal",       code: "PT",  dial: "+351", format: "XXX XXX XXX",    max: 9  },
  { name: "Mexico",         code: "MX",  dial: "+52",  format: "XX XXXX XXXX",   max: 10 },
  { name: "Argentina",      code: "AR",  dial: "+54",  format: "XXX XXX XXXX",   max: 10 },
];
type PhoneCountry = (typeof PHONE_COUNTRIES)[number];

const inputCls = "px-4 py-2.5 text-sm rounded-full border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] focus:border-transparent transition-all placeholder:text-muted-foreground/40";
const dropdownTriggerCls = "flex items-center justify-between px-4 py-2.5 text-sm rounded-full border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] transition-all w-full text-left cursor-pointer";
const dropdownPanelCls = "absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden animate-toast-pop";
const searchInputCls = "w-full px-3 py-1.5 text-xs rounded-full border border-[#e2dacd] dark:border-white/10 bg-muted/20 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-[#b07e3a] placeholder:text-muted-foreground/50";
const optionCls = (active: boolean) => `w-full px-4 py-2 text-left text-xs font-semibold hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] transition-colors cursor-pointer ${active ? "text-[#b07e3a] bg-[#f4efe6]/40 dark:bg-[#1e2621]/40" : "text-foreground"}`;

function applyPhoneFormat(digits: string, format: string): string {
  let result = "";
  let di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    result += format[i] === "X" ? digits[di++] : format[i];
  }
  return result;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { cartItems, cartSubtotal, loading: cartLoading } = useCart();

  const [processing, setProcessing]       = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery]   = useState("");
  const [isStateOpen, setIsStateOpen]     = useState(false);
  const [stateQuery, setStateQuery]       = useState("");
  const [phoneCountry, setPhoneCountry]   = useState<PhoneCountry>(PHONE_COUNTRIES[3]); // Nigeria default
  const [localPhone, setLocalPhone]       = useState("");
  const [isPhoneOpen, setIsPhoneOpen]     = useState(false);
  const [phoneQuery, setPhoneQuery]       = useState("");

  const phoneRef   = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const stateRef   = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "", email: "", address: "", city: "",
    state: "", zip: "", country: "Nigeria", countryCode: "NG",
    phone: "", cardNum: "", cardExpiry: "", cardCvc: "",
  });

  const allCountries     = useMemo(() => getAllCountries(), []);
  const statesForCountry = useMemo(() => getStatesOfCountry(formData.countryCode), [formData.countryCode]);

  const filteredCountries = useMemo(() =>
    allCountries.filter(c => c.name.toLowerCase().includes(countryQuery.toLowerCase())),
    [allCountries, countryQuery]
  );
  const filteredStates = useMemo(() =>
    statesForCountry.filter(s => s.name.toLowerCase().includes(stateQuery.toLowerCase())),
    [statesForCountry, stateQuery]
  );
  const filteredPhones = useMemo(() =>
    PHONE_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(phoneQuery.toLowerCase()) || c.dial.includes(phoneQuery)
    ),
    [phoneQuery]
  );

  useEffect(() => {
    const t = setTimeout(() => { document.title = "Checkout | Naturalist"; }, 120);
    const sessionTimer = session?.user
      ? setTimeout(() => {
          setFormData(prev => ({ ...prev, name: session.user?.name || "", email: session.user?.email || "" }));
        }, 0)
      : undefined;
    return () => {
      clearTimeout(t);
      if (sessionTimer) clearTimeout(sessionTimer);
    };
  }, [session]);

  useEffect(() => {
    const countryTimer = setTimeout(() => {
      const match = PHONE_COUNTRIES.find(c => c.name === formData.country);
      if (match) { setPhoneCountry(match); setLocalPhone(""); setFormData(prev => ({ ...prev, phone: "" })); }
    }, 0);
    return () => clearTimeout(countryTimer);
  }, [formData.country]);

  // Click-outside handlers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!phoneRef.current?.contains(e.target as Node))   setIsPhoneOpen(false);
      if (!countryRef.current?.contains(e.target as Node)) setIsCountryOpen(false);
      if (!stateRef.current?.contains(e.target as Node))   setIsStateOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── ALL HOOKS ABOVE ──
  if (cartLoading) {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    setFormData(prev => ({ ...prev, cardNum: raw.match(/.{1,4}/g)?.join(" ") ?? raw }));
  };

  const handleExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    const fmt = raw.length >= 3 ? raw.slice(0, 2) + "/" + raw.slice(2)
              : raw.length === 2 && !e.target.value.endsWith("/") ? raw + "/" : raw;
    setFormData(prev => ({ ...prev, cardExpiry: fmt }));
  };

  const handleLocalPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, phoneCountry.max);
    const fmt = applyPhoneFormat(raw, phoneCountry.format);
    setLocalPhone(fmt);
    setFormData(prev => ({ ...prev, phone: `${phoneCountry.dial} ${fmt}` }));
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.state || !formData.zip || !formData.phone) {
      alert("Please fill in all shipping details."); return;
    }
    if (!formData.cardNum || !formData.cardExpiry || !formData.cardCvc) {
      alert("Please enter card credentials."); return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product: item.isBundle ? undefined : item.productId,
            bundle:  item.isBundle ? item.productId : undefined,
            name: item.name, price: item.price, quantity: item.quantity, image: item.image,
          })),
          totalAmount: finalTotal,
          shippingAddress: {
            email: formData.email, name: formData.name, address: formData.address,
            city: formData.city, state: formData.state, zipCode: formData.zip,
            country: formData.country, phone: formData.phone,
          },
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to submit order."); }
      const data = await res.json();
      setProcessing(false);
      router.push(`/order-confirmation?id=${data.orderId}&name=${encodeURIComponent(formData.name)}`);
      const orderReference = data.orderNumber || data.orderId;
      router.push(`/order-confirmation?id=${data.orderId}&reference=${encodeURIComponent(orderReference)}&name=${encodeURIComponent(formData.name)}`);
    } catch (err) {
      setProcessing(false);
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      alert(message);
    }
  };

  const finalTotal = cartSubtotal + (cartSubtotal >= 75 ? 0 : 9);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Cart
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#141f19] dark:text-[#f4f6f4] tracking-tight leading-none mt-2">
            Secure Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <form onSubmit={handleCompleteOrder} className="lg:col-span-8 space-y-6">

            {/* ── STEP 1: Delivery Address ── */}
            <div className="bg-white dark:bg-[#151c18]/30 rounded-3xl border border-[#e2dacd] dark:border-white/[0.08] p-6 sm:p-8 flex flex-col gap-5">
              <h2 className="font-serif text-xl font-bold text-foreground pb-3 border-b border-[#e2dacd]/40 dark:border-white/[0.05]">
                1. Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Jane Doe" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="jane@example.com" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="123 Botanical Street" className={inputCls} />
              </div>

              {/* Country dropdown */}
              <div className="flex flex-col gap-1.5 relative" ref={countryRef}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country</label>
                <button type="button" onClick={() => { setIsCountryOpen(v => !v); setCountryQuery(""); }} className={dropdownTriggerCls}>
                  <span>{formData.country}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isCountryOpen ? "rotate-180" : ""}`} />
                </button>
                {isCountryOpen && (
                  <div className={dropdownPanelCls}>
                    <div className="p-2.5 border-b border-[#e2dacd]/60 dark:border-white/[0.06] flex items-center gap-2 px-3">
                      <Search className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                      <input type="text" value={countryQuery} onChange={e => setCountryQuery(e.target.value)} placeholder="Search country…" autoFocus className={searchInputCls} />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredCountries.length === 0
                        ? <p className="px-4 py-4 text-xs text-muted-foreground text-center">No results</p>
                        : filteredCountries.map(c => (
                          <button key={c.isoCode} type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, country: c.name, countryCode: c.isoCode, state: "" })); setIsCountryOpen(false); setCountryQuery(""); }}
                            className={optionCls(formData.countryCode === c.isoCode)}>
                            {c.name}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required placeholder="Lagos" className={inputCls} />
                </div>

                {/* State — searchable dropdown if states exist, else free text */}
                <div className="flex flex-col gap-1.5 relative" ref={stateRef}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">State / Province</label>
                  {statesForCountry.length > 0 ? (
                    <>
                      <button type="button" onClick={() => { setIsStateOpen(v => !v); setStateQuery(""); }} className={dropdownTriggerCls}>
                        <span className={formData.state ? "text-foreground" : "text-muted-foreground/50"}>
                          {formData.state || "Select…"}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isStateOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isStateOpen && (
                        <div className={dropdownPanelCls}>
                          <div className="p-2.5 border-b border-[#e2dacd]/60 dark:border-white/[0.06] flex items-center gap-2 px-3">
                            <Search className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                            <input type="text" value={stateQuery} onChange={e => setStateQuery(e.target.value)} placeholder="Search state…" autoFocus className={searchInputCls} />
                          </div>
                          <div className="max-h-52 overflow-y-auto">
                            {filteredStates.length === 0
                              ? <p className="px-4 py-4 text-xs text-muted-foreground text-center">No results</p>
                              : filteredStates.map(s => (
                                <button key={s.isoCode} type="button"
                                  onClick={() => { setFormData(prev => ({ ...prev, state: s.name })); setIsStateOpen(false); setStateQuery(""); }}
                                  className={optionCls(formData.state === s.name)}>
                                  {s.name}
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} required placeholder="State / Province" className={inputCls} />
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ZIP / Postal Code</label>
                  <input type="text" name="zip" value={formData.zip} onChange={handleInputChange} required placeholder="100001" className={inputCls} />
                </div>
              </div>

              {/* Phone — dial code picker + number input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                <div className="relative" ref={phoneRef}>
                  <div className="flex items-center rounded-full border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] focus-within:ring-2 focus-within:ring-[#b07e3a] transition-all overflow-hidden">
                    <button type="button" onClick={() => { setIsPhoneOpen(v => !v); setPhoneQuery(""); }}
                      className="flex items-center gap-1.5 pl-4 pr-3 py-2.5 border-r border-[#e2dacd] dark:border-white/10 hover:bg-muted/30 transition-colors flex-shrink-0 select-none text-sm font-semibold text-foreground">
                      <span>{phoneCountry.code}</span>
                      <span className="text-muted-foreground tabular-nums">{phoneCountry.dial}</span>
                      <ChevronDown className={`h-3 w-3 text-muted-foreground/60 transition-transform duration-150 ${isPhoneOpen ? "rotate-180" : ""}`} />
                    </button>
                    <input type="tel" value={localPhone} onChange={handleLocalPhone} required inputMode="tel" autoComplete="tel-national"
                      placeholder={phoneCountry.format.replace(/X/g, "0")}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/40" />
                  </div>

                  {isPhoneOpen && (
                    <div className={dropdownPanelCls}>
                      <div className="p-2.5 border-b border-[#e2dacd]/60 dark:border-white/[0.06] flex items-center gap-2 px-3">
                        <Search className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                        <input type="text" value={phoneQuery} onChange={e => setPhoneQuery(e.target.value)} placeholder="Search country or code…" autoFocus className={searchInputCls} />
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredPhones.length === 0
                          ? <p className="px-4 py-4 text-xs text-muted-foreground text-center">No results</p>
                          : filteredPhones.map(c => (
                            <button key={c.code} type="button"
                              onClick={() => { setPhoneCountry(c); setLocalPhone(""); setFormData(prev => ({ ...prev, phone: "" })); setIsPhoneOpen(false); setPhoneQuery(""); }}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] transition-colors ${phoneCountry.code === c.code ? "text-[#b07e3a] bg-[#f4efe6]/50" : "text-foreground"}`}>
                              <span className="flex-1 text-left">{c.name}</span>
                              <span className="tabular-nums text-muted-foreground text-[11px]">{c.dial}</span>
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── STEP 2: Payment ── */}
            <div className="bg-white dark:bg-[#151c18]/30 rounded-3xl border border-[#e2dacd] dark:border-white/[0.08] p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2dacd]/40 dark:border-white/[0.05]">
                <h2 className="font-serif text-xl font-bold text-foreground">2. Sandbox Payment</h2>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">
                  <Lock className="h-3.5 w-3.5" />Encrypted
                </span>
              </div>

              <div className="p-4 bg-[#f4efe6] dark:bg-[#1e2621]/30 border border-[#b07e3a]/30 rounded-2xl flex gap-3.5 items-start">
                <CreditCard className="h-5 w-5 text-[#b07e3a] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-foreground">Sandbox Mode Active</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Enter any fake card credentials to trigger the checkout flow.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credit Card Number</label>
                <div className="relative">
                  <input type="text" name="cardNum" value={formData.cardNum} onChange={handleCardNumber} required
                    placeholder="4242 4242 4242 4242" maxLength={19} inputMode="numeric" autoComplete="cc-number"
                    className={`w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] focus:border-transparent transition-all placeholder:text-muted-foreground/40`} />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiration</label>
                  <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleExpiry} required
                    placeholder="MM / YY" maxLength={5} inputMode="numeric" autoComplete="cc-exp"
                    className={`${inputCls} text-center tracking-widest`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CVC</label>
                  <input type="text" name="cardCvc" value={formData.cardCvc} onChange={handleInputChange} required
                    placeholder="123" maxLength={3} inputMode="numeric" autoComplete="cc-csc"
                    className={`${inputCls} text-center`} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[#2d4c38]" />
                Secure checkout guaranteed by Naturalist
              </span>
              <button type="submit" disabled={processing}
                className="w-full sm:w-auto flex h-12 min-w-[200px] items-center justify-center gap-2.5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                {processing ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : "Pay & Place Order"}
              </button>
            </div>

          </form>

          {/* ── Right: Cart Summary ── */}
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">Qty {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#2d4c38] dark:text-[#f4f6f4] font-serif shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e2dacd]/60 dark:border-white/[0.05] pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="font-semibold text-foreground">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping</span><span className="font-semibold text-foreground">{cartSubtotal >= 75 ? "Free" : "$9.00"}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1 border-t border-[#e2dacd]/40 dark:border-white/[0.03]">
                  <span>Total</span>
                  <span className="text-base font-bold text-[#2d4c38] dark:text-white font-serif">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
