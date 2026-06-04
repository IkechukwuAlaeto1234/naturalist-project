"use client";

import React, { useState, useRef, useEffect } from "react";

import { Mail, MessageSquare, Clock, ArrowRight, Loader2, CheckCircle, ChevronDown, Check } from "lucide-react";

const topics = [
  "Order & Shipping",
  "Returns & Refunds",
  "Product Questions",
  "Account Help",
  "Wholesale Enquiry",
  "Press & Media",
  "Other",
];

function TopicDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (topic: string) => {
    onChange(topic);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 ${
          open
            ? "border-[#2d4c38]/60 ring-2 ring-[#2d4c38]/40 bg-background"
            : "border-border/60 bg-background hover:border-border"
        }`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground/50"}>
          {value || "Select a topic…"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-border/60 bg-white dark:bg-[#111612] shadow-xl overflow-hidden transition-all duration-200 origin-top ${
          open ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
        }`}
        style={{ transformOrigin: "top" }}
      >
        {topics.map((topic, i) => (
          <button
            key={topic}
            type="button"
            onClick={() => handleSelect(topic)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#2d4c38]/08 dark:hover:bg-[#2d4c38]/20 hover:text-foreground ${
              value === topic
                ? "bg-[#2d4c38]/06 dark:bg-[#2d4c38]/15 text-[#2d4c38] dark:text-emerald-400 font-medium"
                : "text-foreground/80"
            } ${i !== 0 ? "border-t border-border/30" : ""}`}
          >
            <span>{topic}</span>
            {value === topic && <Check className="h-3.5 w-3.5 text-[#2d4c38] dark:text-emerald-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", otherTopic: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const showOtherField = form.topic === "Other";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleTopicChange = (val: string) => {
    setForm((prev) => ({ ...prev, topic: val, otherTopic: val !== "Other" ? "" : prev.otherTopic }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (showOtherField && !form.otherTopic.trim()) {
      setError("Please describe your topic.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          topic: form.topic,
          otherTopic: form.otherTopic,
          message: form.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit message. Please try again.");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "300px" }}>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="contactPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="20" fill="none" stroke="#b07e3a" strokeWidth="0.5" opacity="0.12" />
              <circle cx="50" cy="50" r="2" fill="#2d4c38" opacity="0.2" />
              <path d="M10 50 Q30 10 50 10 Q36 32 10 50Z" fill="#2d4c38" opacity="0.14" />
              <path d="M90 50 Q70 90 50 90 Q64 68 90 50Z" fill="#b07e3a" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#contactPattern)" />
        </svg>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-24">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">We're Listening</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}>
            Contact Us
          </h1>
          <p className="text-sm text-white/40 max-w-xs leading-relaxed mt-1">
            Our team typically responds within a few hours.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-20 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left: Info */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Get in Touch</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-2 leading-snug tracking-tight">
                One message<br />away.
              </h2>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Whether it's a question about your order, a product recommendation, or a wholesale enquiry — we read every message personally.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Mail className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">Email</p>
                  <a href="mailto:hello@naturalist.com" className="text-sm text-[#b07e3a] hover:underline mt-0.5 inline-block">hello@naturalist.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Clock className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">Response Time</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Within a few hours, Mon–Sat</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <MessageSquare className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">FAQ</p>
                  <a href="/faq" className="text-sm text-[#b07e3a] hover:underline mt-0.5 inline-flex items-center gap-1">
                    Browse common answers <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-20 px-8 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] gap-5 animate-fade-in-up">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-foreground">Message Received</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm">
                    Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within a few hours.
                  </p>
                </div>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "", otherTopic: "", message: "" }); }}
                  className="mt-2 flex h-10 items-center justify-center rounded-full border border-border px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] p-8 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name <span className="text-[#b07e3a]">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="px-4 py-3 text-sm rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email <span className="text-[#b07e3a]">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="px-4 py-3 text-sm rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                {/* Custom topic dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Topic</label>
                  <TopicDropdown value={form.topic} onChange={handleTopicChange} />
                </div>

                {/* Dynamic "Other" field — overflow switches to visible once open so border/ring aren't clipped */}
                <div
                  className="transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: showOtherField ? "110px" : "0px",
                    opacity: showOtherField ? 1 : 0,
                    overflow: showOtherField ? "visible" : "hidden",
                  }}
                >
                  <div className="flex flex-col gap-2 pt-0.5 pb-px px-px">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Describe your topic <span className="text-[#b07e3a]">*</span>
                    </label>
                    <input
                      type="text"
                      name="otherTopic"
                      value={form.otherTopic}
                      onChange={handleChange}
                      placeholder="e.g. Partnership opportunity…"
                      className="px-4 py-3 text-sm rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Message <span className="text-[#b07e3a]">*</span></label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us what's on your mind..."
                    className="px-4 py-3 text-sm rounded-xl border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all resize-none placeholder:text-muted-foreground/50"
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] px-8 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto sm:self-end"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <>Send Message <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
