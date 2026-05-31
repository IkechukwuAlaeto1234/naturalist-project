import * as React from "react";

interface PasswordResetEmailProps {
  token: string;
  name: string;
}

export const PasswordResetEmail = ({ token, name }: PasswordResetEmailProps) => {
  return (
    <div style={{
      fontFamily: "sans-serif",
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
      border: "1px solid #e2dacd",
      borderRadius: "8px",
      backgroundColor: "#fbfbf9"
    }}>
      <h2 style={{ color: "#2d4c38", textAlign: "center", fontSize: "24px" }}>Naturalist</h2>
      <p style={{ fontSize: "16px", color: "#141f19" }}>Hi {name},</p>
      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        You requested a password reset for your Naturalist account. Please use the passcode below to complete the reset process:
      </p>
      <div style={{
        backgroundColor: "#f4efe6",
        padding: "15px",
        textAlign: "center",
        borderRadius: "6px",
        margin: "20px 0"
      }}>
        <span style={{
          fontSize: "32px",
          fontWeight: "bold",
          letterSpacing: "6px",
          color: "#2d4c38"
        }}>{token}</span>
      </div>
      <p style={{ fontSize: "14px", color: "#5e6f64" }}>
        This code is valid for 15 minutes. If you did not request this password reset, please ignore this email; your password will remain secure and unchanged.
      </p>
      <hr style={{ border: "0", borderTop: "1px solid #e2dacd", margin: "20px 0" }} />
      <p style={{ fontSize: "12px", color: "#5e6f64", textAlign: "center" }}>
        Naturalist | Premium Organic Skincare & Wellness
      </p>
    </div>
  );
};

export default PasswordResetEmail;
