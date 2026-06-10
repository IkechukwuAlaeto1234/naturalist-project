import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface EmailSubscriptionEmailProps {
  name: string;
}

export const EmailSubscriptionEmail = ({ name }: EmailSubscriptionEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Welcome to the Naturalist Circle" previewText="Thank you for subscribing to our newsletter.">
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
            alt="Welcome to the Naturalist Newsletter Circle" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "block" }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          Thank you for subscribing to the Naturalist newsletter! We are thrilled to welcome you to our circle of botanical enthusiasts. 
          By joining us, you will receive regular updates on skincare rituals, clean botanical ingredient deep dives, and limited-edition product drops.
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 20px 0", lineHeight: "1.6" }}>
          As a special thank you for joining our newsletter list, enjoy a <strong>10% discount</strong> on your next order with the coupon below:
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
          Start exploring our collection of hand-crafted botanical cleansing milks, active serums, and nourishing face oils!
        </p>

        {/* Horizontal Primary and Secondary High-Fidelity Buttons */}
        <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "24px auto 32px auto", textAlign: "center" }}>
          <tr>
            <td style={{ padding: "0 10px" }} align="center">
              <a href="__LINK_SHOP__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                <img src="__BTN_primary_Shop Collection__" alt="Shop Collection" width="180" style={{ display: "block", border: 0, height: "auto" }} />
              </a>
            </td>
          </tr>
        </table>

        {/* Brand Promises Section */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ paddingTop: "32px" }}>
          <tr>
            <td>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#2d4c38", margin: "0 0 20px 0", letterSpacing: "-0.3px", textTransform: "uppercase" }}>
                What to expect from us
              </h3>
              
              {/* Promise 1 */}
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px" }}>
                <tr>
                  <td valign="top" style={{ width: "28px", fontSize: "18px", lineHeight: "24px" }}>🌱</td>
                  <td style={{ paddingLeft: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38" }}>Botanical Spotlights</div>
                    <div style={{ fontSize: "13px", color: "#5e6f64", marginTop: "2px", lineHeight: "1.5" }}>
                      Get inside details on active herbal ingredients, sourcing, and their unique benefits for your skin barrier.
                    </div>
                  </td>
                </tr>
              </table>

              {/* Promise 2 */}
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px" }}>
                <tr>
                  <td valign="top" style={{ width: "28px", fontSize: "18px", lineHeight: "24px" }}>📦</td>
                  <td style={{ paddingLeft: "12px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38" }}>Early Access & Circle Offers</div>
                    <div style={{ fontSize: "13px", color: "#5e6f64", marginTop: "2px", lineHeight: "1.5" }}>
                      Subscribers are first in line for product launches, restocks, and unique botanical blends.
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

export default EmailSubscriptionEmail;
