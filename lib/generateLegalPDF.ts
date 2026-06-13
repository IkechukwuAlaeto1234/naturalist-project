/**
 * generateLegalPDF — Naturalist Legal PDF Generator
 * ─────────────────────────────────────────────────────────────────────────────
 * Cover:   Cream background. Geometric corner decorations in forest green
 *          (inspired by structured grid/geometric art). All content centred.
 *          "Naturalist." wordmark top-centre. Title very large bold (wraps to
 *          two lines). Subtitle centred. Effective date centred bottom.
 *          Site URL centred. Grid decorations ONLY on cover.
 * Content: White/cream bg. Slim outer border frame on every content page.
 *          Header: "Naturalist." left | doc title right. Rule.
 *          Footer: Copyright LEFT, page num RIGHT. Rule shifted up.
 * Sections: Tight packing. No orphaned trailing dividers.
 */

import { FONT_REGULAR, FONT_BOLD } from "./hostGroteskFontData";

// ── Brand Palette ─────────────────────────────────────────────────────────────
const FOREST       = [45,  76,  56]  as [number, number, number]; // deep forest green
const FOREST_MID   = [62,  100, 74]  as [number, number, number]; // mid forest green
const FOREST_LITE  = [90,  130, 104] as [number, number, number]; // lighter green accent
const FOREST_GHOST = [45,  76,  56,  18] as [number, number, number, number]; // translucent (for bg tint)
const CREAM        = [252, 250, 245] as [number, number, number]; // warm cream
const CREAM_DIM    = [230, 224, 210] as [number, number, number]; // dimmer cream for rules
const CREAM_DARK   = [160, 148, 128] as [number, number, number]; // for secondary text
const TEXT_DARK    = [22,  36,  28]  as [number, number, number]; // near-black green-tint
const TEXT_MID     = [90,  108, 97]  as [number, number, number]; // muted green-grey
const RULE_COLOR   = [210, 200, 185] as [number, number, number]; // warm grey rules

// ── Page geometry (A4 in mm) ──────────────────────────────────────────────────
const PAGE_W    = 210;
const PAGE_H    = 297;
const MARGIN    = 20;
const BORDER    = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Content page header/footer
const HEADER_RULE_Y = 22;
const BODY_TOP      = 33;
const FOOTER_RULE_Y = 278;
const FOOTER_Y      = 285;
const BODY_BOT      = FOOTER_RULE_Y - 2;

const MIN_SECTION_SPACE = 14;
const FONT_NAME         = "HostGrotesk";

interface Section {
  heading: string;
  body: string | string[];
}

interface GenerateLegalPDFOptions {
  title: string;
  eyebrow: string;
  subtitle: string;
  effectiveDate: string;
  sections: Section[];
  filename: string;
  siteUrl?: string;
  contactUrl?: string;
  contactEmail?: string;
  year?: number;
}

// ── Font helpers ──────────────────────────────────────────────────────────────
function registerFonts(doc: any) {
  doc.addFileToVFS(`${FONT_NAME}-Regular.ttf`, FONT_REGULAR);
  doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, "normal");
  doc.addFileToVFS(`${FONT_NAME}-Bold.ttf`, FONT_BOLD);
  doc.addFont(`${FONT_NAME}-Bold.ttf`, FONT_NAME, "bold");
}
function setRegular(doc: any, size: number) { doc.setFont(FONT_NAME, "normal"); doc.setFontSize(size); }
function setBold(doc: any, size: number)    { doc.setFont(FONT_NAME, "bold");   doc.setFontSize(size); }

