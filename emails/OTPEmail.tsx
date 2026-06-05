import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";

interface OTPEmailProps {
  otp: string;
  name: string;
}

export const OTPEmail = ({ otp, name }: OTPEmailProps) => {
  const digits = (otp || "------").split("").slice(0, 6);

  const sansSerifStack = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const serifStack = "'Playfair Display', Georgia, 'Times New Roman', serif";

  return (
    <BaseEmailLayout title="Verify Your Email | Naturalist" previewText="Complete your registration with Naturalist.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading */}
        <h1 style={{ fontFamily: serifStack, fontSize: "24px", fontWeight: "900", color: "#2d4c38", margin: "0 0 16px 0", textAlign: "center", lineHeight: "1.3" }}>
          Confirm your email address
        </h1>

        <p style={{ fontSize: "15px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 24px 0", lineHeight: "1.6", color: "#2d4c38" }}>
          Thank you for joining Naturalist! To complete your registration and activate your account, please enter the 6-character verification passcode below:
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

        <p style={{ fontSize: "14px", color: "#5e6f64", margin: "24px 0 0 0", textAlign: "center", lineHeight: "1.5" }}>
          This security code is valid for <strong>15 minutes</strong>. If you did not sign up for a Naturalist account, you can safely ignore this message.
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default OTPEmail;
