import * as React from "react";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
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
      <h2 style={{ color: "#2d4c38", textAlign: "center", fontSize: "24px" }}>Welcome to Naturalist</h2>
      <p style={{ fontStyle: "italic", textAlign: "center", color: "#5e6f64", margin: "-10px 0 20px 0" }}>
        Inspired by Nature, Crafted for Glow
      </p>
      <p style={{ fontSize: "16px", color: "#141f19" }}>Hi {name},</p>
      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        Thank you for joining Naturalist! We are thrilled to welcome you to our community.
        At Naturalist, we believe skincare should be pure, intentional, and environmentally responsible.
      </p>
      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        As a special welcome gift, enjoy 10% off your very first order:
      </p>
      <div style={{
        backgroundColor: "#f4efe6",
        padding: "20px",
        borderRadius: "6px",
        textAlign: "center",
        margin: "20px 0"
      }}>
        <p style={{ margin: "0", fontSize: "14px", fontWeight: "bold", color: "#2d4c38" }}>YOUR FIRST SUBSCRIBER GIFT</p>
        <h3 style={{ margin: "5px 0", fontSize: "20px", color: "#b07e3a" }}>Get 10% Off Your First Order</h3>
        <p style={{
          margin: "10px 0 0 0",
          fontSize: "14px",
          fontFamily: "monospace",
          letterSpacing: "2px",
          color: "#2d4c38",
          fontWeight: "bold",
          background: "#ffffff",
          display: "inline-block",
          padding: "8px 15px",
          borderRadius: "4px",
          border: "1px dashed #b07e3a"
        }}>NATURALGLOW10</p>
      </div>
      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        Explore our curated collection of botanical cleansers, nourishing oils, and hydrating mist toniques!
      </p>
      <hr style={{ border: "0", borderTop: "1px solid #e2dacd", margin: "20px 0" }} />
      <p style={{ fontSize: "12px", color: "#5e6f64", textAlign: "center" }}>
        Naturalist | Premium Organic Skincare & Wellness
      </p>
    </div>
  );
};

export default WelcomeEmail;
