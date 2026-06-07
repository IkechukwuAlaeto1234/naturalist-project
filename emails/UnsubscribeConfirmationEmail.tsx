import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface UnsubscribeConfirmationEmailProps {
  email: string;
  resubscribeUrl: string;
}

export const UnsubscribeConfirmationEmail = ({
  email,
  resubscribeUrl,
}: UnsubscribeConfirmationEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout
      title="You've Been Unsubscribed | Naturalist"
      previewText="You've been removed from our newsletter. We're sorry to see you go."
      unsubscribeUrl={resubscribeUrl}
    >
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>

        {/* Illustration */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src={EMAIL_ASSETS.newsletter}
            alt="Goodbye from Naturalist"
            style={{ width: "100%", maxWidth: "420px", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "inline-block" }}
          />
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img
            src={EMAIL_ASSETS.unsubscribeHeader}
            alt="Subscription Update - You've Been Unsubscribed"
            width="400"
            height="80"
            style={{ width: "400px", height: "80px", border: "0", display: "inline-block" }}
          />
        </div>

        {/* Body */}
        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.7" }}>
          Hi there,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.7" }}>
          We&rsquo;ve successfully removed <strong>{email}</strong> from the Naturalist newsletter. You won&rsquo;t receive any more marketing emails or product updates from us.
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.7" }}>
          We&rsquo;re genuinely sorry to see you go. Your feedback helps us grow, and we hope our paths cross again someday.
        </p>

        {/* Divider */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "28px 0" }}>
          <tr>
            <td style={{ borderTop: "1px solid #eae5db", fontSize: "1px", lineHeight: "1px" }}>&nbsp;</td>
          </tr>
        </table>

        {/* Changed your mind? */}
        <p style={{ fontSize: "13px", fontWeight: "bold", color: "#2d4c38", margin: "0 0 8px 0", textAlign: "center" }}>
          Changed your mind?
        </p>
        <p style={{ fontSize: "13px", color: "#5e6f64", margin: "0 0 20px 0", lineHeight: "1.6", textAlign: "center" }}>
          You can re-subscribe at any time to receive our organic skincare guides, ingredient spotlights, and exclusive member offers.
        </p>

        {/* Re-subscribe CTA */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "0 0 28px 0", textAlign: "center" }}>
          <tr>
            <td align="center">
              <a href={resubscribeUrl} target="_blank" style={{ display: "inline-block" }}>
                <img
                  src={EMAIL_ASSETS.unsubscribeButton}
                  alt="Re-subscribe to Newsletter"
                  width="260"
                  height="68"
                  style={{ width: "260px", height: "68px", border: "0", display: "block" }}
                />
              </a>
            </td>
          </tr>
        </table>

        {/* Divider */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "28px 0" }}>
          <tr>
            <td style={{ borderTop: "1px solid #eae5db", fontSize: "1px", lineHeight: "1px" }}>&nbsp;</td>
          </tr>
        </table>

        {/* Note: transactional emails still apply */}
        <p style={{ fontSize: "12px", color: "#8a9e90", margin: "0", lineHeight: "1.6", textAlign: "center" }}>
          Please note: you may still receive transactional emails related to your orders, account security, and important service updates. These cannot be unsubscribed from.
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default UnsubscribeConfirmationEmail;
