"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";
import { ArrowRight, Loader2 } from "lucide-react";

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <footer className="h-40 bg-[#111a14]" />;
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast("error", "Email required", "Please enter your email address to join the ritual.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("error", "Invalid email", "Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 50));

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.status === 201) {
        showToast("success", "You're in.", "Check your inbox — your 10% welcome gift is waiting.");
        setEmail("");
      } else if (res.status === 200) {
        showToast("info", "Already subscribed.", "This email is already on our list. Check your inbox for past messages.");
      } else {
        showToast("error", "Something went wrong.", data.error || "Please try again.");
      }
    } catch (err) {
      showToast("error", "Error", "Failed to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };  return (
    <div className="mt-auto flex flex-col w-full">

      {/* Main Footer */}
      <footer className="w-full bg-[#111a14] dark:bg-[#070a08] py-12 md:pt-20 md:pb-10 px-6 sm:px-8 border-t border-white/5 transition-colors duration-300">
        <div className="mx-auto max-w-7xl">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 items-start">
            
            {/* Left Column: Subscription, Socials, Legals */}
            <div className="md:col-span-7 lg:col-span-6 flex flex-col gap-8 order-2 md:order-1 border-t border-white/5 pt-10 md:border-t-0 md:pt-0">
              <div className="flex flex-col gap-4">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#fcfcfb] tracking-tight leading-none">
                  Root With Us.
                </h2>
                
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mt-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-grow px-5 py-3 text-sm rounded-full border border-white/10 bg-white/5 text-[#fcfcfb] focus:outline-none focus:ring-2 focus:ring-[#b07e3a] focus:border-transparent transition-all placeholder-white/30"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] px-6 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer shrink-0"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Submit
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white ml-1">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[13px] sm:text-sm text-white/40 tracking-wide max-w-sm mt-1 leading-relaxed">
                  No noise. Just rituals, restocks, and things worth knowing.
                </p>
              </div>

              {/* Social Row */}
              <div className="flex items-center gap-3">
                {[
                  { icon: TwitterIcon, label: "Twitter" },
                  { icon: LinkedinIcon, label: "LinkedIn" },
                  { icon: YoutubeIcon, label: "YouTube" },
                  { icon: InstagramIcon, label: "Instagram" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="h-11 w-11 rounded-full border border-white/15 hover:border-[#b07e3a] bg-white/5 flex items-center justify-center text-white/60 hover:text-[#fcfcfb] transition-all hover:scale-105 hover:bg-[#b07e3a]/10"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>

              {/* Legal Links Row */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-white/5 max-w-md">
                {[
                  { href: "/privacy-policy", label: "Privacy" },
                  { href: "/terms", label: "Terms" },
                  { href: "/cookie-policy", label: "Cookies" },
                  { href: "/sitemap", label: "Sitemap" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm text-white/45 hover:text-white font-medium transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column: Explore/Help & Brand details */}
            <div className="md:col-span-5 lg:col-span-6 flex flex-col gap-10 w-full md:pl-8 lg:pl-16 order-1 md:order-2">
              
              {/* Brand Text Stuffs (on the right - Top) */}
              <div className="flex flex-col gap-3.5 border-b border-white/5 pb-6 w-full font-sans">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.location.pathname === "/") {
                      window.location.reload();
                    } else {
                      window.location.href = "/";
                    }
                  }}
                  className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity"
                >
                  Naturalist.
                </a>
                <p className="text-[13px] sm:text-[14px] text-white/50 leading-relaxed max-w-sm font-medium">
                  Skincare rooted in nature. Crafted for those who live intentionally.
                </p>
              </div>

              {/* Explore & Help links (on the right - Bottom) */}
              <div className="grid grid-cols-2 gap-8 w-full">
                {/* Explore */}
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Explore</p>
                  <nav className="flex flex-col gap-3">
                    <Link href="/shop" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">The Shop</Link>
                    <Link href="/bundles" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">Ritual Bundles</Link>
                    <Link href="/story" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">Our Story</Link>
                    <Link href="/blog" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">Blog</Link>
                    <Link href="/sustainability" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">Sustainability</Link>
                  </nav>
                </div>

                {/* Help */}
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Help</p>
                  <nav className="flex flex-col gap-3">
                    <Link href="/faq" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">FAQ</Link>
                    <Link href="/contact" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">Contact Us</Link>
                    <Link href="/account" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">My Account</Link>
                    <Link href="/refund-policy" className="text-[15px] sm:text-base text-white/70 hover:text-[#b07e3a] transition-colors font-medium tracking-tight">Refund Policy</Link>
                  </nav>
                </div>
              </div>

            </div>

          </div>

          {/* Absolute Foot: Centralized copyright */}
          <div className="border-t border-white/5 mt-10 pt-6 text-center w-full">
            <p className="text-sm text-white/40 tracking-wide select-none">
              © {new Date().getFullYear()} Naturalist. All rights reserved.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
