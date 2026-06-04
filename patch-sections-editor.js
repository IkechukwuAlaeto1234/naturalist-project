/**
 * patch-sections-editor.js
 * Run once from the project root: node patch-sections-editor.js
 * Upgrades SectionsEditor in the admin page editor with:
 *   - Move Up / Move Down controls per section
 *   - Bullet list toggle (one line per bullet → saves as string[])
 *   - Delete button
 * Also adds ChevronUp, ChevronDown, List, AlignLeft to lucide imports.
 */

const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "app",
  "admin",
  "pages",
  "edit",
  "[pageKey]",
  "page.tsx"
);

let content = fs.readFileSync(FILE, "utf8");
let changed = 0;

// ── 1. Update lucide imports ───────────────────────────────────────────────────
const OLD_IMPORT = `import {
  Save, Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  ExternalLink, Plus, Trash2, RefreshCw, Upload, Link2,
  AlertTriangle,
} from "lucide-react";`;

const NEW_IMPORT = `import {
  Save, Loader2, ArrowLeft, CheckCircle2, AlertCircle,
  ExternalLink, Plus, Trash2, RefreshCw, Upload, Link2,
  AlertTriangle, ChevronUp, ChevronDown, List, AlignLeft,
} from "lucide-react";`;

if (content.includes(OLD_IMPORT)) {
  content = content.replace(OLD_IMPORT, NEW_IMPORT);
  changed++;
  console.log("✓ Updated lucide imports");
} else {
  console.warn("⚠ Could not find old import block — skipping import update.");
}

// ── 2. Replace SectionsEditor ─────────────────────────────────────────────────
const OLD_EDITOR_START = `function SectionsEditor({ value, onChange }: { value: LegalSection[]; onChange: (v: LegalSection[]) => void }) {
  const add = () => onChange([...value, { heading: "", body: "" }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof LegalSection, val: string) => {
    const next = [...value]; next[i] = { ...next[i], [field]: val }; onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {value.map((s, i) => (
        <div key={i} className="rounded-xl border border-[#1a241e] bg-white/[0.01] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">Section {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <input type="text" value={s.heading} onChange={(e) => update(i, "heading", e.target.value)} placeholder="Section Heading" className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors" />
          <textarea value={s.body} onChange={(e) => update(i, "body", e.target.value)} placeholder="Section Body text..." rows={4} className="bg-[#0c100e] border border-[#1a241e] rounded-lg px-3 py-2 text-xs text-white placeholder-[#4a5c50] focus:outline-none focus:border-[#b07e3a]/50 transition-colors resize-none leading-relaxed" />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#b07e3a]/40 text-xs font-bold text-[#b07e3a] hover:border-[#b07e3a] hover:bg-[#b07e3a]/5 transition-all w-fit"><Plus className="h-3.5 w-3.5" /> Add Section</button>
    </div>
  );
}`;

const NEW_EDITOR = `// ─── SectionsEditor — upgraded ────────────────────────────────────────────────
// Supports:  move up/down  |  bullet-list toggle  |  delete
// Body storage:
//   paragraph mode → string  (stored as-is)
//   bullet mode    → string[] (each textarea line = one bullet)
//   The PDF renderer already handles both via Array.isArray(body).

function parseSectionBody(raw: string | string[]): { isBullet: boolean; text: string } {
  if (Array.isArray(raw)) return { isBullet: true, text: raw.join("\\n") };
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { isBullet: true, text: parsed.join("\\n") };
    } catch {}
  }
  return { isBullet: false, text: typeof raw === "string" ? raw : "" };
}

function serializeSectionBody(text: string, isBullet: boolean): string | string[] {
  if (!isBullet) return text;
  return text.split("\\n").map((l) => l.trim()).filter(Boolean);
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
              className={\`h-6 px-2 flex items-center gap-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all \${
                bulletModes[i]
                  ? "bg-[#b07e3a]/15 border-[#b07e3a]/40 text-[#b07e3a]"
                  : "bg-white/[0.03] border-[#1a241e] text-[#4a5c50] hover:text-[#a3b2a9] hover:border-[#2a3a2e]"
              }\`}>
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
                ? "One bullet point per line.\\nEach line becomes a separate bullet in the PDF."
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
}`;

if (content.includes(OLD_EDITOR_START)) {
  content = content.replace(OLD_EDITOR_START, NEW_EDITOR);
  changed++;
  console.log("✓ Replaced SectionsEditor");
} else {
  console.error("✗ Could not find old SectionsEditor block — no changes made.");
  process.exit(1);
}

fs.writeFileSync(FILE, content, "utf8");
console.log(`\n✅ Done. ${changed}/2 changes applied to:\n   ${FILE}`);
console.log("\nRestart your dev server (npm run dev) to see the changes.");