// ── Geometric corner decorations (cover page only) ────────────────────────────
// Draws layered hexagonal/parallelogram shapes at each corner, inspired by
// structured geometric border art. Forest green gradient tones.
function drawCornerDecoration(doc: any, corner: "tl" | "tr" | "bl" | "br") {
  const size = 38; // overall corner size in mm

  // Helper: draw a parallelogram/rhombus shape as a filled polygon
  // Points are [x,y] pairs defining the polygon
  const poly = (pts: [number, number][], color: [number, number, number], opacity: number) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setGState(doc.GState({ opacity }));
    // Use lines to draw filled polygon
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0);
    // jsPDF polygon: move to first, then line to each, then fill
    const [x0, y0] = pts[0];
    let pathStr = `${x0 * 2.8346} ${(PAGE_H - y0) * 2.8346} m`; // mm to pt, flip y
    for (let k = 1; k < pts.length; k++) {
      pathStr += ` ${pts[k][0] * 2.8346} ${(PAGE_H - pts[k][1]) * 2.8346} l`;
    }
    pathStr += " f";
    // Use internal jsPDF path API if available, else use rect approximation
    try {
      (doc as any).internal.write(pathStr);
    } catch {
      // fallback: skip polygon
    }
  };

  // Reset gstate after drawing
  const resetOpacity = () => {
    try { doc.setGState(doc.GState({ opacity: 1 })); } catch {}
  };

  // ── Top-left corner ──────────────────────────────────────────────────────
  if (corner === "tl") {
    // Large background wedge
    doc.setFillColor(FOREST[0], FOREST[1], FOREST[2]);
    doc.setGState && doc.setGState(doc.GState({ opacity: 0.12 }));
    poly([[0, PAGE_H], [size * 0.9, PAGE_H], [0, PAGE_H - size * 0.9]], FOREST, 0.10);

    // Main geometric piece — top-left hex panel (large)
    poly(
      [[0, PAGE_H], [size * 0.55, PAGE_H], [size * 0.95, PAGE_H - size * 0.38], [size * 0.4, PAGE_H - size * 0.38]],
      FOREST, 0.72
    );
    // Secondary piece (lighter, overlapping)
    poly(
      [[0, PAGE_H - size * 0.32], [size * 0.22, PAGE_H - size * 0.32], [size * 0.55, PAGE_H - size * 0.62], [size * 0.28, PAGE_H - size * 0.62]],
      FOREST_LITE, 0.55
    );
    // Small accent
    poly(
      [[0, PAGE_H - size * 0.62], [size * 0.18, PAGE_H - size * 0.62], [size * 0.35, PAGE_H - size * 0.84], [size * 0.15, PAGE_H - size * 0.84]],
      FOREST_MID, 0.5
    );
    resetOpacity();
  }

  // ── Top-right corner ──────────────────────────────────────────────────────
  if (corner === "tr") {
    const rx = PAGE_W;
    poly(
      [[rx, PAGE_H], [rx - size * 0.55, PAGE_H], [rx - size * 0.95, PAGE_H - size * 0.38], [rx - size * 0.4, PAGE_H - size * 0.38]],
      FOREST, 0.72
    );
    poly(
      [[rx, PAGE_H - size * 0.32], [rx - size * 0.22, PAGE_H - size * 0.32], [rx - size * 0.55, PAGE_H - size * 0.62], [rx - size * 0.28, PAGE_H - size * 0.62]],
      FOREST_LITE, 0.55
    );
    poly(
      [[rx, PAGE_H - size * 0.62], [rx - size * 0.18, PAGE_H - size * 0.62], [rx - size * 0.35, PAGE_H - size * 0.84], [rx - size * 0.15, PAGE_H - size * 0.84]],
      FOREST_MID, 0.5
    );
    resetOpacity();
  }

  // ── Bottom-left corner ────────────────────────────────────────────────────
  if (corner === "bl") {
    poly(
      [[0, 0], [size * 0.55, 0], [size * 0.95, size * 0.38], [size * 0.4, size * 0.38]],
      FOREST, 0.72
    );
    poly(
      [[0, size * 0.32], [size * 0.22, size * 0.32], [size * 0.55, size * 0.62], [size * 0.28, size * 0.62]],
      FOREST_LITE, 0.55
    );
    poly(
      [[0, size * 0.62], [size * 0.18, size * 0.62], [size * 0.35, size * 0.84], [size * 0.15, size * 0.84]],
      FOREST_MID, 0.5
    );
    resetOpacity();
  }

  // ── Bottom-right corner ───────────────────────────────────────────────────
  if (corner === "br") {
    const rx = PAGE_W;
    poly(
      [[rx, 0], [rx - size * 0.55, 0], [rx - size * 0.95, size * 0.38], [rx - size * 0.4, size * 0.38]],
      FOREST, 0.72
    );
    poly(
      [[rx, size * 0.32], [rx - size * 0.22, size * 0.32], [rx - size * 0.55, size * 0.62], [rx - size * 0.28, size * 0.62]],
      FOREST_LITE, 0.55
    );
    poly(
      [[rx, size * 0.62], [rx - size * 0.18, size * 0.62], [rx - size * 0.35, size * 0.84], [rx - size * 0.15, size * 0.84]],
      FOREST_MID, 0.5
    );
    resetOpacity();
  }
}


