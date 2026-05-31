import * as React from "react";

interface OrderConfirmationEmailProps {
  orderId: string;
  name: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export const OrderConfirmationEmail = ({
  orderId,
  name,
  items,
  totalAmount,
  shippingAddress,
}: OrderConfirmationEmailProps) => {
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
      <h2 style={{ color: "#2d4c38", textAlign: "center", fontSize: "24px" }}>Order Confirmed</h2>
      <p style={{ textAlign: "center", color: "#5e6f64", margin: "-10px 0 20px 0" }}>
        Thank you for your purchase from Naturalist!
      </p>
      <p style={{ fontSize: "16px", color: "#141f19" }}>Hi {name},</p>
      <p style={{ fontSize: "16px", color: "#141f19", lineHeight: "1.5" }}>
        We have received your order and are currently processing it. Here are your order details:
      </p>
      
      <div style={{ border: "1px solid #e2dacd", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ backgroundColor: "#f4efe6", padding: "10px 15px", fontWeight: "bold", borderBottom: "1px solid #e2dacd" }}>
          Order ID: #{orderId}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2dacd", textAlign: "left" }}>
              <th style={{ padding: "10px 15px", fontSize: "14px" }}>Item</th>
              <th style={{ padding: "10px 15px", fontSize: "14px", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "10px 15px", fontSize: "14px", textAlign: "right" }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #e2dacd" }}>
                <td style={{ padding: "10px 15px", fontSize: "14px" }}>{item.name}</td>
                <td style={{ padding: "10px 15px", fontSize: "14px", textAlign: "center" }}>{item.quantity}</td>
                <td style={{ padding: "10px 15px", fontSize: "14px", textAlign: "right" }}>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ padding: "15px 15px 10px 15px", fontWeight: "bold", fontSize: "14px", textAlign: "right" }}>
                Total Paid:
              </td>
              <td style={{ padding: "15px 15px 10px 15px", fontWeight: "bold", fontSize: "16px", color: "#2d4c38", textAlign: "right" }}>
                ${totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ border: "1px solid #e2dacd", borderRadius: "6px", padding: "15px", backgroundColor: "#ffffff" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#2d4c38" }}>Shipping Address</h4>
        <p style={{ margin: "0", fontSize: "14px", color: "#5e6f64", lineHeight: "1.4" }}>
          {shippingAddress.address}<br />
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
          {shippingAddress.country}
        </p>
      </div>

      <hr style={{ border: "0", borderTop: "1px solid #e2dacd", margin: "20px 0" }} />
      <p style={{ fontSize: "12px", color: "#5e6f64", textAlign: "center" }}>
        Naturalist | Premium Organic Skincare & Wellness
      </p>
    </div>
  );
};

export default OrderConfirmationEmail;
