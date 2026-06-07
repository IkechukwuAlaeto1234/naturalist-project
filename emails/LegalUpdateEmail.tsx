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
  const sansSerifStack = "Verdana, Geneva, sans-serif";

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
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "24px", backgroundColor: "#faf9f5", marginBottom: "24px" }}>
          <tr>
            <td>
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

        <table width="100%" cellPadding={0} cellSpacing={0} style={{ textAlign: "center", margin: "24px 0 10px 0" }}>
          <tr>
            <td align="center">
              <a href="#" target="_blank" style={{
                backgroundColor: "#2d4c38",
                color: "#faf9f5",
                fontSize: "13px",
                fontWeight: "bold",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: "30px",
                display: "inline-block",
                boxShadow: "0 4px 10px rgba(45, 76, 56, 0.15)"
              }}>
                View Full Documents
              </a>
            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default LegalUpdateEmail;