// ── Cover page ────────────────────────────────────────────────────────────────
// Layout: whole content block vertically centred in the page (footer excluded).
// Order (top→bottom):
//   Wordmark "Naturalist."
//   Thin decorative rule
//   Ghost pill (LEGAL)         ← safely above title, no overlap
//   Title line 1 (76pt)
//   Title line 2 (96pt, bigger)
//   Subtitle
//   ─────── (bottom of page) ──
//   Bottom rule + URL
function buildCoverPage(doc: any, opts: GenerateLegalPDFOptions) {
  const siteUrl = opts.siteUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.host : "naturalist.com");

  // ── Full cream background ─────────────────────────────────────────────────
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // ── Geometric corner decorations ─────────────────────────────────────────
  drawCornerDecoration(doc, "tl");
  drawCornerDecoration(doc, "tr");
  drawCornerDecoration(doc, "bl");
  drawCornerDecoration(doc, "br");

  // ── Thin outer border frame ───────────────────────────────────────────────
  doc.setDrawColor(CREAM_DIM[0], CREAM_DIM[1], CREAM_DIM[2]);
  doc.setLineWidth(0.4);
  doc.rect(BORDER, BORDER, PAGE_W - BORDER * 2, PAGE_H - BORDER * 2);

  const cx = PAGE_W / 2;

  // ── Vertical centering (no pill) ─────────────────────────────────────────
  // Block: wordmark → rule → [30mm gap] → title L1 → title L2 → subtitle
  const WM_Y  = 68;          // wordmark baseline
  const RULE_Y = WM_Y + 5;  // thin rule below wordmark
  const T1_Y  = RULE_Y + 30; // title line 1 — generous 30mm gap from wordmark
  const T2_Y  = T1_Y + 36;  // title line 2 (96pt, 36mm below L1)
  const SUB_Y = T2_Y + 16;  // subtitle — clear 16mm gap from title

  // ── Wordmark ──────────────────────────────────────────────────────────────
  setBold(doc, 28);
  doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
  doc.text("Naturalist.", cx, WM_Y, { align: "center" });

  // Thin decorative rule
  doc.setDrawColor(CREAM_DIM[0], CREAM_DIM[1], CREAM_DIM[2]);
  doc.setLineWidth(0.3);
  doc.line(BORDER + 24, RULE_Y, PAGE_W - BORDER - 24, RULE_Y);


  // ── Title — line 1: all words except last, at 76pt ───────────────────────
  const words = opts.title.trim().split(/\s+/);
  const titleLastWord  = words[words.length - 1];     // e.g. "Service"
  const titleFirstPart = words.slice(0, -1).join(" "); // e.g. "Terms of"

  if (titleFirstPart) {
    setBold(doc, 76);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(titleFirstPart, cx, T1_Y, { align: "center" });
  }

  // ── Title — line 2: last word only, 96pt (bigger) ────────────────────────
  setBold(doc, 96);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  const line2Y = titleFirstPart ? T2_Y : T1_Y;
  doc.text(titleLastWord, cx, line2Y, { align: "center" });

  // ── Subtitle ──────────────────────────────────────────────────────────────
  setRegular(doc, 12);
  doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
  const subLines = doc.splitTextToSize(opts.subtitle, CONTENT_W * 0.60);
  let sy = SUB_Y;
  subLines.forEach((line: string) => {
    doc.text(line, cx, sy, { align: "center" });
    sy += 7;
  });

  // ── Bottom thin rule + site URL ───────────────────────────────────────────
  const ruleY = PAGE_H - BORDER - 20;
  const urlY  = PAGE_H - BORDER - 11;
  doc.setDrawColor(CREAM_DIM[0], CREAM_DIM[1], CREAM_DIM[2]);
  doc.setLineWidth(0.25);
  doc.line(BORDER + 20, ruleY, PAGE_W - BORDER - 20, ruleY);

  setRegular(doc, 8);
  doc.setTextColor(CREAM_DARK[0], CREAM_DARK[1], CREAM_DARK[2]);
  const displayUrl = siteUrl.replace(/^https?:\/\//, "");
  doc.text(displayUrl, cx, urlY, { align: "center" });
}

