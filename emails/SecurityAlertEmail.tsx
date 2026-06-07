import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface SecurityAlertEmailProps {
  name: string;
  device: string;
  location: string;
  time: string;
  ipAddress: string;
}

export const SecurityAlertEmail = ({
  name,
  device = "Unknown Browser/Device",
  location = "Unknown Location",
  time = new Date().toLocaleString(),
  ipAddress = "127.0.0.1",
}: SecurityAlertEmailProps) => {
  const sansSerifStack = "Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Security Alert: New Sign In | Naturalist" previewText="We detected a new sign in to your Naturalist profile.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.securityAlertHeader} 
            alt="Security Device Alert" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        {/* Hero Image */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.piratageLastPass} 
            alt="Security Alert" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "block" }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          We detected a new sign in to your Naturalist account from a browser or device we haven't seen before. Please verify these details:
        </p>

        {/* Security Alert Info Box - Styled as a neat bordered card */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "24px", backgroundColor: "#faf9f5", marginBottom: "24px" }}>
          <tr>
            <td>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", paddingBottom: "8px", fontFamily: sansSerifStack }}>Device / Browser:</td>
                  <td align="right" style={{ fontSize: "13px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px", fontFamily: sansSerifStack }}>{device}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", paddingBottom: "8px", fontFamily: sansSerifStack }}>Location:</td>
                  <td align="right" style={{ fontSize: "13px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px", fontFamily: sansSerifStack }}>{location}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", paddingBottom: "8px", fontFamily: sansSerifStack }}>Time:</td>
                  <td align="right" style={{ fontSize: "13px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px", fontFamily: sansSerifStack }}>{time}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", fontFamily: sansSerifStack }}>IP Address:</td>
                  <td align="right" style={{ fontSize: "13px", fontFamily: "monospace", fontWeight: "bold", color: "#b07e3a" }}>{ipAddress}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        {/* Action Callout */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "20px", backgroundColor: "#ffffff" }}>
          <tr>
            <td>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#2d4c38", fontWeight: "bold" }}>
                Was this you?
              </h4>
              <p style={{ margin: "0", fontSize: "13px", color: "#5e6f64", lineHeight: "1.5" }}>
                If this was you, you can safely ignore this email. 
                If you did not sign in from this device, please change your password immediately to secure your profile.
              </p>
            </td>
          </tr>
        </table>

        <table width="100%" cellPadding={0} cellSpacing={0} style={{ textAlign: "center", margin: "24px 0 10px 0" }}>
          <tr>
            <td align="center">
              <a href="#" target="_blank" style={{
                backgroundColor: "#b07e3a",
                color: "#faf9f5",
                fontSize: "13px",
                fontWeight: "bold",
                textDecoration: "none",
                padding: "12px 28px",
                borderRadius: "30px",
                display: "inline-block",
                boxShadow: "0 4px 10px rgba(176, 126, 58, 0.2)"
              }}>
                Change Password
              </a>
            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default SecurityAlertEmail;
