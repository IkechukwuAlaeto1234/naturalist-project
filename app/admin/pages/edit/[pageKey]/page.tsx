"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Save, Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  ExternalLink, Plus, Trash2, RefreshCw, Upload, Link2,
  AlertTriangle, ChevronUp, ChevronDown, List, AlignLeft,
} from "lucide-react";
import { proxyCloudinaryUrl } from "@/lib/utils";
import ErrorModal from "@/components/ui/ErrorModal";
import SuccessModal from "@/components/ui/SuccessModal";

/* ─── Page Config ─────────────────────────────────────────────── */
const PAGE_CONFIGS: Record<string, { label: string; path: string; fields: FieldConfig[] }> = {
  home: {
    label: "Home Page",
    path: "/",
    fields: [
      { key: "heroBadge", label: "Hero Badge Text", type: "text", placeholder: "The Skin Ritual Revolution", description: "Small tag text shown above the main title on the home hero (e.g. 'The Skin Ritual Revolution')." },
      { key: "heroHeadline", label: "Hero Headline", type: "textarea", placeholder: "Pure Botanicals.\nModern Efficacy.", description: "Main bold title of the homepage hero section. You can press Enter to split it into two lines." },
      { key: "heroSubtext", label: "Hero Subtext", type: "textarea", placeholder: "Formulated with high-efficacy, wild-harvested white sage, bakuchiol, and organic seaweed to unleash your skin's natural radiance.", description: "Paragraph text below the hero headline detailing the brand's primary values." },
      { key: "heroPrimaryCta", label: "Primary CTA Text", type: "text", placeholder: "Shop All Rituals", description: "Label for the main Call-to-Action button on the hero (links to the Shop)." },
      { key: "heroSecondaryCta", label: "Secondary CTA Text", type: "text", placeholder: "Our Botanical Ethos", description: "Label for the secondary outlined button on the hero (links to Our Story)." },
      { key: "heroImage", label: "Hero Image", type: "image", placeholder: "", description: "The editorial showcase image displayed on the right-hand side of the homepage hero." },
      { key: "sectionBadge", label: "Standards Section Badge", type: "text", placeholder: "Formulation Ethos", description: "Small uppercase tag text shown above the brand standard headline." },
      { key: "sectionHeadline", label: "Standards Section Headline", type: "text", placeholder: "The Naturalist Standard", description: "Main title of the brand standards section." },
      { key: "sectionSubtext", label: "Standards Section Subtext", type: "textarea", placeholder: "Experience organic beauty crafted with absolute precision. High efficacy meets planet-first preservation.", description: "Summary text explaining our formulation and responsibility standards." },
      { key: "feature1Title", label: "Feature 1 Title", type: "text", placeholder: "Wild-Harvested", description: "Title for the 1st brand standard feature card." },
      { key: "feature1Body", label: "Feature 1 Description", type: "textarea", placeholder: "Distilled entirely from organic, raw botanicals sourced responsibly from their native habitats.", description: "Detailed description text for the 1st brand standard card." },
      { key: "feature2Title", label: "Feature 2 Title", type: "text", placeholder: "Clinical Efficacy", description: "Title for the 2nd brand standard feature card." },
      { key: "feature2Body", label: "Feature 2 Description", type: "textarea", placeholder: "Scientific concentrations of active botanical acids designed to nourish and regenerate skin cells.", description: "Detailed description text for the 2nd brand standard card." },
      { key: "feature3Title", label: "Feature 3 Title", type: "text", placeholder: "Total Transparency", description: "Title for the 3rd brand standard feature card." },
      { key: "feature3Body", label: "Feature 3 Description", type: "textarea", placeholder: "Every single batch undergoes rigorous dermatological checks. 100% vegan, clean, and cruelty-free.", description: "Detailed description text for the 3rd brand standard card." },
      { key: "feature4Title", label: "Feature 4 Title", type: "text", placeholder: "Eco-Conscious Packaging", description: "Title for the 4th brand standard feature card." },
      { key: "feature4Body", label: "Feature 4 Description", type: "textarea", placeholder: "Presented exclusively in recyclable glass bottles and organic wood caps. Never any single-use plastics.", description: "Detailed description text for the 4th brand standard card." },
      { key: "philosophyBadge", label: "Philosophy Section Badge", type: "text", placeholder: "Our Commitment", description: "Small uppercase tag text shown above the brand philosophy headline." },
      { key: "philosophyHeadline", label: "Philosophy Headline", type: "textarea", placeholder: "Nourish Your Body.\nRespect Our Planet.", description: "Main bold headline of the philosophy section." },
      { key: "philosophyQuote", label: "Philosophy Quote", type: "textarea", placeholder: "We believe that beauty is formed through pure, natural balance. That's why we source our white sage, aloe, and seaweed from local wild farms, utilizing zero-waste packaging to ensure your beauty ritual is perfectly in harmony with nature.", description: "A quote summarizing the brand's core mission and commitment." },
      { key: "philosophyAttribution", label: "Philosophy Attribution", type: "text", placeholder: "The Naturalist Ethos", description: "The source or author of the philosophy quote." },
      { key: "philosophyImage", label: "Philosophy Section Image", type: "image", placeholder: "", description: "An optional support image displayed for the philosophy section." },
    ],
  },
  shop: {
    label: "Shop Page",
    path: "/shop",
    fields: [
      { key: "heroBadge", label: "Hero Badge Text", type: "text", placeholder: "Our Collection", description: "Small tag text shown above the main shop page title." },
      { key: "heroHeadline", label: "Hero Headline", type: "text", placeholder: "The Shop", description: "The main title displayed on the shop page hero." },
      { key: "heroSubtext", label: "Hero Subtext", type: "textarea", placeholder: "Every formula, every ritual — crafted from wild-harvested botanicals.", description: "Paragraph description text displayed on the shop page hero." },
      { key: "heroImage", label: "Hero Background Image", type: "image", placeholder: "", description: "An optional background image displayed inside the shop page hero section." },
      { key: "emptyStateTitle", label: "Empty State Title", type: "text", placeholder: "Garden Under Cultivation", description: "The headline shown when no products match the selected category." },
      { key: "emptyStateBody", label: "Empty State Message", type: "textarea", placeholder: "No products match your current filter. Our active botanical formulas are currently being freshly distilled and prepared.", description: "The body text shown when no products match the selected category." },
    ],
  },
  bundles: {
    label: "Ritual Bundles",
    path: "/bundles",
    fields: [
      { key: "heroBadge", label: "Hero Badge Text", type: "text", placeholder: "Curated Sets", description: "Small tag text shown above the bundles page title." },
      { key: "heroHeadline", label: "Hero Headline", type: "text", placeholder: "Ritual Bundles", description: "The main title displayed on the bundles page hero." },
      { key: "heroSubtext", label: "Hero Subtext", type: "textarea", placeholder: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.", description: "Paragraph description text displayed on the bundles page hero." },
      { key: "heroImage", label: "Hero Background Image", type: "image", placeholder: "", description: "An optional background image displayed inside the bundles page hero section." },
    ],
  },
  story: {
    label: "Our Story",
    path: "/story",
    fields: [
      { key: "heroBadge", label: "Hero Badge Text", type: "text", placeholder: "The Naturalist Origin", description: "Small tag text shown above the story page title." },
      { key: "heroHeadline", label: "Hero Headline", type: "text", placeholder: "Our Story", description: "The main title displayed on the story page hero." },
      { key: "heroSubtext", label: "Hero Subtext", type: "textarea", placeholder: "Built on the belief that pure is powerful — and that skin deserves honesty.", description: "Paragraph description text displayed on the story page hero." },
      { key: "heroImage", label: "Hero Background Image", type: "image", placeholder: "", description: "An optional background image displayed inside the story page hero section." },
      { key: "openingQuote", label: "Opening Quote", type: "textarea", placeholder: "We started because we couldn't find a single skincare brand that told us the whole truth.", description: "A prominent quote introducing the founders' philosophy on the story page." },
      { key: "openingAttribution", label: "Quote Attribution", type: "text", placeholder: "— Founders, Naturalist", description: "Attribution text below the opening quote." },
      { key: "openingBody", label: "Opening Body Paragraph", type: "textarea", placeholder: "Every bottle on the market had a story — an aspirational pastoral image, a celebrity endorsement, a word like \"natural\" printed next to an ingredient list that read like a chemistry exam. We decided to build something different: a brand where the ingredient list is the whole point, and every botanical has a traceable origin.", description: "The detailed narrative paragraph text explaining the origin of Naturalist." },
      { key: "openingImage", label: "Opening Section Image", type: "image", placeholder: "", description: "An optional centered illustration or founders photo displayed below the opening quote." },
      { key: "timelineSectionBadge", label: "Timeline Section Badge", type: "text", placeholder: "How We Got Here", description: "Small tag text shown above the timeline milestones headline." },
      { key: "timelineSectionHeadline", label: "Timeline Section Headline", type: "text", placeholder: "Five Years, One Standard", description: "Main headline of the timeline milestones section." },
      { key: "milestones", label: "Timeline Milestones", type: "milestones", placeholder: "", description: "Chronological milestones tracking key historical brand events." },
      { key: "valuesSectionBadge", label: "Values Section Badge", type: "text", placeholder: "What Drives Us", description: "Small tag text shown above the brand values headline." },
      { key: "valuesSectionHeadline", label: "Values Section Headline", type: "text", placeholder: "Our Founding Principles", description: "Main headline of the brand values section." },
      { key: "values", label: "Brand Values", type: "values", placeholder: "", description: "Brand values items showcasing key founding principles." },
      { key: "ctaBadge", label: "CTA Badge Text", type: "text", placeholder: "Ready to Begin?", description: "Small tag text shown above the bottom CTA headline." },
      { key: "ctaHeadline", label: "CTA Headline", type: "text", placeholder: "Experience the Ritual.", description: "Main headline of the story page bottom CTA block." },
      { key: "ctaSubtext", label: "CTA Subtext", type: "textarea", placeholder: "Every product is an extension of this story. Small batch. Third-party tested. Botanically honest.", description: "Body text inside the story page bottom CTA block." },
      { key: "ctaImage", label: "CTA Background Image", type: "image", placeholder: "", description: "An optional background image displayed inside the story page bottom CTA block." },
    ],
  },
  sustainability: {
    label: "Sustainability",
    path: "/sustainability",
    fields: [
      { key: "heroBadge", label: "Hero Badge Text", type: "text", placeholder: "Planet First", description: "Small tag text shown above the sustainability page title." },
      { key: "heroHeadline", label: "Hero Headline", type: "text", placeholder: "Sustainability", description: "The main title displayed on the sustainability page hero." },
      { key: "heroSubtext", label: "Hero Subtext", type: "textarea", placeholder: "Our pledge to the planet that grows our ingredients — and the closed loop cycle that protects it.", description: "Paragraph description text displayed on the sustainability page hero." },
      { key: "heroImage", label: "Hero Background Image", type: "image", placeholder: "", description: "An optional background image displayed inside the sustainability page hero section." },
      { key: "pillarsSectionBadge", label: "Pillars Section Badge", type: "text", placeholder: "Our Commitments", description: "Small tag text shown above the sustainability commitments headline." },
      { key: "pillarsSectionHeadline", label: "Pillars Section Headline", type: "text", placeholder: "Four Pillars of Responsibility", description: "Main headline of the sustainability commitments section." },
      { key: "pillars", label: "Sustainability Pillars", type: "pillars", placeholder: "", description: "The four pillars of ecological and social responsibility." },
      { key: "stat1Value", label: "Stat 1 Value", type: "text", placeholder: "100%", description: "Numeric value of the 1st sustainability statistic (e.g. '100%')." },
      { key: "stat1Label", label: "Stat 1 Label", type: "text", placeholder: "Organic Botanicals", description: "Label describing the 1st sustainability statistic (e.g. 'Organic Botanicals')." },
      { key: "stat2Value", label: "Stat 2 Value", type: "text", placeholder: "0", description: "Numeric value of the 2nd sustainability statistic (e.g. '0')." },
      { key: "stat2Label", label: "Stat 2 Label", type: "text", placeholder: "Single-Use Plastics", description: "Label describing the 2nd sustainability statistic (e.g. 'Single-Use Plastics')." },
      { key: "stat3Value", label: "Stat 3 Value", type: "text", placeholder: "92%", description: "Numeric value of the 3rd sustainability statistic (e.g. '92%')." },
      { key: "stat3Label", label: "Stat 3 Label", type: "text", placeholder: "Water Recycled", description: "Label describing the 3rd sustainability statistic (e.g. 'Water Recycled')." },
      { key: "stat4Value", label: "Stat 4 Value", type: "text", placeholder: "40+", description: "Numeric value of the 4th sustainability statistic (e.g. '40+')." },
      { key: "stat4Label", label: "Stat 4 Label", type: "text", placeholder: "Countries Served", description: "Label describing the 4th sustainability statistic (e.g. 'Countries Served')." },
      { key: "ctaSectionBadge", label: "CTA Section Badge", type: "text", placeholder: "Customer Care", description: "Small tag text shown above the bottom care headline." },
      { key: "ctaHeadline", label: "CTA Headline", type: "text", placeholder: "Questions about returns?", description: "Main headline of the bottom care section." },
      { key: "ctaSubtext", label: "CTA Subtext", type: "textarea", placeholder: "We stand behind every formula. If it doesn't work for you, we make it right — no questions asked.", description: "Body text inside the bottom care section detailing return policies." },
    ],
  },
  blog: {
    label: "Blog Page",
    path: "/blog",
    fields: [
      { key: "heroBadge", label: "Hero Badge Text", type: "text", placeholder: "Rituals & Stories", description: "Small tag text shown above the blog page title." },
      { key: "heroHeadline", label: "Hero Headline", type: "text", placeholder: "Our Journal", description: "The main title displayed on the blog page hero." },
      { key: "heroSubtext", label: "Hero Subtext", type: "textarea", placeholder: "Fresh editorial notes from the Naturalist team. Thoughtful ingredients, practical rituals, and a calm reading experience.", description: "Paragraph description text displayed on the blog page hero." },
      { key: "heroImage", label: "Hero Background Image", type: "image", placeholder: "", description: "An optional background image displayed inside the blog page hero section." },
      { key: "emptyStateText", label: "Empty State Text", type: "text", placeholder: "No blog posts have been published yet.", description: "The text shown when no blog journal posts have been published yet." },
    ],
  },
  "privacy-policy": {
    label: "Privacy Policy",
    path: "/privacy-policy",
    fields: [
      { key: "effectiveDate", label: "Effective Date", type: "text", placeholder: "May 31, 2026", description: "Effective date displayed at the top of the policy." },
      { key: "title", label: "Page Title", type: "text", placeholder: "Privacy Policy", description: "Main page title." },
      { key: "subtitle", label: "Page Subtitle", type: "text", placeholder: "Our commitment to your privacy and the security of your personal data.", description: "Subtext shown below the title." },
      { key: "sections", label: "Policy Sections", type: "sections", placeholder: "", description: "Add, edit, or reorder privacy policy text sections." },
    ],
  },
  "terms": {
    label: "Terms of Service",
    path: "/terms",
    fields: [
      { key: "effectiveDate", label: "Effective Date", type: "text", placeholder: "May 31, 2026", description: "Effective date displayed at the top of the terms." },
      { key: "title", label: "Page Title", type: "text", placeholder: "Terms of Service", description: "Main page title." },
      { key: "subtitle", label: "Page Subtitle", type: "text", placeholder: "The rules, guidelines, and agreements governing your use of our shop.", description: "Subtext shown below the title." },
      { key: "sections", label: "Terms Sections", type: "sections", placeholder: "", description: "Add, edit, or reorder terms of service text sections." },
    ],
  },
  "cookie-policy": {
    label: "Cookie Policy",
    path: "/cookie-policy",
    fields: [
      { key: "effectiveDate", label: "Effective Date", type: "text", placeholder: "May 31, 2026", description: "Effective date displayed at the top of the policy." },
      { key: "title", label: "Page Title", type: "text", placeholder: "Cookie Policy", description: "Main page title." },
      { key: "subtitle", label: "Page Subtitle", type: "text", placeholder: "How we use cookies and other technologies to improve your experience.", description: "Subtext shown below the title." },
      { key: "sections", label: "Cookie Sections", type: "sections", placeholder: "", description: "Add, edit, or reorder cookie policy text sections." },
    ],
  },
  "refund-policy": {
    label: "Refund Policy",
    path: "/refund-policy",
    fields: [
      { key: "effectiveDate", label: "Effective Date", type: "text", placeholder: "May 31, 2026", description: "Effective date displayed at the top of the policy." },
      { key: "title", label: "Page Title", type: "text", placeholder: "Refund Policy", description: "Main page title." },
      { key: "subtitle", label: "Page Subtitle", type: "text", placeholder: "Our return, exchange, and refund guarantees.", description: "Subtext shown below the title." },
      { key: "sections", label: "Refund Sections", type: "sections", placeholder: "", description: "Add, edit, or reorder refund policy text sections." },
    ],
  },
};

type FieldType = "text" | "textarea" | "image" | "milestones" | "values" | "pillars" | "sections";

interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  description?: string;
}
interface Milestone { year: string; title: string; body: string; image?: string; }
interface ValueItem { label: string; body: string; }
interface PillarItem { title: string; body: string; }
interface LegalSection { heading: string; body: string; }
type MetadataValue = string | Milestone[] | ValueItem[] | PillarItem[] | LegalSection[];

