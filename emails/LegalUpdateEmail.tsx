import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface LegalUpdateEmailProps {
  name: string;
  documentName: string;
  updateDate: string;
  changesSummary: string;
}

export const LegalUpdateEmail = ({
  name,
  documentName = "Terms of Service & Privacy Policy",
  updateDate = new Date().toLocaleDateString(),
  changesSummary = "We have updated our guidelines and privacy practices to provide clearer explanations about data usage and to ensure regulatory compliance.",
}: LegalUpdateEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Notice: Legal Policy Update | Naturalist" previewText="We are updating our terms and conditions.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.legalUpdateHeader} 
            alt="Legal Document Updates" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          We are writing to inform you that we have updated our <strong>{documentName}</strong>. 
          These changes go into effect on <strong>{updateDate}</strong>. 
        </p>

        {/* Changes Summary Card */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderRadius: "16px", backgroundColor: "#faf9f5", marginBottom: "24px" }}>
          <tr>
            <td style={{ padding: "24px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#2d4c38", fontWeight: "bold" }}>
                Summary of Changes
              </h4>
              <p style={{ margin: "0", fontSize: "13px", color: "#5e6f64", lineHeight: "1.5" }}>
                {changesSummary}
              </p>
            </td>
          </tr>
        </table>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          By continuing to use Naturalist after {updateDate}, you agree to the revised documents. 
          If you have any questions or concerns, please do not hesitate to contact our legal support desk.
        </p>

        {/* Horizontal CTA Buttons */}
        <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto 10px auto", textAlign: "center" }}>
          <tr>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_VIEW_DOCS__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_primary_View Full Documents__" alt="View Full Documents" width="200" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_CONTACT_SUPPORT_legal__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_secondary_Contact Support__" alt="Contact Support" width="180" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default LegalUpdateEmail;
