import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  const sansSerifStack = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const serifStack = "'Playfair Display', Georgia, 'Times New Roman', serif";

  return (
    <BaseEmailLayout title="Welcome to Naturalist | Premium Skincare" previewText="Inspired by Nature, Crafted for Glow.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading */}
        <h1 style={{ fontFamily: serifStack, fontSize: "24px", fontWeight: "900", color: "#2d4c38", margin: "0 0 6px 0", textAlign: "center", lineHeight: "1.3" }}>
          Welcome to Naturalist
        </h1>
        <p style={{ fontStyle: "italic", textAlign: "center", color: "#5e6f64", margin: "0 0 24px 0", fontSize: "13px" }}>
          Inspired by Nature, Crafted for Glow
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          Thank you for joining Naturalist! We are absolutely thrilled to welcome you to our community. 
          At Naturalist, we believe skincare should be pure, intentional, and environmentally responsible.
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          To celebrate your journey with us, here is a special subscriber gift for <strong>10% off</strong> your very first order:
        </p>

        {/* Gift Card Promo Block */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "24px 0", backgroundColor: "#faf9f5", border: "1px dashed #b07e3a", borderRadius: "16px", textAlign: "center" }}>
          <tr>
            <td style={{ padding: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#2d4c38", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
                YOUR FIRST SUBSCRIBER GIFT
              </div>
              <div style={{ fontFamily: serifStack, fontSize: "20px", fontWeight: "bold", color: "#b07e3a", marginBottom: "16px" }}>
                Get 10% Off Your First Purchase
              </div>
              <div style={{
                fontFamily: "monospace",
                fontSize: "16px",
                letterSpacing: "3px",
                color: "#2d4c38",
                fontWeight: "bold",
                backgroundColor: "#ffffff",
                display: "inline-block",
                padding: "10px 24px",
                borderRadius: "8px",
                border: "1px solid #e2dacd",
                boxShadow: "0 2px 8px rgba(45, 76, 56, 0.01)"
              }}>
                NATURALGLOW10
              </div>
            </td>
          </tr>
        </table>

        <p style={{ fontSize: "15px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          Explore our curated collection of botanical cleansers, nourishing face oils, and hydrating mist toniques! We cannot wait to hear about your skincare transformation.
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
                Shop Collection
              </a>
            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default WelcomeEmail;