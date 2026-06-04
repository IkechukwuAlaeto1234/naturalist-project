"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "../../context/CartContext";
import { LogOut, Settings, ShoppingBag, Search, Bell, X, ArrowRight, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────
   Inline icon components (no extra packages)
   ───────────────────────────────────────── */

const PersonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/* ─────────────────────────────────────────
   Static data
   ───────────────────────────────────────── */

const navLinks = [
  { href: "/p/shop",           label: "Shop",           num: "01" },
  { href: "/p/bundles",        label: "Ritual Bundles",  num: "02" },
  { href: "/p/story",          label: "Our Story",       num: "03" },
  { href: "/p/sustainability", label: "Sustainability",  num: "04" },
  { href: "/p/blog",           label: "Blog",           num: "05" },
];

const socialLinks = [
  { label: "X (Twitter)", icon: TwitterIcon },
  { label: "Instagram",   icon: InstagramIcon },
  { label: "YouTube",     icon: YoutubeIcon },
  { label: "LinkedIn",    icon: LinkedinIcon },
];

/* ─────────────────────────────────────────
   Shared pill button classes
   ───────────────────────────────────────── */
const PILL =
  "group relative flex items-center justify-center rounded-full border bg-[#1c2e24] border-[#2d4c38]/80 hover:border-[#b07e3a]/60 shadow-[0_2px_16px_rgba(45,76,56,0.30)] hover:shadow-[0_2px_20px_rgba(176,126,58,0.20)] transition-all duration-300 cursor-pointer flex-shrink-0 aspect-square";
const PILL_GLOW =
  "absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none";
const PILL_ICON = "relative text-white/80 group-hover:text-white transition-colors";

/* Spring easing for the X animation */
const SPRING: React.CSSProperties = {
  transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.25s ease, box-shadow 0.3s ease",
};

/* ═════════════════════════════════════════
   Component
   ═════════════════════════════════════════ */
export default function Navbar() {
  const pathname                                = usePathname();
  const { data: session }                       = useSession();
  const { setIsCartOpen, cartCount }            = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen]       = useState(false);
  const [isBellOpen, setIsBellOpen]             = useState(false);
  const [isSearchOpen, setIsSearchOpen]         = useState(false);
  const [mounted, setMounted]                   = useState(false);
  const [customLinks, setCustomLinks]           = useState<any[]>([]);
  const searchRef               = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef    = useRef<HTMLInputElement>(null);
  const profileRef              = useRef<HTMLDivElement>(null);
  const bellRef                 = useRef<HTMLDivElement>(null);
  const searchWrapperRef        = useRef<HTMLDivElement>(null);
  const desktopSearchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/custom-pages", { cache: "no-store" })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setCustomLinks(data.map((page, idx) => ({
            href: `/p/${page.metadata?.slug}`,
            label: page.title,
            num: String(6 + idx).padStart(2, '0')
          })));
        }
      })
      .catch(() => {});
  }, []);

  /* Close everything on route change */
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsBellOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  /* Auto-focus search inputs */
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchRef.current?.focus();
        desktopSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchOpen]);

  /* Click-outside: close profile dropdown */
  useEffect(() => {
    if (!isProfileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isProfileOpen]);

  /* Click-outside: close bell dropdown */
  useEffect(() => {
    if (!isBellOpen) return;
    const handler = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setIsBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isBellOpen]);

  /* Click-outside: close search dropdowns (both mobile and desktop) */
  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e: MouseEvent) => {
      const clickedOutsideMobile = !searchWrapperRef.current?.contains(e.target as Node);
      const clickedOutsideDesktop = !desktopSearchWrapperRef.current?.contains(e.target as Node);
      if (clickedOutsideMobile && clickedOutsideDesktop) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen]);

  /* Body scroll lock while mobile menu open */
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  /* SSR placeholder */
  if (!mounted) {
    return <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/50 backdrop-blur-md h-20" />;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  /* ─────────────────────────────────────────
     Render
     ───────────────────────────────────────── */
  const allLinks = [...navLinks, ...customLinks];

  return (
    <>
      {/* ══════════════════════════════════════
          Sticky bar
          ══════════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 glass-panel backdrop-blur-md">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">

          {/* Hamburger + Logo */}
          <div
            className="flex items-center gap-4 flex-shrink-0 transition-all duration-500 ease-out"
            style={{
              width: isSearchOpen ? "125px" : "192px",
            }}
          >
            {/* ── Hamburger (mobile only) ── */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`${PILL} h-10 w-10 min-w-10 min-h-10 aspect-square flex-col gap-1.5 md:hidden flex-shrink-0`}
              data-tooltip="Menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <span className={PILL_GLOW} />
              <span className="relative block w-[16px] h-[1.5px] rounded-full bg-white" />
              <span className="relative block w-[16px] h-[1.5px] rounded-full bg-white" />
              <span className="relative block w-[16px] h-[1.5px] rounded-full bg-white" />
            </button>

            {/* ── Logo ── */}
            <div className="flex-shrink-0 text-center md:text-left">
              <a
                href="/"
                className="font-serif text-[1.35rem] sm:text-2xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity inline-block"
              >
                Naturalist.
              </a>
            </div>
          </div>

          {/* - Desktop Center: Nav Links and Inline Search - */}
          <div
            ref={desktopSearchWrapperRef}
            className="hidden md:flex flex-1 items-center justify-between relative h-12 px-6"
          >
            {/* Nav links - slides left when search opens, remains fully visible */}
            <nav
              className="flex items-center gap-6 lg:gap-8 transition-all duration-500 ease-out"
              style={{
                opacity: 1,
                pointerEvents: "auto",
                whiteSpace: "nowrap",
                transform: isSearchOpen ? "translateX(-50px)" : "translateX(0px)",
                marginLeft: isSearchOpen ? "0px" : "auto",
                marginRight: isSearchOpen ? "auto" : "auto",
              }}
            >
              {allLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive
                        ? "text-primary border-b-2 border-primary/80 pb-1"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* Inline premium search - slides in from right when open */}
            <div
              className="flex items-center bg-white dark:bg-[#111a14] border-2 border-[#1c2e24] dark:border-[#2d4c38]/80 rounded-full pl-5 pr-[5px] h-12 overflow-hidden transition-all duration-500 ease-out shadow-[0_2px_10px_rgba(28,46,36,0.06)] focus-within:border-[#b07e3a]"
              style={{
                width: isSearchOpen ? "320px" : "0px",
                opacity: isSearchOpen ? 1 : 0,
                pointerEvents: isSearchOpen ? "auto" : "none",
                marginLeft: isSearchOpen ? "1.5rem" : "0px",
              }}
            >
              <input
                ref={desktopSearchInputRef}
                type="search"
                placeholder="Search rituals..."
                className="w-full bg-transparent border-none text-[#1c2e24] dark:text-white placeholder-[#2d4c38]/60 dark:placeholder-white/40 text-sm font-medium focus:outline-none pr-3"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSearchOpen(false);
                  if (e.key === "Enter") {
                    window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`;
                  }
                }}
              />
              <button
                onClick={() => {
                  if (desktopSearchInputRef.current?.value) {
                    window.location.href = `/search?q=${encodeURIComponent(desktopSearchInputRef.current.value)}`;
                  }
                }}
                className="group relative flex h-10 w-10 items-center justify-center rounded-full border bg-[#1c2e24] border-[#2d4c38]/80 hover:border-[#b07e3a]/60 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.15)] transition-all duration-300 flex-shrink-0 cursor-pointer"
                aria-label="Submit search"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none" />
                <Search className="relative text-white/80 group-hover:text-white h-[18px] w-[18px] transition-colors" />
              </button>
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0 md:min-w-[192px] md:w-auto">

            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`${PILL} hidden md:flex h-10 w-10 sm:h-11 sm:w-11`}
              data-tooltip={isSearchOpen ? "Close Search" : "Search"}
              aria-label={isSearchOpen ? "Close Search" : "Search"}
            >
              <span className={PILL_GLOW} />
              {isSearchOpen
                ? <X className={`${PILL_ICON} h-[17px] w-[17px]`} />
                : <Search className={`${PILL_ICON} h-[17px] w-[17px]`} />}
            </button>

            {/* Notification bell — authenticated only */}
            {session && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); setIsSearchOpen(false); }}
                  className={`${PILL} h-10 w-10 sm:h-11 sm:w-11 flex`}
                  aria-label="Notifications"
                  aria-expanded={isBellOpen}
                >
                  <span className={PILL_GLOW} />
                  <Bell className={`${PILL_ICON} h-[17px] w-[17px]`} />
                  <span className="absolute top-[9px] right-[9px] h-[7px] w-[7px] rounded-full bg-[#b07e3a] ring-2 ring-[#1c2e24]" />
                </button>

                {isBellOpen && (
                  <>
                    <div onClick={() => setIsBellOpen(false)} className="fixed inset-0 z-30" />
                    <div className="fixed left-1/2 top-[5rem] z-40 w-[calc(100vw-1rem)] max-w-72 -translate-x-1/2 rounded-2xl border border-border/40 bg-card p-4 shadow-2xl ring-1 ring-black/5 animate-fade-in-up sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2.5 sm:w-72 sm:max-w-none sm:translate-x-0 sm:origin-top-right">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Notifications</p>
                      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                        <Bell className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground">No new notifications</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Profile / Auth ── */}
            {session ? (
              /* Authenticated — avatar circle, no name in button */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => { setIsProfileOpen(!isProfileOpen); setIsBellOpen(false); }}
                  className={`${PILL} h-10 w-10 sm:h-11 sm:w-11`}
                  aria-label="Profile menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className={PILL_GLOW} />
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile Picture"
                      className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white flex-shrink-0">
                      {session.user?.name ? session.user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                </button>

                {isProfileOpen && (
                  <>
                    <div onClick={() => setIsProfileOpen(false)} className="fixed inset-0 z-30" />
                    <div className="absolute right-0 mt-2.5 z-40 w-52 origin-top-right rounded-2xl border border-border/40 bg-card p-2 shadow-2xl ring-1 ring-black/5 animate-fade-in-up">
                      {/* User info header */}
                      <div className="px-3 py-2 mb-1 border-b border-border/40">
                        <p className="text-xs font-bold text-foreground truncate">{session.user?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{session.user?.email}</p>
                      </div>

                      <a
                        href="/account"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
                      >
                        <PersonIcon className="h-4 w-4 flex-shrink-0" />
                        My Account
                      </a>

                      {(session.user as any)?.role === "admin" && (
                        <a
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[#b07e3a] dark:text-[#d4a362] rounded-xl hover:bg-[#b07e3a]/10 transition-colors font-medium"
                        >
                          <Settings className="h-4 w-4 flex-shrink-0" />
                          Admin Panel
                        </a>
                      )}

                      <div className="border-t border-border/40 mt-1 pt-1">
                        <button
                          onClick={() => { setIsProfileOpen(false); handleSignOut(); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/8 rounded-xl transition-colors"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Unauthenticated — person icon + sign in / create account dropdown */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`${PILL} h-11 w-11`}
                  data-tooltip="Account"
                  aria-label="Account menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className={PILL_GLOW} />
                  <PersonIcon className={`${PILL_ICON} h-[19px] w-[19px]`} />
                </button>

                {isProfileOpen && (
                  <div className="fixed left-1/2 top-[5rem] z-40 w-[calc(100vw-1rem)] max-w-72 -translate-x-1/2 rounded-3xl border border-border/30 bg-card p-5 shadow-2xl ring-1 ring-black/5 animate-fade-in-up sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-3 sm:w-72 sm:max-w-none sm:translate-x-0 sm:origin-top-right">
                      {/* Greeting */}
                      <p className="text-lg font-bold text-foreground mb-1">Welcome, Guest!</p>
                      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                        Sign in to access your rituals, track orders, and unlock exclusive offers.
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="/login"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex flex-1 items-center justify-center h-11 rounded-full bg-[#1c2e24] text-xs font-semibold text-white hover:bg-[#243829] transition-all shadow-sm"
                        >
                          Sign In
                        </a>
                        <a
                          href="/register"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex flex-1 items-center justify-center h-11 rounded-full border border-border/70 text-xs font-semibold text-foreground hover:bg-muted transition-all"
                        >
                          Create Account
                        </a>
                      </div>
                    </div>
                )}
              </div>
            )}

            {/* Cart */}
            <a
              href="/cart"
              className={`${PILL} h-10 w-10 sm:h-11 sm:w-11`}
              data-tooltip="Shopping Cart"
              data-tooltip-align="right"
              aria-label="Shopping cart"
            >
              <span className={PILL_GLOW} />
              <ShoppingBag className={`${PILL_ICON} h-[17px] w-[17px]`} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#b07e3a] text-[9px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </a>

          </div>
        </div>

        {/* ── Centered Premium Floating Dropdown Search Widget (Mobile Only) ── */}
        {isSearchOpen && (
          <div
            ref={searchWrapperRef}
            className="md:hidden border-t border-border/20 bg-card/95 backdrop-blur-xl py-4 px-6 flex justify-center animate-fade-in-down pointer-events-auto"
          >
            <div
              className="flex items-center bg-white dark:bg-[#111a14] border-2 border-[#1c2e24] dark:border-[#2d4c38]/80 rounded-full pl-5 pr-[5px] h-12 shadow-[0_4px_20px_rgba(28,46,36,0.06)] transition-all duration-300 w-full max-w-[400px]"
            >
              <input
                ref={searchRef}
                type="search"
                autoFocus
                placeholder="Search rituals..."
                className="w-full bg-transparent border-none text-[#1c2e24] dark:text-white placeholder-[#2d4c38]/60 dark:placeholder-white/40 text-sm font-medium focus:outline-none pr-3"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSearchOpen(false);
                  if (e.key === "Enter") {
                    window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`;
                  }
                }}
              />
              <button
                onClick={() => {
                  if (searchRef.current?.value) {
                    window.location.href = `/search?q=${encodeURIComponent(searchRef.current.value)}`;
                  }
                }}
                className="group relative flex h-10 w-10 items-center justify-center rounded-full border bg-[#1c2e24] border-[#2d4c38]/80 hover:border-[#b07e3a]/60 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.15)] transition-all duration-300 flex-shrink-0 cursor-pointer"
                aria-label="Submit search"
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none" />
                <Search className="relative text-white/80 group-hover:text-white h-[18px] w-[18px] transition-colors" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════
          Mobile menu — Piqo-style floating dropdown card
          ══════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════
          Mobile menu — Piqo-style vertical slide-out drawer
          ══════════════════════════════════════════════════════ */}
      {/* Blurred backdrop overlay (rendered standalone to animate backdrop smoothly) */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-[#141f19]/40 backdrop-blur-sm md:hidden animate-fade-in transition-all duration-300 cursor-pointer"
        />
      )}

      {/* Left drawer panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-[320px] sm:w-[380px] h-full bg-white dark:bg-[#0f1411] border-r border-[#e2dacd] dark:border-white/[0.08] shadow-2xl overflow-y-auto flex flex-col justify-between md:hidden"
        style={{
          transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        {/* Container wrapper */}
        <div className="relative flex flex-col h-full justify-between">
          {/* Botanical SVG pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <defs>
              <pattern id="menuPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M15 50 Q30 15 50 15 Q37 37 15 50Z" fill="#b07e3a" opacity="0.035" />
                <path d="M15 50 Q30 85 50 85 Q37 63 15 50Z" fill="#b07e3a" opacity="0.02" />
                <path d="M70 15 Q85 33 88 50 Q74 38 70 15Z" fill="#2d4c38" opacity="0.04" />
                <path d="M70 85 Q85 67 88 50 Q74 62 70 85Z" fill="#2d4c38" opacity="0.03" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#menuPattern)" />
          </svg>

          {/* Gold accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#b07e3a]/60 to-transparent pointer-events-none z-10" />

          {/* Header (No close X button, styled exactly like normal desktop header logo) */}
          <div className="relative z-10 flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#e2dacd]/60 dark:border-white/[0.07]">
            <a
              href="/"
              className="font-serif text-2xl font-bold tracking-tight text-primary dark:text-[#f4f6f4] hover:opacity-90 transition-opacity"
            >
              Naturalist.
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="md:hidden group relative flex h-10 w-10 items-center justify-center rounded-full border bg-[#1c2e24] border-[#2d4c38]/80 hover:border-[#b07e3a]/60 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.15)] transition-all duration-300 flex-shrink-0 cursor-pointer"
              aria-label="Search"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none" />
              <Search className="relative text-white/80 group-hover:text-white h-[18px] w-[18px] transition-colors" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="relative z-10 px-5 py-4 flex-1 overflow-y-auto flex flex-col justify-start">
            {allLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center justify-between py-4 border-b border-[#e2dacd]/50 dark:border-white/[0.05] transition-all duration-200 ${
                    isActive ? "" : "hover:pl-1.5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[#b07e3a]/80 group-hover:text-[#b07e3a] transition-colors w-5 flex-shrink-0">
                      {link.num}
                    </span>
                    <div className="relative py-1">
                      <span
                        className={`font-serif font-bold text-2xl tracking-tight leading-none transition-colors ${
                          isActive
                            ? "text-[#2d4c38] dark:text-white"
                            : "text-[#5e6f64] group-hover:text-[#2d4c38] dark:text-[#a3b2a9] dark:hover:text-white"
                        }`}
                      >
                        {link.label}
                      </span>
                      {/* Premium active sliding underline effect */}
                      <span
                        className={`absolute bottom-0 left-0 h-[2px] bg-[#b07e3a] transition-all duration-300 ${
                          isActive ? "w-full" : "w-0 group-hover:w-[40%]"
                        }`}
                      />
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4.5 w-4.5 flex-shrink-0 transition-all duration-300 ${
                      isActive
                        ? "text-[#b07e3a] translate-x-0.5"
                        : "text-[#5e6f64]/40 group-hover:text-[#b07e3a] group-hover:translate-x-1"
                    }`}
                  />
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
