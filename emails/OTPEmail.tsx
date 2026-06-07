import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface OTPEmailProps {
  otp: string;
  name: string;
}

export const OTPEmail = ({ otp, name }: OTPEmailProps) => {
  const digits = (otp || "------").split("").slice(0, 6);
  const sansSerifStack = "Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Verify Your Email | Naturalist" previewText="Complete your registration with Naturalist.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.verifyEmailHeader} 
            alt="Verify your email address" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6", color: "#2d4c38" }}>
          Thank you for joining Naturalist! To complete your registration and activate your account, please enter the 6-character verification passcode below:
        </p>

        {/* 6-Box Passcode Grid */}
        <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto" }}>
          <tr>
            {digits.map((digit, i) => (
              <React.Fragment key={i}>
                <td align="center" valign="middle" style={{
                  width: "44px",
                  height: "52px",
                  backgroundColor: "#faf9f5",
                  border: "1px solid #b07e3a",
                  borderRadius: "12px",
                  textAlign: "center",
                  fontFamily: sansSerifStack,
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

        <p style={{ fontSize: "13px", color: "#5e6f64", margin: "24px 0 0 0", textAlign: "center", lineHeight: "1.5" }}>
          This security code is valid for <strong>15 minutes</strong>. If you did not sign up for a Naturalist account, you can safely ignore this message.
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default OTPEmail;
