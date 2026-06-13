"use client";

import React, {
  useState, useEffect, useRef, useLayoutEffect, useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "../../context/CartContext";
import {
  useCurrency, CURRENCIES, LANGUAGES, COUNTRIES,
  type CurrencyCode, type LanguageCode, type CountryConfig,
} from "@/context/CurrencyContext";
import { CountryFlag, CURRENCY_TO_COUNTRY } from "@/components/ui/CountryFlag";

/* ─────────────────────────────────────────
   Static nav data
   ───────────────────────────────────────── */

const SHOP_CATEGORIES = [
  { label: "All Products",    href: "/p/shop",                       icon: "inventory_2", desc: "Browse the full collection" },
  { label: "Cleansers",       href: "/p/shop?category=Cleanser",     icon: "water_drop",  desc: "Gentle botanical cleansers" },
  { label: "Serums",          href: "/p/shop?category=Serum",        icon: "science",     desc: "Concentrated actives" },
  { label: "Toners",          href: "/p/shop?category=Toner",        icon: "spa",         desc: "Balance & restore" },
  { label: "Moisturizers",    href: "/p/shop?category=Moisturizer",  icon: "opacity",     desc: "Nourishing botanicals" },
  { label: "Treatments",      href: "/p/shop?category=Treatment",    icon: "healing",     desc: "Targeted botanical care" },
];

const NAV_LINKS = [
  { href: "/p/bundles",        label: "Ritual Bundles" },
  { href: "/p/story",          label: "Our Story" },
  { href: "/p/sustainability", label: "Sustainability" },
  { href: "/p/blog",           label: "Blog" },
  { href: "/support",          label: "Support" },
];

/* ─────────────────────────────────────────
   Locale Popover (globe icon → opens here)
   ───────────────────────────────────────── */
function LocalePopover({
  anchorRef,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const {
    currency, language, country, geoLoading,
    setCurrency, setLanguage, setCountry,
  } = useCurrency();

  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"country" | "currency" | "language">("country");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !ref.current?.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+10px)] z-[200] w-[340px] rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden animate-scale-up"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border/40">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Location &amp; Preferences
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">
          {geoLoading ? "Detecting your location…" : "Auto-detected. Prices shown in your currency; payments in USD."}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/40">
        {(["country", "currency", "language"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              tab === t
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="max-h-56 overflow-y-auto py-1.5">
        {tab === "country" && COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => { setCountry(c); onClose(); }}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors cursor-pointer ${
              country.code === c.code
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="w-7 flex-shrink-0 flex items-center justify-start"><CountryFlag countryCode={c.code} size={20} /></span>
            <span className="flex-1">{c.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{c.defaultCurrency}</span>
            {country.code === c.code && <span className="ms text-primary" style={{ fontSize: 16 }}>check</span>}
          </button>
        ))}

        {tab === "currency" && Object.values(CURRENCIES).map((c) => (
          <button
            key={c.code}
            onClick={() => { setCurrency(c.code as CurrencyCode); onClose(); }}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors cursor-pointer ${
              currency === c.code
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="w-7 flex-shrink-0 flex items-center justify-start"><CountryFlag countryCode={CURRENCY_TO_COUNTRY[c.code] || "us"} size={20} /></span>
            <span className="flex-1">{c.name}</span>
            <span className="text-xs font-mono text-muted-foreground">{c.symbol} {c.code}</span>
            {currency === c.code && <span className="ms text-primary" style={{ fontSize: 16 }}>check</span>}
          </button>
        ))}

        {tab === "language" && Object.values(LANGUAGES).map((l) => (
          <button
            key={l.code}
            onClick={() => { setLanguage(l.code as LanguageCode); onClose(); }}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors cursor-pointer ${
              language === l.code
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="flex-1 font-medium">{l.nativeName}</span>
            <span className="text-[11px] text-muted-foreground">{l.name}</span>
            {language === l.code && <span className="ms text-primary" style={{ fontSize: 16 }}>check</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Shop Mega-Menu — rendered fixed so it
   escapes the header's stacking context
   ───────────────────────────────────────── */
function ShopMegaMenu({
  visible,
  top,
  onClose,
}: {
  visible: boolean;
  top: number;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Shop categories"
      style={{
        position: "fixed",
        top,
        left: 0,
        right: 0,
        zIndex: 500,
        pointerEvents: visible ? "auto" : "none",
        display: "flex",
        justifyContent: "center",
        padding: "0 1.5rem",
      }}
    >
      <div
        className={`w-full max-w-3xl rounded-3xl border border-border/40 shadow-[0_24px_64px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.06)] bg-white dark:bg-[#111a14] overflow-hidden transition-all duration-250 ${
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Header strip */}
        <div className="flex items-center gap-4 px-7 py-4 bg-[#0d1510] border-b border-white/[0.06]">
          <span className="ms text-[#b07e3a]" style={{ fontSize: 20 }}>spa</span>
          <div>
            <p className="text-sm font-bold text-white leading-none">The Shop</p>
            <p className="text-[11px] text-white/40 mt-0.5">Wild-harvested botanical formulas</p>
          </div>
          <a
            href="/p/shop"
            onClick={onClose}
            className="ml-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-70 transition-opacity"
          >
            View All <span className="ms" style={{ fontSize: 13 }}>arrow_forward</span>
          </a>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-3 gap-2 p-5">
          {SHOP_CATEGORIES.map((cat) => (
            <a
              key={cat.href}
              href={cat.href}
              onClick={onClose}
              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] transition-colors duration-150"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 transition-colors">
                <span className="ms text-primary dark:text-emerald-400" style={{ fontSize: 18 }}>{cat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors leading-tight">{cat.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{cat.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/30 dark:border-white/[0.06] px-7 py-3 bg-muted/30 dark:bg-[#0a0d0b]">
          <p className="text-[11px] text-muted-foreground">
            <span className="text-[#b07e3a] font-semibold">Free shipping</span> on orders over $75
          </p>
          <a
            href="/p/bundles"
            onClick={onClose}
            className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            View Ritual Bundles →
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Pill icon button helper
   ───────────────────────────────────────── */
function PillBtn({
  onClick,
  href,
  label,
  badge,
  children,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  const cls = "group relative flex items-center justify-center h-10 w-10 rounded-full border bg-[#1c2e24] border-[#2d4c38]/80 hover:border-[#b07e3a]/60 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.15)] transition-all duration-250 cursor-pointer flex-shrink-0";
  const inner = (
    <>
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none" />
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#b07e3a] text-[9px] font-bold text-white shadow-sm z-10">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </>
  );
  if (href) return <a href={href} className={cls} aria-label={label}>{inner}</a>;
  return <button onClick={onClick} className={cls} aria-label={label}>{inner}</button>;
}

/* ─────────────────────────────────────────
   Notification type
   ───────────────────────────────────────── */
interface NavNotification {
  _id: string; title: string; message: string; read: boolean;
  link?: string; createdAt: string;
}

/* ═════════════════════════════════════════
   MAIN NAVBAR — single row, Dribbble-inspired
   ═════════════════════════════════════════ */
export default function Navbar() {
  const pathname             = usePathname();
  const { data: session, status } = useSession();
  const { setIsCartOpen, cartCount } = useCart();
  const { country, currency, geoLoading } = useCurrency();

  const [mounted,           setMounted]           = useState(false);
  const [customLinks,       setCustomLinks]        = useState<any[]>([]);
  const [notifications,     setNotifications]      = useState<NavNotification[]>([]);
  const [notifLoading,      setNotifLoading]       = useState(false);
  const [showShop,          setShowShop]           = useState(false);
  const [showProfile,       setShowProfile]        = useState(false);
  const [showBell,          setShowBell]           = useState(false);
  const [showLocale,        setShowLocale]         = useState(false);
  const [mobileOpen,        setMobileOpen]         = useState(false);
  const [mobileShopOpen,    setMobileShopOpen]     = useState(false);
  const [searchQuery,       setSearchQuery]        = useState("");
  const [showMobileSearch,  setShowMobileSearch]   = useState(false);
  const [megaMenuTop,       setMegaMenuTop]        = useState(64);

  const headerRef  = useRef<HTMLElement>(null);
  const shopRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef    = useRef<HTMLDivElement>(null);
  const globeRef   = useRef<HTMLButtonElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  /* Track header bottom for fixed mega-menu positioning */
  useLayoutEffect(() => {
    const updateTop = () => {
      if (headerRef.current) {
        setMegaMenuTop(headerRef.current.getBoundingClientRect().bottom + 8);
      }
    };
    updateTop();
    window.addEventListener("scroll",  updateTop, { passive: true });
    window.addEventListener("resize",  updateTop);
    return () => {
      window.removeEventListener("scroll",  updateTop);
      window.removeEventListener("resize",  updateTop);
    };
  }, [mounted]);

  /* Fetch custom nav links */
  useEffect(() => {
    fetch("/api/custom-pages", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomLinks(
            data
              .filter((p: any) => p.metadata?.showInNavbar === true)
              .map((p: any) => ({ href: `/p/${p.metadata?.slug}`, label: p.title }))
          );
        }
      })
      .catch(() => {});
  }, []);

  /* Notifications */
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/user/notifications", { cache: "no-store" });
      if (res.ok) setNotifications(await res.json());
    } catch {} finally { setNotifLoading(false); }
  }, []);

  useEffect(() => {
    if (session) fetchNotifications();
  }, [session, fetchNotifications]);

  /* Close everything on route change */
  useEffect(() => {
    setShowShop(false); setShowProfile(false); setShowBell(false);
    setShowLocale(false); setMobileOpen(false); setMobileShopOpen(false);
    setShowMobileSearch(false);
  }, [pathname]);

  /* Click-outside: shop */
  useEffect(() => {
    if (!showShop) return;
    const h = (e: MouseEvent) => {
      if (!shopRef.current?.contains(e.target as Node)) setShowShop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showShop]);

  /* Click-outside: profile */
  useEffect(() => {
    if (!showProfile) return;
    const h = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showProfile]);

  /* Click-outside: bell */
  useEffect(() => {
    if (!showBell) return;
    const h = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setShowBell(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showBell]);

  /* Body lock when mobile open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (!mounted) {
    return (
      <header style={{ height: 64 }} className="sticky top-0 z-40 w-full border-b border-border/40 glass-panel" />
    );
  }

  if (pathname?.startsWith("/admin")) return null;

  const handleSignOut = () => signOut({ callbackUrl: (typeof window !== "undefined" ? window.location.origin : "") + "/login?logout=true" });
  const handleSearch  = (q: string) => { if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`; };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const cfgCurrency = CURRENCIES[currency];

  /* ── All nav links for desktop ── */
  const allNavLinks = [
    ...NAV_LINKS,
    ...customLinks,
  ];

  return (
    <>
      {/* ══════════════════════════════
          Single-row sticky header
          ══════════════════════════════ */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 w-full border-b border-border/40 glass-panel"
        style={{ height: 64, overflow: "visible" }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-8">
          {showMobileSearch ? (
            <div className="flex md:hidden items-center w-full gap-3 h-full animate-fade-in">
              <div className="flex-grow flex items-center h-10 border border-border/80 bg-muted/40 dark:bg-[#1a2520]/60 focus-within:ring-2 focus-within:ring-primary/40 rounded-full overflow-hidden px-3">
                <span className="ms text-muted-foreground me-2" style={{ fontSize: 18 }}>search</span>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch(searchQuery);
                    if (e.key === "Escape") { setSearchQuery(""); setShowMobileSearch(false); }
                  }}
                  placeholder="Search rituals…"
                  className="flex-grow text-xs text-foreground placeholder-muted-foreground/50 bg-transparent focus:outline-none pr-1"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer flex items-center justify-center bg-transparent border-0"
                    aria-label="Clear Search"
                  >
                    <span className="ms text-xs" style={{ fontSize: 14 }}>close</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowMobileSearch(false); setSearchQuery(""); }}
                className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:text-white bg-[#b07e3a]/15 hover:bg-[#b07e3a] px-4 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border border-[#b07e3a]/30 hover:border-transparent active:scale-95 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* ── Mobile hamburger ── */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex flex-col gap-[5px] items-center justify-center h-10 w-10 flex-shrink-0 md:hidden cursor-pointer group"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
            <span className={`block h-[1.5px] rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "w-[18px] rotate-45 translate-y-[6.5px]" : "w-[18px]"}`} />
            <span className={`block h-[1.5px] rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "opacity-0 w-0" : "w-[14px]"}`} />
            <span className={`block h-[1.5px] rounded-full bg-foreground transition-all duration-300 ${mobileOpen ? "w-[18px] -rotate-45 -translate-y-[6.5px]" : "w-[18px]"}`} />
          </button>

          {/* ── Logo ── */}
          <a
            href="/"
            className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity flex-shrink-0"
          >
            Naturalist.
          </a>

          {/* ── Desktop nav links ── */}
          <nav className="hidden md:flex items-center gap-0.5 ml-4 flex-shrink-0">
            {/* Shop with mega-menu */}
            <div ref={shopRef} className="relative">
              <button
                onMouseEnter={() => setShowShop(true)}
                onFocus={() => setShowShop(true)}
                onClick={() => setShowShop((s) => !s)}
                className={`flex items-center gap-1 h-9 px-3.5 text-[13.5px] font-medium rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  pathname?.includes("/shop") || pathname?.includes("/p/shop")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                Shop
                <span
                  className={`ms transition-transform duration-200 ${showShop ? "rotate-180" : ""}`}
                  style={{ fontSize: 15 }}
                >
                  expand_more
                </span>
              </button>
              {/* Hover bridge to keep mega-menu alive when moving mouse down */}
              {showShop && (
                <div
                  className="absolute left-0 right-0 top-full h-6 z-10"
                  onMouseLeave={() => setShowShop(false)}
                />
              )}
            </div>

            {/* Other links */}
            {allNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`h-9 px-3.5 flex items-center text-[13.5px] font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                  pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── Flex spacer ── */}
          <div className="flex-1 min-w-0" />

          {/* ── Search (desktop, prominent) ── */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center h-10 w-64 border border-border/50 bg-[#141f19]/05 dark:bg-[#1a2520]/60 hover:border-border/80 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/40 rounded-full overflow-hidden px-3">
              <button
                onClick={() => handleSearch(searchQuery)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center me-2 bg-transparent border-0"
                aria-label="Submit Search"
              >
                <span className="ms" style={{ fontSize: 18 }}>search</span>
              </button>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch(searchQuery);
                  if (e.key === "Escape") setSearchQuery("");
                }}
                placeholder="Search rituals…"
                className="flex-1 text-xs text-foreground placeholder-muted-foreground/50 bg-transparent focus:outline-none pr-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer flex items-center justify-center bg-transparent border-0"
                  aria-label="Clear Search"
                >
                  <span className="ms text-xs" style={{ fontSize: 14 }}>close</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Globe (locale selector) ── */}
          <div className="relative hidden md:block">
            <button
              ref={globeRef}
              onClick={() => setShowLocale((s) => !s)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-full border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-border/80 transition-all duration-200 text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
              title="Change location & currency"
            >
              {geoLoading ? (
                <span className="ms animate-spin text-muted-foreground/50" style={{ fontSize: 17 }}>progress_activity</span>
              ) : (
                <>
                  <CountryFlag countryCode={country.code} size={18} className="me-1" />
                  <span className="text-[11px] font-mono font-semibold">{cfgCurrency.code}</span>
                  <span className="ms text-muted-foreground/50" style={{ fontSize: 13 }}>expand_more</span>
                </>
              )}
            </button>
            {showLocale && (
              <LocalePopover anchorRef={globeRef} onClose={() => setShowLocale(false)} />
            )}
          </div>

          {/* ── Action icons ── */}
          <div className="flex items-center gap-2">

            {/* Mobile search */}
            <button
              onClick={() => setShowMobileSearch(true)}
              className="flex md:hidden items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
              aria-label="Search"
            >
              <span className="ms" style={{ fontSize: 22 }}>search</span>
            </button>

            {/* Bell — auth only */}
            {status === "authenticated" && session && (
              <div className="relative" ref={bellRef}>
                <PillBtn label="Notifications" onClick={() => { setShowBell(!showBell); setShowProfile(false); }} badge={unreadCount}>
                  <span className="ms text-white/80 group-hover:text-white transition-colors" style={{ fontSize: 20 }}>notifications</span>
                </PillBtn>

                {showBell && (
                  <>
                    <div onClick={() => setShowBell(false)} className="fixed inset-0 z-40" />
                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-80 rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden animate-scale-up">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              await fetch("/api/user/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
                              setNotifications((p) => p.map((n) => ({ ...n, read: true })));
                            }}
                            className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifLoading ? (
                          <div className="flex items-center justify-center py-10 gap-2">
                            <span className="ms animate-spin text-accent" style={{ fontSize: 18 }}>progress_activity</span>
                            <span className="text-xs text-muted-foreground">Loading…</span>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="flex flex-col items-center py-10 text-center gap-2 px-4">
                            <span className="ms text-muted-foreground/30" style={{ fontSize: 36 }}>notifications_off</span>
                            <p className="text-xs font-semibold text-muted-foreground">You&apos;re all caught up</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/30">
                            {notifications.slice(0, 10).map((n) => (
                              <button
                                key={n._id}
                                onClick={() => { setShowBell(false); window.location.href = `/account/notifications/${n._id}`; }}
                                className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-muted/60 transition-colors cursor-pointer ${!n.read ? "bg-accent/5" : ""}`}
                              >
                                <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.read ? "bg-accent" : "bg-transparent"}`} />
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs leading-snug truncate ${!n.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{n.title}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="border-t border-border/40 px-4 py-2.5">
                          <a href="/account/notifications" onClick={() => setShowBell(false)} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider">
                            View all
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              {status === "loading" ? (
                <div className="h-10 w-10 rounded-full bg-[#1c2e24]/60 animate-pulse flex-shrink-0" />
              ) : session ? (
                <>
                  <PillBtn label="Account menu" onClick={() => { setShowProfile(!showProfile); setShowBell(false); }}>
                    {session.user?.image ? (
                      <img src={session.user.image} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span className="text-white/90 text-xs font-bold">
                        {session.user?.name ? session.user.name[0].toUpperCase() : "U"}
                      </span>
                    )}
                  </PillBtn>

                  {showProfile && (
                    <>
                      <div onClick={() => setShowProfile(false)} className="fixed inset-0 z-40" />
                      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 rounded-2xl border border-border/40 bg-card p-2 shadow-2xl animate-scale-up">
                        <div className="px-3 py-2 mb-1 border-b border-border/40">
                          <p className="text-xs font-bold text-foreground truncate">{session.user?.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{session.user?.email}</p>
                        </div>
                        <a href="/account" onClick={() => setShowProfile(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors">
                          <span className="ms" style={{ fontSize: 16 }}>person</span> My Account
                        </a>
                        {(session.user as any)?.role === "admin" && (
                          <a href="/admin" onClick={() => setShowProfile(false)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-accent rounded-xl hover:bg-accent/10 transition-colors font-medium">
                            <span className="ms" style={{ fontSize: 16 }}>admin_panel_settings</span> Admin Panel
                          </a>
                        )}
                        <div className="border-t border-border/40 mt-1 pt-1">
                          <button onClick={() => { setShowProfile(false); handleSignOut(); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/8 rounded-xl transition-colors">
                            <span className="ms" style={{ fontSize: 16 }}>logout</span> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <PillBtn label="Account" onClick={() => setShowProfile(!showProfile)}>
                    <span className="ms text-white/80 group-hover:text-white" style={{ fontSize: 21 }}>person</span>
                  </PillBtn>
                  {showProfile && (
                    <>
                      <div onClick={() => setShowProfile(false)} className="fixed inset-0 z-40" />
                      <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl border border-border/30 bg-card p-5 shadow-2xl animate-scale-up">
                        <p className="text-base font-bold text-foreground mb-1">Welcome back</p>
                        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">Sign in to track orders and unlock exclusive botanical rituals.</p>
                        <div className="flex gap-3">
                          <a href="/login" onClick={() => setShowProfile(false)} className="flex flex-1 items-center justify-center h-10 rounded-full bg-[#1c2e24] text-xs font-semibold text-white hover:bg-[#243829] transition-all">Sign In</a>
                          <a href="/register" onClick={() => setShowProfile(false)} className="flex flex-1 items-center justify-center h-10 rounded-full border border-border/70 text-xs font-semibold text-foreground hover:bg-muted transition-all">Register</a>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Cart */}
            <PillBtn href="/cart" label="Shopping cart">
              <span className="ms text-white/80 group-hover:text-white" style={{ fontSize: 20 }}>shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#b07e3a] text-[9px] font-bold text-white shadow-sm z-10">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </PillBtn>

          </div>
          </>
          )}
        </div>
      </header>

      {/* ══════════════════════════════
          Fixed Shop Mega-Menu (outside
          header stacking context)
          ══════════════════════════════ */}
      <div
        onMouseEnter={() => setShowShop(true)}
        onMouseLeave={() => setShowShop(false)}
      >
        <ShopMegaMenu visible={showShop} top={megaMenuTop} onClose={() => setShowShop(false)} />
      </div>

      {/* ══════════════════════════════
          Mobile backdrop
          ══════════════════════════════ */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-[#141f19]/50 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* ══════════════════════════════
          Mobile side drawer
          ══════════════════════════════ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="fixed inset-y-0 left-0 z-50 w-[300px] sm:w-[360px] bg-white dark:bg-[#0f1411] border-r border-border/40 shadow-2xl overflow-y-auto flex flex-col md:hidden"
        style={{
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drawer top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b07e3a]/50 to-transparent" />

        {/* Logo row */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40">
          <a href="/" className="font-serif text-xl font-bold text-primary">Naturalist.</a>
          <button onClick={() => setMobileOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
            <span className="ms" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Mobile locale strip */}
        <div className="px-6 py-3 border-b border-border/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Location</p>
          <div className="flex items-center gap-3">
            <CountryFlag countryCode={country.code} size={22} />
            <span className="text-sm font-medium text-foreground">{country.name}</span>
            <span className="ml-auto text-xs font-mono font-bold text-accent">{cfgCurrency.code}</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-4">

          {/* Shop accordion */}
          <div className="border-b border-border/30">
            <button
              onClick={() => setMobileShopOpen((s) => !s)}
              className="group w-full flex items-center justify-between py-4 cursor-pointer"
            >
              <span className="font-serif text-[22px] font-bold text-foreground/60 group-hover:text-primary transition-colors">
                Shop
              </span>
              <span className={`ms text-muted-foreground/40 transition-all duration-300 ${mobileShopOpen ? "rotate-90 text-accent" : ""}`} style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${mobileShopOpen ? "max-h-[360px] pb-4" : "max-h-0"}`}>
              <div className="grid grid-cols-2 gap-2 pl-2">
                {SHOP_CATEGORIES.map((cat) => (
                  <a
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-primary/10 transition-colors"
                  >
                    <span className="ms text-primary" style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Other links */}
          {allNavLinks.map((link, idx) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center justify-between py-4 border-b border-border/30 transition-all duration-200 ${
                pathname === link.href ? "" : "hover:pl-1.5"
              }`}
            >
              <span className={`font-serif text-[22px] font-bold transition-colors ${
                pathname === link.href
                  ? "text-primary"
                  : "text-foreground/60 group-hover:text-primary"
              }`}>
                {link.label}
              </span>
              <span className={`ms transition-colors ${pathname === link.href ? "text-accent" : "text-muted-foreground/30 group-hover:text-accent"}`} style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </a>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="px-6 py-4 border-t border-border/40">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                {session.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{session.user?.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{session.user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <a href="/login" onClick={() => setMobileOpen(false)} className="flex flex-1 items-center justify-center h-10 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Sign In</a>
              <a href="/register" onClick={() => setMobileOpen(false)} className="flex flex-1 items-center justify-center h-10 rounded-full border border-border text-xs font-semibold text-foreground">Register</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
