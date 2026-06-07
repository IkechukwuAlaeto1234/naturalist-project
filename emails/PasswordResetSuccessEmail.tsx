import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface PasswordResetSuccessEmailProps {
  name: string;
}

export const PasswordResetSuccessEmail = ({ name }: PasswordResetSuccessEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Password Reset Successful | Naturalist" previewText="Your password has been successfully updated.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.passwordSuccessHeader} 
            alt="Password Updated Successfully" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        {/* Hero Image */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.passwordSuccessIllustration} 
            alt="Password reset successful" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "block" }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          This is a confirmation email to notify you that the password for your Naturalist account was recently updated. 
          No further actions are required.
        </p>

        {/* Security Warning Box - Styled as a neat bordered card */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderRadius: "16px", backgroundColor: "#faf9f5", margin: "24px 0" }}>
          <tr>
            <td style={{ padding: "20px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#b07e3a", fontWeight: "bold" }}>
                Didn't request this change?
              </h4>
              <p style={{ margin: "0", fontSize: "13px", color: "#5e6f64", lineHeight: "1.5" }}>
                If you did not reset your password yourself, your account might have been compromised. 
                Please contact our support team immediately or secure your account by navigating to the security panel.
              </p>
            </td>
          </tr>
        </table>

        {/* Button */}
        {/* Horizontal CTA Buttons */}
        <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto 10px auto", textAlign: "center" }}>
          <tr>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_SECURITY_PANEL__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_primary_Go to Security Panel__" alt="Go to Security Panel" width="200" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_REVIEW_ACTIVITY_reset__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_secondary_Review Account Activity__" alt="Review Account Activity" width="240" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default PasswordResetSuccessEmail;
