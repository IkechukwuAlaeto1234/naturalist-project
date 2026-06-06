import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface PasswordResetSuccessEmailProps {
  name: string;
}

export const PasswordResetSuccessEmail = ({ name }: PasswordResetSuccessEmailProps) => {
  return (
    <BaseEmailLayout title="Password Reset Successful | Naturalist" previewText="Your password has been successfully updated.">
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#141f19" }}>
        
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
            style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block", border: 0 }} 
          />
        </div>

        <p style={{ fontSize: "15px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          This is a confirmation email to notify you that the password for your Naturalist account was recently updated. 
          No further actions are required.
        </p>

        {/* Security Warning Box */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "20px", backgroundColor: "#faf9f5", margin: "24px 0" }}>
          <tr>
            <td>
              <h4 style={{ margin: "0 0 8px 0", fontFamily: "Georgia, serif", fontSize: "15px", color: "#b07e3a", fontWeight: "bold" }}>
                Didn't request this change?
              </h4>
              <p style={{ margin: "0", fontSize: "13px", color: "#5e6f64", lineHeight: "1.5" }}>
                If you did not reset your password yourself, your account might have been compromised. 
                Please contact our support team immediately or secure your account by navigating to the security panel.
              </p>
            </td>
          </tr>
        </table>

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
                Go to Security Panel
              </a>
            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default PasswordResetSuccessEmail;
