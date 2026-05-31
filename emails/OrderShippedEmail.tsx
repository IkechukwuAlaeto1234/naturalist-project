import * as React from "react";

interface OrderShippedEmailProps {
  orderId: string;
  name: string;
  carrier?: string;
  trackingNumber?: string;
}

export const OrderShippedEmail = ({
  orderId,
  name,
  carrier = "Naturalist Eco-Shipping",
  trackingNumber = "ECO-TRACK-" + Date.now(),
}: OrderShippedEmailProps) => {
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
      <h2 style={{ color: "#2d4c38", textAlign: "center", fontSize: "24px" }}>Your Order Has Shipped!</h2>
      <p style={{ textAlign: "center", color: "#5e6f64", margin: "-10px 0 20px 0" }}>
        Your organic skin remedies are on their way!
      </p>
      <p style={{ fontSize: "16px", color: "#141f19" }}>Hi {name},</p>
      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        Great news! We have carefully packed your Naturalist products in our 100% biodegradable packaging and dispatched them. Here are your tracking details:
      </p>
      
      <div style={{
        backgroundColor: "#f4efe6",
        border: "1px solid #e2dacd",
        borderRadius: "6px",
        padding: "20px",
        margin: "20px 0"
      }}>
        <p style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#141f19" }}>
          <strong>Order ID:</strong> #{orderId}
        </p>
        <p style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#141f19" }}>
          <strong>Carrier:</strong> {carrier}
        </p>
        <p style={{ margin: "0 0 15px 0", fontSize: "15px", color: "#141f19" }}>
          <strong>Tracking Number:</strong> <code style={{ background: "#ffffff", padding: "3px 6px", border: "1px solid #e2dacd", borderRadius: "3px" }}>{trackingNumber}</code>
        </p>
        <div style={{ textAlign: "center" }}>
          <a href="#" style={{
            background: "#2d4c38",
            color: "#fbfbf9",
            padding: "10px 20px",
            textDecoration: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            display: "inline-block"
          }}>Track Your Shipment</a>
        </div>
      </div>

      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        Thank you for choosing Naturalist and supporting carbon-neutral skincare!
      </p>
      <hr style={{ border: "0", borderTop: "1px solid #e2dacd", margin: "20px 0" }} />
      <p style={{ fontSize: "12px", color: "#5e6f64", textAlign: "center" }}>
        Naturalist | Premium Organic Skincare & Wellness
      </p>
    </div>
  );
};

export default OrderShippedEmail;
