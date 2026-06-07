import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "./db";
import { CdnImage } from "@/models/CdnImage";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Convert a raw Cloudinary secure_url to the project's CDN proxy URL.
 *
 * Raw:   https://res.cloudinary.com/dtpwhaxvh/image/upload/v123/brand/btn.png
 * Proxy: https://naturalist-project.onrender.com/cdn/image/upload/v123/brand/btn.png
 *
 * The proxy base depends on the environment:
 *  - Production: NEXT_PUBLIC_APP_URL (e.g. https://naturalist-project.onrender.com)
 *  - Local dev:  also use the production URL so email clients (Gmail etc.) can
 *                fetch the image — exactly the same logic as emails/assets.ts.
 */
function toCdnUrl(cloudinarySecureUrl: string): string {
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Email clients cannot reach localhost, so fall back to the live domain
  // for any image that will be embedded in an email — same logic as assets.ts.
  if (appUrl.includes("localhost")) {
    appUrl = "https://naturalist-project.onrender.com";
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dtpwhaxvh";
  // Strip the Cloudinary origin and cloud-name prefix, keep everything after
  // e.g. /image/upload/v123/brand/btn.png
  const withoutOrigin = cloudinarySecureUrl.replace(
    new RegExp(`https://res\\.cloudinary\\.com/${cloudName}`),
    ""
  );

  return `${appUrl}/cdn${withoutOrigin}`;
}

/**
 * Fetch a rendered PNG from the Edge image-generation route.
 * This is needed because ImageResponse (Satori) only works in Edge runtime,
 * while button-generator.tsx runs in the Node.js API runtime.
 */
async function fetchImageBuffer(params: Record<string, string>): Promise<Buffer> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qs = new URLSearchParams(params).toString();
  const url = `${appUrl}/api/dev/img-gen?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Image generation failed: ${res.status} ${res.statusText} (${url})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a button image buffer directly.
 */
export async function generateButtonImage(
  text: string,
  type: string,
  bg?: string,
  color?: string
): Promise<Buffer> {
  const params: Record<string, string> = {
    type: "button",
    text,
    variant: type,
  };
  if (bg) params.bg = bg;
  if (color) params.color = color;

  return fetchImageBuffer(params);
}

/**
 * Get the cached button image URL from MongoDB, or generate and upload it to Cloudinary.
 */
export async function getOrCreateButtonUrl(
  text: string,
  type: string,
  customBg?: string,
  customColor?: string
): Promise<string> {
  const normalizedText = text.trim().replace(/\s+/g, "_");
  const cacheKey = `btn_${type}_${normalizedText}`.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  await connectToDatabase();

  // 1. Check DB cache
  const cached = await CdnImage.findOne({ originalName: cacheKey });
  if (cached) return cached.url;

  // 2. Generate PNG via the Edge image route
  console.log(`Generating button: '${text}' (${type})...`);
  const buffer = await fetchImageBuffer({ type: "button", text, variant: type });

  // 3. Upload to Cloudinary
  const base64Data = `data:image/png;base64,${buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(base64Data, {
    public_id: cacheKey,
    folder: "brand",
    overwrite: true,
    resource_type: "image",
  });

  // 4. Convert to CDN proxy URL and cache in DB
  const cdnUrl = toCdnUrl(uploadResult.secure_url);
  await CdnImage.create({
    url: cdnUrl,
    publicId: uploadResult.public_id,
    originalName: cacheKey,
    sizeBytes: buffer.length,
  });

  return cdnUrl;
}

/**
 * Get cached voucher URL or generate one and upload to Cloudinary.
 */
export async function getOrCreateVoucherUrl(
  subtitle: string,
  title: string,
  code: string
): Promise<string> {
  const cacheKey = `vch_${subtitle}_${title}_${code}`
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "_");

  await connectToDatabase();

  // 1. Check DB cache
  const cached = await CdnImage.findOne({ originalName: cacheKey });
  if (cached) return cached.url;

  // 2. Generate PNG via the Edge image route
  console.log(`Generating voucher: '${title}'...`);
  const buffer = await fetchImageBuffer({ type: "voucher", subtitle, title, code });

  // 3. Upload to Cloudinary
  const base64Data = `data:image/png;base64,${buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(base64Data, {
    public_id: cacheKey,
    folder: "brand",
    overwrite: true,
    resource_type: "image",
  });

  // 4. Convert to CDN proxy URL and cache in DB
  const cdnUrl = toCdnUrl(uploadResult.secure_url);
  await CdnImage.create({
    url: cdnUrl,
    publicId: uploadResult.public_id,
    originalName: cacheKey,
    sizeBytes: buffer.length,
  });

  return cdnUrl;
}

/**
 * Scan the pre-rendered email HTML and resolve dynamic button, voucher, and link placeholders.
 */
export async function resolveEmailPlaceholders(
  html: string,
  recipientEmail: string
): Promise<string> {
  if (!html) return "";

  // @react-email/render injects <link rel="preload" as="image"> tags for every
  // <img src> in the document — including placeholder strings like __BTN_...__.
  // These raw <link> tags render as visible junk text in some email clients.
  // Strip ALL <link> elements (self-closing or not, any attributes, any case).
  html = html.replace(/<link(\s[^>]*)?\/?>(?:<\/link>)?/gi, "");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  // 1. Unsubscribe URL
  let resolvedHtml = html.replaceAll("__UNSUBSCRIBE_URL__", unsubscribeUrl);

  // 2. Static link placeholders with real UTM links
  resolvedHtml = resolvedHtml.replaceAll("__LINK_SHOP__",         `${appUrl}/shop?utm_source=email&utm_medium=welcome&utm_campaign=welcome_flow&utm_content=shop_collection`);
  resolvedHtml = resolvedHtml.replaceAll("__LINK_BEST_SELLERS__", `${appUrl}/collections/best-sellers?utm_source=email&utm_medium=welcome&utm_campaign=welcome_flow&utm_content=browse_best_sellers`);

  resolvedHtml = resolvedHtml.replace(/__LINK_TRACK_SHIPMENT_([a-zA-Z0-9_-]+)__/g,
    `${appUrl}/orders/track?id=$1&utm_source=email&utm_medium=transactional&utm_campaign=order_shipped&utm_content=track_shipment`);

  resolvedHtml = resolvedHtml.replaceAll("__LINK_CONTACT_SUPPORT_shipped__", `${appUrl}/support?utm_source=email&utm_medium=transactional&utm_campaign=order_shipped&utm_content=contact_support`);
  resolvedHtml = resolvedHtml.replaceAll("__LINK_CONTACT_SUPPORT_legal__",   `${appUrl}/support?utm_source=email&utm_medium=transactional&utm_campaign=legal_update&utm_content=contact_support`);

  resolvedHtml = resolvedHtml.replaceAll("__LINK_CHANGE_PASSWORD__",          `${appUrl}/account/security?action=change-password&utm_source=email&utm_medium=security&utm_campaign=security_alert&utm_content=change_password`);
  resolvedHtml = resolvedHtml.replaceAll("__LINK_SECURITY_PANEL__",           `${appUrl}/account/security?utm_source=email&utm_medium=security&utm_campaign=password_reset_success&utm_content=go_to_security_panel`);

  resolvedHtml = resolvedHtml.replaceAll("__LINK_REVIEW_ACTIVITY_security__", `${appUrl}/account/activity?utm_source=email&utm_medium=security&utm_campaign=security_alert&utm_content=review_account_activity`);
  resolvedHtml = resolvedHtml.replaceAll("__LINK_REVIEW_ACTIVITY_reset__",    `${appUrl}/account/activity?utm_source=email&utm_medium=security&utm_campaign=password_reset_success&utm_content=review_account_activity`);

  resolvedHtml = resolvedHtml.replaceAll("__LINK_VIEW_DOCS__", `${appUrl}/legal/terms?utm_source=email&utm_medium=legal&utm_campaign=legal_update&utm_content=view_full_documents`);

  // 3. Voucher placeholders: __VOUCHER_Subtitle|Title|Code__
  // @react-email/render HTML-encodes pipe characters as &#x7C; or &#124;, so
  // we must decode the HTML first, then match against the raw pipe character.
  const decodedHtml = resolvedHtml
    .replace(/&#x7C;/gi, "|")
    .replace(/&#124;/g, "|");
  const voucherMatches = [...decodedHtml.matchAll(/__VOUCHER_([^|]+)\|([^|]+)\|([^_]+)__/g)];
  if (voucherMatches.length > 0) {
    const replacements = await Promise.all(
      voucherMatches.map(async (match) => {
        const [fullMatch, subtitle, title, code] = match;
        try {
          const url = await getOrCreateVoucherUrl(subtitle, title, code);
          return { fullMatch, url };
        } catch (err) {
          console.error(`Voucher generation failed for '${title}':`, err);
          return { fullMatch, url: "#" };
        }
      })
    );
    for (const { fullMatch, url } of replacements) {
      // Replace in both the encoded and decoded forms
      resolvedHtml = resolvedHtml
        .replaceAll(fullMatch, url)
        .replace(new RegExp(fullMatch.replace(/\|/g, "(?:\\||&#x7C;|&#124;)"), "g"), url);
    }
  }

  // 4. Button placeholders: __BTN_variant_Label Text__
  const btnMatches = [...resolvedHtml.matchAll(/__BTN_([a-zA-Z0-9_-]+)_(.*?)__/g)];
  if (btnMatches.length > 0) {
    const replacements = await Promise.all(
      btnMatches.map(async (match) => {
        const [fullMatch, type, text] = match;
        try {
          const url = await getOrCreateButtonUrl(text, type);
          return { fullMatch, url };
        } catch (err) {
          console.error(`Button generation failed for '${text}':`, err);
          return { fullMatch, url: "#" };
        }
      })
    );
    for (const { fullMatch, url } of replacements) {
      resolvedHtml = resolvedHtml.replaceAll(fullMatch, url);
    }
  }

  return resolvedHtml;
}
