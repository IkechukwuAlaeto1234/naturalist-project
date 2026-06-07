import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";
  const serifStack = "Georgia, Cambria, 'Times New Roman', Times, serif";

  return (
    <BaseEmailLayout title="Welcome to Naturalist | Premium Skincare" previewText="Inspired by Nature, Crafted for Glow.">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.welcomeHeader} 
            alt="Welcome to Naturalist" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        {/* Hero Image - Styled with Rounded corners and border */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.taskManagement} 
            alt="Welcome to the Naturalist family" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "block" }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          Thank you for joining Naturalist! We are absolutely thrilled to welcome you to our community. 
          At Naturalist, we believe skincare should be pure, intentional, and environmentally responsible.
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          To celebrate your journey with us, here is a special subscriber gift for <strong>10% off</strong> your very first order:
        </p>

        {/* Gift Card Promo Block - Dynamic High Fidelity Image */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "24px 0", textAlign: "center" }}>
          <tr>
            <td align="center">
              <img 
                src="__VOUCHER_Your First Subscriber Gift|Get 10% Off Your First Purchase|NATURALGLOW10__" 
                alt="10% Off First Purchase: NATURALGLOW10" 
                width="520"
                style={{ display: "block", maxWidth: "100%", height: "auto", border: 0 }}
              />
            </td>
          </tr>
        </table>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          Explore our curated collection of botanical cleansers, nourishing face oils, and hydrating mist toniques! We cannot wait to hear about your skincare transformation.
        </p>

        {/* Horizontal Primary and Secondary High-Fidelity Buttons */}
        <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto 32px auto", textAlign: "center" }}>
          <tr>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_SHOP__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_primary_Shop Collection__" alt="Shop Collection" width="180" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_BEST_SELLERS__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_secondary_Browse Best Sellers__" alt="Browse Best Sellers" width="220" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
          </tr>
        </table>

        {/* Brand Promises Section (Redesigned Editorial Style) */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ paddingTop: "32px" }}>
          <tr>
            <td>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#2d4c38", margin: "0 0 20px 0", letterSpacing: "-0.3px", textTransform: "uppercase" }}>
                Our Brand Promises
              </h3>
              
              {/* Promise 1 */}
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px" }}>
                <tr>
                  <td valign="top" style={{ width: "28px", fontSize: "18px", lineHeight: "24px" }}>🌱</td>
                  <td style={{ paddingLeft: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38" }}>100% Organic Ingredients</div>
                    <div style={{ fontSize: "13px", color: "#5e6f64", marginTop: "2px", lineHeight: "1.5" }}>
                      We source our botanicals from ethical, local growers. Every batch is vegan, pure, and cruelty-free.
                    </div>
                  </td>
                </tr>
              </table>

              {/* Promise 2 */}
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px" }}>
                <tr>
                  <td valign="top" style={{ width: "28px", fontSize: "18px", lineHeight: "24px" }}>📦</td>
                  <td style={{ paddingLeft: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38" }}>Sustainable Packaging</div>
                    <div style={{ fontSize: "13px", color: "#5e6f64", marginTop: "2px", lineHeight: "1.5" }}>
                      Our packaging is 100% recyclable, utilizing amber glass bottles and biodegradable paper boxes.
                    </div>
                  </td>
                </tr>
              </table>

              {/* Promise 3 */}
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tr>
                  <td valign="top" style={{ width: "28px", fontSize: "18px", lineHeight: "24px" }}>🧪</td>
                  <td style={{ paddingLeft: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38" }}>Dermatologist Approved</div>
                    <div style={{ fontSize: "13px", color: "#5e6f64", marginTop: "2px", lineHeight: "1.5" }}>
                      Developed in partnership with skincare experts to ensure clinical efficacy and gentle care for sensitive skin.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </div>
    </BaseEmailLayout>
  );
};

export default WelcomeEmail;