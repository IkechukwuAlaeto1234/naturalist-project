import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";

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
  return (
    <BaseEmailLayout title="Security Alert: New Sign In | Naturalist" previewText="We detected a new sign in to your Naturalist profile.">
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "#141f19" }}>
        
        {/* Title / Heading */}
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "24px", fontWeight: "900", color: "#2d4c38", margin: "0 0 6px 0", textAlign: "center", lineHeight: "1.3" }}>
          Security Alert
        </h1>
        <p style={{ textAlign: "center", color: "#b07e3a", margin: "0 0 24px 0", fontSize: "13px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>
          New Login Detected
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          We detected a new sign in to your Naturalist account from a browser or device we haven't seen before. Please verify these details:
        </p>

        {/* Security Alert Info Box */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "24px", backgroundColor: "#faf9f5", marginBottom: "24px" }}>
          <tr>
            <td>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64", paddingBottom: "8px" }}>Device / Browser:</td>
                  <td align="right" style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px" }}>{device}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64", paddingBottom: "8px" }}>Location:</td>
                  <td align="right" style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px" }}>{location}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64", paddingBottom: "8px" }}>Time:</td>
                  <td align="right" style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px" }}>{time}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64" }}>IP Address:</td>
                  <td align="right" style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: "bold", color: "#b07e3a" }}>{ipAddress}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        {/* Action Callout */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "20px", backgroundColor: "#ffffff" }}>
          <tr>
            <td>
              <h4 style={{ margin: "0 0 8px 0", fontFamily: "'Playfair Display', Georgia, serif", fontSize: "15px", color: "#2d4c38", fontWeight: "bold" }}>
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
