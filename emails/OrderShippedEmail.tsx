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
  return (
    <BaseEmailLayout title="Order Shipped | Naturalist" previewText="Your organic skin remedies are on their way!">
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.orderShippedHeader} 
            alt="Your Order Has Shipped" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        {/* Hero Image */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.packageShipping} 
            alt="Your order is on its way" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block", border: 0 }} 
          />
        </div>

        <p style={{ fontSize: "15px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "15px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          Great news! We have carefully packed your Naturalist products in our 100% biodegradable, carbon-neutral packaging and dispatched them. Below are your courier tracking details:
        </p>

        {/* Tracking Details Box */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "24px", backgroundColor: "#faf9f5", marginBottom: "24px" }}>
          <tr>
            <td>
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "14px" }}>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64", paddingBottom: "8px" }}>Order ID:</td>
                  <td align="right" style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px" }}>#{orderId}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64", paddingBottom: "8px" }}>Carrier:</td>
                  <td align="right" style={{ fontSize: "14px", fontWeight: "bold", color: "#2d4c38", paddingBottom: "8px" }}>{carrier}</td>
                </tr>
                <tr>
                  <td style={{ fontSize: "14px", color: "#5e6f64" }}>Tracking Number:</td>
                  <td align="right" style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: "bold", color: "#b07e3a" }}>{trackingNumber}</td>
                </tr>
              </table>
              
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ textAlign: "center", marginTop: "10px" }}>
                <tr>
                  <td align="center">
                    <a href="#" target="_blank" style={{
                      backgroundColor: "#2d4c38",
                      color: "#faf9f5",
                      fontSize: "13px",
                      fontWeight: "bold",
                      textDecoration: "none",
                      padding: "10px 24px",
                      borderRadius: "30px",
                      display: "inline-block",
                      boxShadow: "0 4px 10px rgba(45, 76, 56, 0.15)"
                    }}>
                      Track Shipment
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style={{ fontSize: "15px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          Thank you for choosing Naturalist and supporting carbon-neutral skincare!
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default OrderShippedEmail;
