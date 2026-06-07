import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface OrderShippedEmailProps {
  orderId: string;
  name: string;
  carrier?: string;
  trackingNumber?: string;
}

export const OrderShippedEmail = ({
  orderId,
  name,
  carrier = "Naturalist Eco-Courier",
  trackingNumber = "ECO-TRACK-" + Date.now(),
}: OrderShippedEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Order Shipped | Naturalist" previewText="Your organic skin remedies are on their way!">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.orderShippedHeader} 
            alt="Your Order Has Shipped" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        {/* Hero Image - Styled with Rounded corners and border */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.packageShipping} 
            alt="Your order is on its way" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "block" }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          Great news! We have carefully packed your Naturalist products in our 100% biodegradable, carbon-neutral packaging and dispatched them. Below are your courier tracking details:
        </p>

        {/* Tracking Details Box */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderRadius: "16px", backgroundColor: "#faf9f5", marginBottom: "24px" }}>
          <tr>
            <td style={{ padding: "24px" }}>
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "14px" }}>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", paddingBottom: "8px", fontFamily: sansSerifStack }}>Order ID:</td>
                  <td align="right" style={{ fontSize: "13px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px", fontFamily: sansSerifStack }}>#{orderId}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", paddingBottom: "8px", fontFamily: sansSerifStack }}>Carrier:</td>
                  <td align="right" style={{ fontSize: "13px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px", fontFamily: sansSerifStack }}>{carrier}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#5e6f64", fontFamily: sansSerifStack }}>Tracking Number:</td>
                  <td align="right" style={{ fontSize: "13px", fontFamily: "monospace", fontWeight: "bold", color: "#b07e3a" }}>{trackingNumber}</td>
                </tr>
              </table>
              
              <table align="center" cellPadding={0} cellSpacing={0} style={{ margin: "16px auto 0 auto", textAlign: "center" }}>
                <tr>
                  <td style={{ padding: "0 10px" }} align="center">
                    <a href={`__LINK_TRACK_SHIPMENT_${orderId}__`} target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                      <img src="__BTN_primary_Track Shipment__" alt="Track Shipment" width="180" style={{ display: "block", border: 0, height: "auto" }} />
                    </a>
                  </td>
                  <td style={{ padding: "0 10px" }} align="center">
                    <a href="__LINK_CONTACT_SUPPORT_shipped__" target="_blank" style={{ display: "inline-block", border: 0, textDecoration: "none" }}>
                      <img src="__BTN_secondary_Contact Support__" alt="Contact Support" width="180" style={{ display: "block", border: 0, height: "auto" }} />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          Thank you for choosing Naturalist and supporting carbon-neutral skincare!
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default OrderShippedEmail;
