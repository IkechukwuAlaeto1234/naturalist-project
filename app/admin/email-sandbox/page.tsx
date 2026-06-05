"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, RefreshCw, FileText, Layout, ShieldAlert, Sparkles, Inbox, Eye } from "lucide-react";

const TEMPLATES = [
  { id: "OTPEmail", name: "Email OTP Verification", desc: "Sent immediately after registration to verify user email address.", category: "Auth & Verification" },
  { id: "PasswordResetEmail", name: "Password Reset Passcode", desc: "Sent when a user requests a passcode reset on their profile.", category: "Auth & Verification" },
  { id: "WelcomeEmail", name: "Welcome Subscriber", desc: "Sent after account activation with a first-purchase coupon.", category: "Engagement" },
  { id: "OrderConfirmationEmail", name: "Order Confirmation", desc: "Sent right after a successful checkout to confirm purchase invoice details.", category: "E-Commerce" },
  { id: "OrderShippedEmail", name: "Order Shipped Tracking", desc: "Sent once a package is dispatched from the apothecary warehouse.", category: "E-Commerce" },
  { id: "PasswordResetSuccessEmail", name: "Password Reset Success", desc: "Sent to confirm a password was successfully changed.", category: "Security" },
  { id: "SecurityAlertEmail", name: "Security Device Alert", desc: "Sent when login is detected from an unrecognized device or IP.", category: "Security" },
  { id: "LegalUpdateEmail", name: "Legal Document Updates", desc: "Sent to notify registered users of privacy policy or term revisions.", category: "Legal" },
];

