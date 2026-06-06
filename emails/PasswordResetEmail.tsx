import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface PasswordResetEmailProps {
  token: string;
  name: string;
}

export const PasswordResetEmail = ({ token, name }: PasswordResetEmailProps) => {
  const digits = (token || "------").split("").slice(0, 6);

  return (
    <BaseEmailLayout title="Reset Your Password | Naturalist" previewText="Use this passcode to reset your Naturalist credentials.">
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.resetPasswordHeader} 
            alt="Reset your password" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        <p style={{ fontSize: "15px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 24px 0", lineHeight: "1.6", color: "#2d4c38" }}>
          You requested a security credentials reset for your Naturalist profile. Please use the 6-character passcode below in the verification screen:
        </p>

        {/* Shootmail-style 6-Box Passcode Grid */}
        <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto" }}>
          <tr>
            {digits.map((digit, i) => (
              <React.Fragment key={i}>
                <td align="center" valign="middle" style={{
                  width: "44px",
                  height: "52px",
                  backgroundColor: "#fbfbf9",
                  border: "1px solid #b07e3a",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#2d4c38"
                }}>
                  {digit}
                </td>
                {i < 5 && <td width="8" style={{ width: "8px" }}>&nbsp;</td>}
              </React.Fragment>
            ))}
          </tr>
        </table>

        <p style={{ fontSize: "14px", color: "#5e6f64", margin: "24px 0 0 0", textAlign: "center", lineHeight: "1.5" }}>
          This passcode is only valid for <strong>15 minutes</strong>. If you did not request this password reset, please ignore this email; your account will remain secure and unchanged.
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default PasswordResetEmail;