// ── Running header (content pages — no outer border frame) ───────────────────
function drawHeader(doc: any, docTitle: string) {
  // Cream background for content pages
  doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  // No border frame on content pages — clean layout

  const textY = HEADER_RULE_Y - 6;
  setBold(doc, 11);
  doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
  doc.text("Naturalist.", MARGIN, textY);

  setRegular(doc, 8.5);
  doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
  doc.text(docTitle, PAGE_W - MARGIN, textY, { align: "right" });

  doc.setDrawColor(RULE_COLOR[0], RULE_COLOR[1], RULE_COLOR[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, HEADER_RULE_Y, PAGE_W - MARGIN, HEADER_RULE_Y);
}

// ── Running footer (content pages) ────────────────────────────────────────────
function drawFooter(doc: any, pageNum: number, year: number) {
  doc.setDrawColor(RULE_COLOR[0], RULE_COLOR[1], RULE_COLOR[2]);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, FOOTER_RULE_Y, PAGE_W - MARGIN, FOOTER_RULE_Y);

  setBold(doc, 7.5);
  doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
  doc.text(`\u00A9 ${year} Naturalist. All rights reserved.`, MARGIN, FOOTER_Y);

  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text(`${pageNum}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
}

// ── Section renderer ──────────────────────────────────────────────────────────
function renderSection(
  doc: any,
  section: Section,
  y: number,
  pageNum: { value: number },
  docTitle: string,
  year: number,
  isFirst: boolean
): number {
  const body      = section.body;
  const bodyItems = Array.isArray(body) ? body : [body as string];
  const headingH  = 7;
  const lineH     = 5.5;

  if (!isFirst) {
    // Only draw the section divider if the heading + minimum content will
    // also fit on this page. If not, skip the rule — a page break will follow
    // immediately, so the divider would just be stranded with empty space.
    const dividerGap  = 7;  // mm consumed by rule + spacing
    const totalNeeded = dividerGap + headingH + MIN_SECTION_SPACE;
    if (y + totalNeeded <= BODY_BOT) {
      doc.setDrawColor(RULE_COLOR[0], RULE_COLOR[1], RULE_COLOR[2]);
      doc.setLineWidth(0.25);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += dividerGap;
    } else {
      // Section won't fit — page break, no orphan rule
      doc.addPage();
      pageNum.value++;
      drawHeader(doc, docTitle);
      drawFooter(doc, pageNum.value, year);
      y = BODY_TOP;
    }
  }

  if (y + headingH + lineH + MIN_SECTION_SPACE > BODY_BOT) {
    doc.addPage();
    pageNum.value++;
    drawHeader(doc, docTitle);
    drawFooter(doc, pageNum.value, year);
    y = BODY_TOP;
  }

  setBold(doc, 12.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text(section.heading, MARGIN, y);
  y += headingH + 2;

  if (Array.isArray(body)) {
    for (const item of bodyItems) {
      const lines   = doc.splitTextToSize(item, CONTENT_W - 5);
      const neededH = lines.length * lineH + 3;

      if (y + neededH > BODY_BOT) {
        doc.addPage();
        pageNum.value++;
        drawHeader(doc, docTitle);
        drawFooter(doc, pageNum.value, year);
        y = BODY_TOP;
        setBold(doc, 12.5);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        doc.text(section.heading + " (cont\u2019d)", MARGIN, y);
        y += headingH + 2;
      }

      // Forest green bullet dot
      doc.setFillColor(FOREST[0], FOREST[1], FOREST[2]);
      doc.circle(MARGIN + 1.5, y - 1.4, 1, "F");

      setRegular(doc, 11);
      doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
      doc.text(lines, MARGIN + 5.5, y);
      y += lines.length * lineH + 3;
    }
  } else {
    const lines = doc.splitTextToSize(bodyItems[0], CONTENT_W);
    for (const line of lines) {
      if (y + lineH > BODY_BOT) {
        doc.addPage();
        pageNum.value++;
        drawHeader(doc, docTitle);
        drawFooter(doc, pageNum.value, year);
        y = BODY_TOP;
      }
      setRegular(doc, 11);
      doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
      doc.text(line, MARGIN, y);
      y += lineH;
    }
  }

  return y;
}

// ── Closing block ─────────────────────────────────────────────────────────────
function drawClosingBlock(
  doc: any,
  y: number,
  pageNum: { value: number },
  docTitle: string,
  opts: GenerateLegalPDFOptions,
  year: number
) {
  const cx         = PAGE_W / 2;
  const contactUrl = opts.contactUrl || `${opts.siteUrl}/p/contact`;
  const email      = opts.contactEmail || process.env.EMAIL_FROM || "hello@naturalist.com";

  if (y + 55 > BODY_BOT) {
    doc.addPage();
    pageNum.value++;
    drawHeader(doc, docTitle);
    drawFooter(doc, pageNum.value, year);
    y = BODY_TOP;
  }

  doc.setDrawColor(RULE_COLOR[0], RULE_COLOR[1], RULE_COLOR[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 12;

  setBold(doc, 10.5);
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text("Questions about this document?", cx, y, { align: "center" });
  y += 6;

  setRegular(doc, 9);
  doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
  doc.text("We\u2019re happy to explain anything in plain language.", cx, y, { align: "center" });
  y += 12;

  const btnText = "CONTACT US";
  const charSp  = 1.1;
  setBold(doc, 8);
  const rawW    = doc.getTextWidth(btnText);
  const totalW  = rawW + charSp * (btnText.length - 1);
  const btnW    = totalW + 26;
  const btnH    = 11;
  const btnX    = cx - btnW / 2;
  const btnY    = y;

  doc.setFillColor(FOREST[0], FOREST[1], FOREST[2]);
  doc.setLineWidth(0);
  doc.roundedRect(btnX, btnY, btnW, btnH, btnH / 2, btnH / 2, "F");

  const textBaseline = btnY + btnH / 2 + 1.5;
  doc.setTextColor(255, 255, 255);
  doc.text(btnText, cx - totalW / 2, textBaseline, { charSpace: charSp });
  doc.link(btnX, btnY, btnW, btnH, { url: contactUrl });
  y += btnH + 10;

  setRegular(doc, 8.5);
  doc.setTextColor(TEXT_MID[0], TEXT_MID[1], TEXT_MID[2]);
  const orText  = "Or reach us at:";
  const orTextW = doc.getTextWidth(orText);
  doc.text(orText, cx - orTextW / 2, y);
  y += 6;

  setBold(doc, 9);
  doc.setTextColor(FOREST[0], FOREST[1], FOREST[2]);
  const emailW = doc.getTextWidth(email);
  const emailX = cx - emailW / 2;
  doc.text(email, emailX, y);
  doc.setDrawColor(FOREST[0], FOREST[1], FOREST[2]);
  doc.setLineWidth(0.3);
  doc.line(emailX, y + 0.9, emailX + emailW, y + 0.9);
  doc.link(emailX, y - 4, emailW, 6, { url: `mailto:${email}` });
}

// ── Main Export ───────────────────────────────────────────────────────────────
export async function generateLegalPDF(opts: GenerateLegalPDFOptions): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const siteUrl = opts.siteUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://naturalist.com");

  const year = opts.year || new Date().getFullYear();

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  registerFonts(doc);

  buildCoverPage(doc, { ...opts, siteUrl });

  doc.addPage();
  const pageNum = { value: 1 };
  drawHeader(doc, opts.title);
  drawFooter(doc, pageNum.value, year);

  let y = BODY_TOP;
  opts.sections.forEach((section, i) => {
    y = renderSection(doc, section, y, pageNum, opts.title, year, i === 0);
  });

  drawClosingBlock(doc, y, pageNum, opts.title, { ...opts, siteUrl }, year);

  doc.setProperties({
    title:   opts.title,
    subject: opts.subtitle,
    creator: "Naturalist",
    author:  "Naturalist",
  });

  doc.save(opts.filename);
}