export default function EmailSandboxPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("OTPEmail");
  const [toEmail, setToEmail] = useState("ikechukwualaeto@gmail.com");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/dev/email-send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          toEmail: toEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          provider: data.provider,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to dispatch test email. Please check your credentials.",
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "A network error occurred. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const activeTemplateInfo = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] text-foreground font-sans transition-colors duration-300">
      
      {/* Premium Header */}
      <header className="border-b border-border/60 bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#2d4c38] to-[#3a6349] dark:from-[#1a2e22] dark:to-[#2d4c38] flex items-center justify-center text-white border border-[#b07e3a]/15 shadow-sm">
            <Mail className="h-5 w-5 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-black tracking-tight leading-none">Email Sandbox</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#b07e3a]" /> Template Design & Delivery Dashboard
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active Developer Mode
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
        
        {/* Left Sidebar: Template Selection */}
        <aside className="w-full lg:w-80 border-r border-border/40 bg-white/40 dark:bg-[#111714]/40 p-6 flex flex-col gap-6 flex-shrink-0">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Email Templates</h2>
            <div className="space-y-2">
              {TEMPLATES.map((t) => {
                const isActive = t.id === selectedTemplate;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      setResult(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-[#2d4c38]/5 dark:bg-emerald-500/5 border-[#2d4c38]/40 dark:border-emerald-500/20 shadow-sm"
                        : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-bold ${isActive ? "text-[#2d4c38] dark:text-emerald-400" : "text-foreground"}`}>
                        {t.name}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-muted-foreground">
                        {t.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Sandbox Container */}
        <main className="flex-1 flex flex-col xl:flex-row p-6 gap-6 min-w-0">
          
          {/* IFrame Email Preview Area (Left inside main area) */}
          <div className="flex-1 flex flex-col gap-4 bg-white/70 dark:bg-[#151c18]/70 border border-border/50 rounded-3xl p-6 shadow-sm min-w-0">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live HTML Rendering</span>
              </div>
              <span className="text-xs font-serif font-black text-foreground">{activeTemplateInfo.name}</span>
            </div>
            
            {/* Viewport Render Frame Container */}
            <div className="flex-1 min-h-[500px] border border-border/40 bg-[#fbfbf9] rounded-2xl overflow-hidden shadow-inner flex flex-col">
              <iframe
                src={`/api/dev/email-preview?template=${selectedTemplate}`}
                className="w-full flex-1 border-0"
                title="Email Template Live Rendering Window"
              />
            </div>
          </div>

          {/* Test Sender Control Panel (Right inside main area) */}
          <div className="w-full xl:w-96 flex flex-col gap-6 flex-shrink-0">
            
            {/* Delivery Testing Card */}
            <div className="bg-white/80 dark:bg-[#151c18]/80 border border-border/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#b07e3a] mb-4 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" /> Dispatch Test Delivery
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-6">
                Deliver this rendered template directly to your target inbox to inspect how the visual layout behaves on physical email clients.
              </p>

              <form onSubmit={handleSendTest} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Inbox className="h-3 w-3" /> Test Recipient Inbox
                  </label>
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-4 py-3 text-xs rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all font-medium text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending || !toEmail}
                  className="w-full flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-sm cursor-pointer select-none disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin select-none" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Test Email <Send className="h-3.5 w-3.5 select-none" />
                    </>
                  )}
                </button>
              </form>

              {/* API Result Alert Box */}
              {result && (
                <div className={`mt-5 p-4 rounded-2xl border flex gap-3 ${
                  result.success 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                    : "bg-destructive/5 border-destructive/20 text-destructive dark:text-red-400"
                }`}>
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 stroke-[2.5]" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 flex-shrink-0 stroke-[2.5]" />
                  )}
                  <div className="flex-1 flex flex-col gap-1.5 text-xs">
                    <span className="font-bold">{result.success ? "Email Dispatched" : "Delivery Error"}</span>
                    <span className="leading-relaxed opacity-90">{result.message}</span>
                    {result.provider && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 w-fit uppercase tracking-wider text-muted-foreground">
                        Provider: {result.provider}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Template Variables Card */}
            <div className="bg-white/80 dark:bg-[#151c18]/80 border border-border/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Mock Data Fields
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                The mock payload values being injected into the visual template component for this preview state:
              </p>
              
              <div className="bg-[#faf8f4] dark:bg-[#111714] border border-border/40 rounded-xl p-3.5 overflow-x-auto text-[10px] font-mono text-muted-foreground/80 leading-relaxed max-h-60">
                {selectedTemplate === "OTPEmail" && (
                  <pre>{`{\n  name: "Ikechukwu Alaeto",\n  otp: "N4TGLO"\n}`}</pre>
                )}
                {selectedTemplate === "PasswordResetEmail" && (
                  <pre>{`{\n  name: "Ikechukwu Alaeto",\n  token: "RST829"\n}`}</pre>
                )}
                {selectedTemplate === "WelcomeEmail" && (
                  <pre>{`{\n  name: "Ikechukwu Alaeto",\n  coupon: "NATURALGLOW10"\n}`}</pre>
                )}
                {selectedTemplate === "OrderConfirmationEmail" && (
                  <pre>{`{\n  orderId: "98321",\n  name: "Ikechukwu Alaeto",\n  items: [\n    { name: "Botanical Cleansing Milk", price: 29.99, quantity: 2 },\n    { name: "Squalane Nourishing Face Oil", price: 45.00, quantity: 1 }\n  ],\n  totalAmount: 104.98,\n  shippingAddress: {\n    address: "125 Main St",\n    city: "San Francisco",\n    state: "CA",\n    zipCode: "94107",\n    country: "United States"\n  }\n}`}</pre>
                )}
                {selectedTemplate === "OrderShippedEmail" && (
                  <pre>{`{\n  orderId: "98321",\n  name: "Ikechukwu Alaeto",\n  carrier: "Naturalist Eco-Courier",\n  trackingNumber: "ECO-TRACK-98321-998"\n}`}</pre>
                )}
                {selectedTemplate === "PasswordResetSuccessEmail" && (
                  <pre>{`{\n  name: "Ikechukwu Alaeto"\n}`}</pre>
                )}
                {selectedTemplate === "SecurityAlertEmail" && (
                  <pre>{`{\n  name: "Ikechukwu Alaeto",\n  device: "Chrome 124 on Windows 11",\n  location: "Lagos, Nigeria",\n  time: "June 4, 2026, 4:28 PM",\n  ipAddress: "197.210.64.218"\n}`}</pre>
                )}
                {selectedTemplate === "LegalUpdateEmail" && (
                  <pre>{`{\n  name: "Ikechukwu Alaeto",\n  documentName: "Terms of Service & Privacy Statement",\n  updateDate: "June 15, 2026",\n  changesSummary: "We have revised our data storage clauses to comply with global e-commerce and cookie preference directives."\n}`}</pre>
                )}
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