/* ─── Shared ImageField component ────────────────────────────── */
// Handles: file upload → Cloudinary, external URL paste → auto-proxy,
// and shows a warning badge when the current URL is from an external host.

function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [urlInput, setUrlInput] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [proxying, setProxying] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isExternal =
    !!urlInput &&
    !urlInput.startsWith("/cdn/") &&
    !urlInput.includes("res.cloudinary.com") &&
    !urlInput.startsWith("/") &&
    !urlInput.startsWith("data:");

  // Keep url input in sync with parent value changes (e.g. on load)
  useEffect(() => { setUrlInput(value || ""); }, [value]);

  const commitUrl = (url: string) => {
    setUrlInput(url);
    onChange(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "naturalist/pages" }),
      });
      if (!sigRes.ok) throw new Error("Could not get upload signature");
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("signature", signature);
      fd.append("timestamp", String(timestamp));
      fd.append("folder", "naturalist/pages");

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: fd,
      });
      if (!upRes.ok) throw new Error("CDN upload failed");
      const upData = await upRes.json();
      const proxied = proxyCloudinaryUrl(upData.secure_url);
      commitUrl(proxied);

      // Log in CDN registry
      await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: proxied,
          publicId: upData.public_id,
          originalName: file.name,
          sizeBytes: file.size,
        }),
      }).catch(() => {});
    } catch (err: any) {
      const errMsg = err.message || "Upload failed";
      setUploadErr(errMsg);
      setModalMsg(errMsg);
      setModalOpen(true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleProxyExternalUrl = async () => {
    if (!urlInput || !isExternal) return;
    setProxying(true);
    setUploadErr("");
    try {
      const res = await fetch("/api/admin/content/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Proxy failed");
      }
      const { url, publicId } = await res.json();
      const proxied = proxyCloudinaryUrl(url);
      commitUrl(proxied);

      // Log in CDN registry
      await fetch("/api/admin/cdn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: proxied,
          publicId: publicId,
          originalName: urlInput.split("/").pop() || "proxied_image",
          sizeBytes: 0,
        }),
      }).catch(() => {});
    } catch (err: any) {
      const errMsg = err.message || "Could not re-host this image. Try downloading and uploading manually.";
      setUploadErr(errMsg);
      setModalMsg(errMsg);
      setModalOpen(true);
    } finally {
      setProxying(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preview */}
      {urlInput && (
        <div className="relative rounded-xl overflow-hidden border border-[#1a241e] bg-[#070908]" style={{ maxHeight: "220px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlInput}
            alt="Preview"
            className="w-full object-cover"
            style={{ maxHeight: "220px" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {isExternal && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-amber-500/90 text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
              <AlertTriangle className="h-3 w-3" /> External — click &ldquo;Move to CDN&rdquo;
            </div>
          )}
        </div>
      )}

      {/* URL input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4a5c50]" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); onChange(e.target.value); }}
            placeholder="Paste image URL or upload a file →"
            className="w-full pl-8 pr-3 py-2.5 bg-[#070908] border border-[#1a241e] rounded-xl text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors"
          />
        </div>
        {/* File upload button */}
        <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#1a241e] bg-[#070908] text-[#a3b2a9] hover:text-white hover:border-[#b07e3a]/40 text-xs font-bold cursor-pointer transition-all flex-shrink-0">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Upload</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* External URL warning + Move to CDN button */}
      {isExternal && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-semibold leading-tight">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>External image — may not display on public pages. Move to your CDN.</span>
          </div>
          <button
            type="button"
            onClick={handleProxyExternalUrl}
            disabled={proxying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 disabled:opacity-60"
          >
            {proxying ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Move to CDN
          </button>
        </div>
      )}

      {uploadErr && (
        <p className="text-[10px] text-red-400 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 flex-shrink-0" /> {uploadErr}
        </p>
      )}

      {/* Clean error modal popup */}
      <ErrorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Image Upload Failed"
        message={modalMsg}
        actionText="Close"
      />
    </div>
  );
}

/* ─── Array Field Sub-Components ─────────────────────────────── */

function MilestonesEditor({ value, onChange }: { value: Milestone[]; onChange: (v: Milestone[]) => void }) {
  const add = () => onChange([...value, { year: "", title: "", body: "", image: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Milestone, val: string) => {
    const next = [...value]; next[i] = { ...next[i], [field]: val }; onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {value.map((m, i) => (
        <div key={i} className="rounded-xl border border-[#1a241e] bg-white/[0.01] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Milestone {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={m.year} onChange={(e) => update(i, "year", e.target.value)} placeholder="Year (e.g. 2021)" className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />
            <input type="text" value={m.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Milestone title" className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />
          </div>
          <textarea value={m.body} onChange={(e) => update(i, "body", e.target.value)} placeholder="Milestone description..." rows={2} className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none" />
          <div>
            <p className="text-[10px] text-[#a3b2a9] mb-2 uppercase tracking-wider font-bold">Milestone Image (optional)</p>
            <ImageField value={m.image || ""} onChange={(v) => update(i, "image", v)} />
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#b07e3a]/40 text-xs font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all w-fit">
        <Plus className="h-3.5 w-3.5" /> Add Milestone
      </button>
    </div>
  );
}

function ValuesEditor({ value, onChange }: { value: ValueItem[]; onChange: (v: ValueItem[]) => void }) {
  const add = () => onChange([...value, { label: "", body: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ValueItem, val: string) => {
    const next = [...value]; next[i] = { ...next[i], [field]: val }; onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {value.map((v, i) => (
        <div key={i} className="rounded-xl border border-[#1a241e] bg-white/[0.01] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Value {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <input type="text" value={v.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="Value name" className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />
          <textarea value={v.body} onChange={(e) => update(i, "body", e.target.value)} placeholder="Value description..." rows={2} className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none" />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#b07e3a]/40 text-xs font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all w-fit"><Plus className="h-3.5 w-3.5" /> Add Value</button>
    </div>
  );
}

function PillarsEditor({ value, onChange }: { value: PillarItem[]; onChange: (v: PillarItem[]) => void }) {
  const add = () => onChange([...value, { title: "", body: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof PillarItem, val: string) => {
    const next = [...value]; next[i] = { ...next[i], [field]: val }; onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {value.map((p, i) => (
        <div key={i} className="rounded-xl border border-[#1a241e] bg-white/[0.01] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Pillar {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <input type="text" value={p.title} onChange={(e) => update(i, "title", e.target.value)} placeholder="Pillar title" className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />
          <textarea value={p.body} onChange={(e) => update(i, "body", e.target.value)} placeholder="Pillar description..." rows={2} className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none" />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#b07e3a]/40 text-xs font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all w-fit"><Plus className="h-3.5 w-3.5" /> Add Pillar</button>
    </div>
  );
}

// ─── SectionsEditor — upgraded ────────────────────────────────────────────────
// Supports:  move up/down  |  bullet-list toggle  |  delete
// Body storage:
//   paragraph mode → string  (stored as-is)
//   bullet mode    → string[] (each textarea line = one bullet)
//   The PDF renderer already handles both via Array.isArray(body).

function parseSectionBody(raw: string | string[]): { isBullet: boolean; text: string } {
  if (Array.isArray(raw)) return { isBullet: true, text: raw.join("\n") };
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { isBullet: true, text: parsed.join("\n") };
    } catch {}
  }
  return { isBullet: false, text: typeof raw === "string" ? raw : "" };
}

function serializeSectionBody(text: string, isBullet: boolean): string | string[] {
  if (!isBullet) return text;
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function SectionsEditor({ value, onChange }: { value: LegalSection[]; onChange: (v: LegalSection[]) => void }) {
  const [bulletModes, setBulletModes] = React.useState<boolean[]>(() =>
    value.map((s) => parseSectionBody(s.body).isBullet)
  );
  const [textBuffers, setTextBuffers] = React.useState<string[]>(() =>
    value.map((s) => parseSectionBody(s.body).text)
  );

  React.useEffect(() => {
    setBulletModes((prev) => {
      const next = [...prev];
      while (next.length < value.length) next.push(false);
      return next.slice(0, value.length);
    });
    setTextBuffers((prev) => {
      const next = [...prev];
      while (next.length < value.length) next.push("");
      return next.slice(0, value.length);
    });
  }, [value.length]);

  const commit = (i: number, heading: string, text: string, isBullet: boolean) => {
    const next = [...value];
    next[i] = { heading, body: serializeSectionBody(text, isBullet) as string };
    onChange(next);
  };

  const updateHeading = (i: number, heading: string) =>
    commit(i, heading, textBuffers[i] ?? "", bulletModes[i] ?? false);

  const updateBody = (i: number, text: string) => {
    const next = [...textBuffers]; next[i] = text; setTextBuffers(next);
    commit(i, value[i]?.heading ?? "", text, bulletModes[i] ?? false);
  };

  const toggleBullet = (i: number) => {
    const next = [...bulletModes]; next[i] = !next[i]; setBulletModes(next);
    commit(i, value[i]?.heading ?? "", textBuffers[i] ?? "", next[i]);
  };

  const swap = (a: number, b: number) => {
    const nv = [...value], nb = [...bulletModes], nt = [...textBuffers];
    [nv[a], nv[b]] = [nv[b], nv[a]];
    [nb[a], nb[b]] = [nb[b], nb[a]];
    [nt[a], nt[b]] = [nt[b], nt[a]];
    setBulletModes(nb); setTextBuffers(nt); onChange(nv);
  };

  const remove = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
    setBulletModes((p) => p.filter((_, idx) => idx !== i));
    setTextBuffers((p) => p.filter((_, idx) => idx !== i));
  };

  const add = () => {
    onChange([...value, { heading: "", body: "" }]);
    setBulletModes((p) => [...p, false]);
    setTextBuffers((p) => [...p, ""]);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.map((s, i) => (
        <div key={i} className="rounded-xl border border-[#1a241e] bg-white/[0.01] p-4 flex flex-col gap-3">

          {/* Header row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] flex-1">
              Section {i + 1}
            </span>
            {/* Move up */}
            <button type="button" onClick={() => swap(i, i - 1)} disabled={i === 0} title="Move up"
              className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/[0.03] border border-[#1a241e] text-[#a3b2a9] hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronUp className="h-3 w-3" />
            </button>
            {/* Move down */}
            <button type="button" onClick={() => swap(i, i + 1)} disabled={i === value.length - 1} title="Move down"
              className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/[0.03] border border-[#1a241e] text-[#a3b2a9] hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronDown className="h-3 w-3" />
            </button>
            {/* Bullet toggle */}
            <button type="button" onClick={() => toggleBullet(i)}
              title={bulletModes[i] ? "Switch to paragraph" : "Switch to bullet list"}
              className={`h-6 px-2 flex items-center gap-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                bulletModes[i]
                  ? "bg-[#b07e3a]/15 border-[#b07e3a]/40 text-[#b07e3a]"
                  : "bg-white/[0.03] border-[#1a241e] text-[#4a5c50] hover:text-[#a3b2a9] hover:border-[#2a3a2e]"
              }`}>
              {bulletModes[i] ? <><List className="h-3 w-3" /><span>Bullets</span></> : <><AlignLeft className="h-3 w-3" /><span>Para</span></>}
            </button>
            {/* Delete */}
            <button type="button" onClick={() => remove(i)} title="Remove section"
              className="h-6 w-6 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Heading */}
          <input type="text" value={s.heading} onChange={(e) => updateHeading(i, e.target.value)}
            placeholder="Section heading (e.g. 1. Acceptance of Terms)"
            className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />

          {/* Body */}
          <div className="flex flex-col gap-1">
            <textarea value={textBuffers[i] ?? ""} onChange={(e) => updateBody(i, e.target.value)}
              rows={bulletModes[i] ? 5 : 4}
              placeholder={bulletModes[i]
                ? "One bullet point per line.\nEach line becomes a separate bullet in the PDF."
                : "Section body — renders as a paragraph in the PDF."}
              className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none leading-relaxed" />
            {bulletModes[i] && (
              <p className="text-[10px] text-[#4a5c50] leading-relaxed pl-0.5">
                Each non-blank line = one bullet. PDF renders these with green dots.
              </p>
            )}
          </div>
        </div>
      ))}

      <button type="button" onClick={add}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#b07e3a]/40 text-xs font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all w-fit">
        <Plus className="h-3.5 w-3.5" /> Add Section
      </button>
    </div>
  );
}

/* ─── Main Page Editor ───────────────────────────────────────── */

function formatAndValidateDate(dateStr: string): { isValid: boolean; formatted?: string; error?: string } {
  if (!dateStr || !dateStr.trim()) {
    return { isValid: false, error: "Effective date cannot be empty." };
  }
  const cleanStr = dateStr.trim();
  const parsedTime = Date.parse(cleanStr);
  if (isNaN(parsedTime)) {
    return { isValid: false, error: "Invalid date format. Please use a format like 'May 31, 2026' or '2026-05-31'." };
  }
  const date = new Date(parsedTime);
  
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
  ];
  const tokens = cleanStr.toLowerCase().replace(/,/g, "").split(/\s+/);
  let inputDay: number | null = null;
  let inputMonthIdx: number | null = null;
  let inputYear: number | null = null;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const num = parseInt(token, 10);
      if (num > 31) {
        inputYear = num;
      } else if (inputDay === null) {
        inputDay = num;
      } else {
        inputYear = num;
      }
    } else {
      const idx = months.indexOf(token);
      if (idx !== -1) {
        inputMonthIdx = idx % 12;
      }
    }
  }

  if (inputMonthIdx !== null && inputDay !== null) {
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const year = inputYear || date.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (inputMonthIdx === 1 && isLeap) {
      daysInMonths[1] = 29;
    }
    if (inputDay < 1 || inputDay > daysInMonths[inputMonthIdx]) {
      return { isValid: false, error: `Invalid date: ${cleanStr}. That month does not have ${inputDay} days.` };
    }
  }

  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return { isValid: true, formatted };
}

export default function PageEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs text-[#a3b2a9] uppercase tracking-wider">Loading editor layout…</p>
      </div>
    }>
      <PageEditorContent />
    </Suspense>
  );
}

function PageEditorContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageKey = params?.pageKey as string;
  const config = PAGE_CONFIGS[pageKey];

  const restoreVersionId = searchParams ? searchParams.get("restoreVersionId") : null;

  const [formData, setFormData] = useState<Record<string, MetadataValue>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  // Versioning state controls
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [versionNote, setVersionNote] = useState("");

  // Restore banner info state
  const [restoreBannerInfo, setRestoreBannerInfo] = useState<{ savedAt: Date; note?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSuccess = sessionStorage.getItem("page_save_success");
      if (savedSuccess) {
        setSuccessModalOpen(true);
        sessionStorage.removeItem("page_save_success");
      }
    }
  }, []);

  const initDefaults = useCallback((): Record<string, MetadataValue> => {
    if (!config) return {};
    const defaults: Record<string, MetadataValue> = {};
    for (const field of config.fields) {
      if (field.type === "milestones") defaults[field.key] = [];
      else if (field.type === "values") defaults[field.key] = [];
      else if (field.type === "pillars") defaults[field.key] = [];
      else if (field.type === "sections") defaults[field.key] = [];
      else defaults[field.key] = "";
    }
    return defaults;
  }, [config]);

  useEffect(() => {
    if (!config) return;
    setLoading(true);
    fetch(`/api/admin/content?key=${pageKey}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const defaults = initDefaults();
        let activeMetadata = data?.metadata || {};
        
        if (restoreVersionId && data?.versions) {
          const matchedVersion = data.versions.find((v: any) => v._id === restoreVersionId);
          if (matchedVersion) {
            activeMetadata = matchedVersion.metadata || {};
            setRestoreBannerInfo({
              savedAt: new Date(matchedVersion.savedAt),
              note: matchedVersion.note,
            });
          }
        }

        const merged = { ...defaults };
        for (const key of Object.keys(activeMetadata)) {
          const val = activeMetadata[key];
          if (val !== undefined && val !== null && val !== "") {
            merged[key] = val;
          }
        }
        setFormData(merged);
      })
      .catch(() => setFormData(initDefaults()))
      .finally(() => setLoading(false));
  }, [pageKey, config, initDefaults, restoreVersionId]);

  const handleChange = (key: string, value: MetadataValue) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError("");

    // Validate effectiveDate if present
    const nextFormData = { ...formData };
    if (nextFormData.effectiveDate !== undefined && nextFormData.effectiveDate !== null) {
      const dateVal = String(nextFormData.effectiveDate).trim();
      if (dateVal === "") {
        nextFormData.effectiveDate = "May 31, 2026";
      } else {
        const validation = formatAndValidateDate(dateVal);
        if (!validation.isValid) {
          setError(validation.error || "Invalid date.");
          setSaving(false);
          return;
        }
        nextFormData.effectiveDate = validation.formatted!;
      }
    }

    setFormData(nextFormData);

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: pageKey,
          title: config.label,
          body: "",
          metadata: nextFormData,
          isNewVersion,
          versionNote: versionNote.trim() || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save"); }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("page_save_success", "true");
        window.location.reload();
      } else {
        setSavedAt(new Date());
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-white font-serif text-xl">Unknown page key: {pageKey}</p>
        <button onClick={() => router.push("/admin/pages")} className="text-xs text-[#b07e3a] hover:underline">← Back to Page List</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <button onClick={() => router.push("/admin/pages")} className="flex items-center gap-1.5 text-xs text-[#a3b2a9] hover:text-white mb-3 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> All Pages
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Editing</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">{config.label}</h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href={config.path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white border border-[#1a241e] px-4 py-2 rounded-full hover:bg-white/5 transition-all">
            Preview <ExternalLink className="h-3 w-3" />
          </a>
          <button onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#b07e3a] hover:bg-[#9a6e30] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Status */}
      {savedAt && !error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Saved at {savedAt.toLocaleTimeString()} — changes are live.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Restore Banner Info */}
      {restoreBannerInfo && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-semibold leading-relaxed">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500 animate-pulse" />
            <span>
              Restored snapshot from {restoreBannerInfo.savedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {restoreBannerInfo.savedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              {restoreBannerInfo.note ? ` (${restoreBannerInfo.note})` : ""}. Click &ldquo;Save All Changes&rdquo; below to publish.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              router.replace(`/admin/pages/edit/${pageKey}`);
            }}
            className="text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400 hover:underline cursor-pointer flex-shrink-0"
          >
            Revert to Active Live
          </button>
        </div>
      )}

      {/* Form */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] uppercase tracking-wider">Loading content…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {config.fields.map((field) => (
            <div key={field.key} className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9]">{field.label}</label>
                {field.description && (
                  <p className="text-[10px] text-[#4a5c50] mt-1 leading-normal">{field.description}</p>
                )}
              </div>

              {field.type === "text" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(formData[field.key] as string) || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#070908] border border-[#1a241e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors"
                  />
                  {field.key === "effectiveDate" && (
                    <button
                      type="button"
                      onClick={() => {
                        const todayFormatted = new Date().toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        });
                        handleChange(field.key, todayFormatted);
                      }}
                      className="px-4 py-3 bg-[#131a15] hover:bg-[#1a241e] border border-[#1a241e] rounded-xl text-xs font-bold text-[#b07e3a] hover:text-[#d4a362] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Set to Today
                    </button>
                  )}
                </div>
              )}
              {field.type === "textarea" && (
                <textarea value={(formData[field.key] as string) || ""} onChange={(e) => handleChange(field.key, e.target.value)} placeholder={field.placeholder} rows={3} className="bg-[#070908] border border-[#1a241e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors resize-none leading-relaxed" />
              )}
              {field.type === "image" && (
                <ImageField value={(formData[field.key] as string) || ""} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.type === "milestones" && (
                <MilestonesEditor value={(formData[field.key] as Milestone[]) || []} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.type === "values" && (
                <ValuesEditor value={(formData[field.key] as ValueItem[]) || []} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.type === "pillars" && (
                <PillarsEditor value={(formData[field.key] as PillarItem[]) || []} onChange={(v) => handleChange(field.key, v)} />
              )}
              {field.type === "sections" && (
                <SectionsEditor value={(formData[field.key] as LegalSection[]) || []} onChange={(v) => handleChange(field.key, v)} />
              )}

              {field.placeholder && !["milestones", "values", "pillars", "sections", "image"].includes(field.type) && (
                <p className="text-[10px] text-[#4a5c50] leading-relaxed">
                  Default: <span className="italic">{field.placeholder}</span>
                </p>
              )}
            </div>
          ))}

          {/* Version Control Settings */}
          <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9]">Version Control</h3>
              <p className="text-[10px] text-[#4a5c50] mt-1 leading-normal">
                Choose whether to log this change as a new historical checkpoint or modify the current version in place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNewVersion}
                  onChange={(e) => setIsNewVersion(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#070908] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#4a5c50] peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-[#b07e3a] border border-[#1a241e]"></div>
                <span className="ml-3 text-xs font-semibold text-white">Log this edit as a new archive version record</span>
              </label>
            </div>

            {isNewVersion && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#4a5c50]">Version Change Note (Optional)</label>
                <input
                  type="text"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  placeholder="e.g. Fixed typos in privacy statement, updated refund timeline..."
                  className="bg-[#070908] border border-[#1a241e] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/60 transition-colors"
                />
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#1a241e] text-xs text-[#a3b2a9]">
            <RefreshCw className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[#b07e3a]" />
            To reset a field to its built-in default, clear the input and save.
          </div>

          <button onClick={handleSave} disabled={saving || loading} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#b07e3a] hover:bg-[#9a6e30] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      )}

      {/* Success modal feedback */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Changes Saved Successfully"
        message="The page content has been reloaded from the database, and your updates are now live on the public storefront!"
        actionText="Close"
        showCancel={false}
        showClose={true}
        onAction={() => setSuccessModalOpen(false)}
        actionIcon={null}
      />
    </div>
  );
}
