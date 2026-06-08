import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

interface AdminNewOrderEmailProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  adminOrderUrl: string;
}

export const AdminNewOrderEmail = ({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  items,
  totalAmount,
  shippingAddress,
  adminOrderUrl,
}: AdminNewOrderEmailProps) => {
  const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout
      title="New Order Received | Naturalist Admin"
      previewText={`New order ${orderNumber} from ${customerName} — $${totalAmount.toFixed(2)}`}
    >
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>

        {/* Admin badge */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{
            display: "inline-block",
            backgroundColor: "#2d4c38",
            color: "#fff",
            fontSize: "10px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            padding: "5px 14px",
            borderRadius: "999px",
            fontFamily: sansSerifStack,
          }}>
            Admin Notification
          </span>
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#141f19", margin: "0 0 8px 0", textAlign: "center", fontFamily: sansSerifStack }}>
          New Order Received
        </h2>
        <p style={{ textAlign: "center", fontSize: "13px", color: "#5e6f64", margin: "0 0 28px 0", fontFamily: sansSerifStack }}>
          A customer just completed checkout on Naturalist.
        </p>

        {/* Summary Row */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "24px", borderRadius: "16px", overflow: "hidden", borderCollapse: "separate" }}>
          <tr style={{ backgroundColor: "#f4efe6" }}>
            <td style={{ padding: "16px 20px", borderBottom: "1px solid #eae5db" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#b07e3a", fontFamily: sansSerifStack }}>Order Number</p>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#141f19", fontFamily: sansSerifStack }}>{orderNumber}</p>
            </td>
            <td style={{ padding: "16px 20px", borderBottom: "1px solid #eae5db" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#b07e3a", fontFamily: sansSerifStack }}>Total Paid</p>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#2d4c38", fontFamily: sansSerifStack }}>${totalAmount.toFixed(2)}</p>
            </td>
          </tr>
        </table>

        {/* Customer Info */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "24px", borderRadius: "16px", overflow: "hidden", backgroundColor: "#faf9f5", borderCollapse: "separate" }}>
          <tr>
            <td style={{ padding: "18px 20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#2d4c38", fontFamily: sansSerifStack }}>Customer</h4>
              <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", color: "#141f19", fontFamily: sansSerifStack }}>{customerName}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#5e6f64", fontFamily: sansSerifStack }}>{customerEmail}</p>
            </td>
          </tr>
        </table>

        {/* Order Items */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "24px", borderCollapse: "separate" }}>
          <thead>
            <tr style={{ backgroundColor: "#f4efe6" }}>
              <th align="left" style={{ padding: "12px 18px", fontSize: "10px", fontWeight: "bold", color: "#2d4c38", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #eae5db", fontFamily: sansSerifStack }}>Item</th>
              <th align="center" style={{ padding: "12px 18px", fontSize: "10px", fontWeight: "bold", color: "#2d4c38", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #eae5db", width: "50px", fontFamily: sansSerifStack }}>Qty</th>
              <th align="right" style={{ padding: "12px 18px", fontSize: "10px", fontWeight: "bold", color: "#2d4c38", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #eae5db", width: "80px", fontFamily: sansSerifStack }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ backgroundColor: "#fff" }}>
                <td style={{ padding: "12px 18px", fontSize: "13px", color: "#141f19", borderBottom: "1px solid #f4efe6", fontFamily: sansSerifStack }}>{item.name}</td>
                <td align="center" style={{ padding: "12px 18px", fontSize: "13px", color: "#5e6f64", borderBottom: "1px solid #f4efe6", fontFamily: sansSerifStack }}>{item.quantity}</td>
                <td align="right" style={{ padding: "12px 18px", fontSize: "13px", color: "#141f19", borderBottom: "1px solid #f4efe6", fontWeight: "bold", fontFamily: sansSerifStack }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: "#faf9f5" }}>
              <td colSpan={2} align="right" style={{ padding: "16px 18px", fontWeight: "bold", fontSize: "11px", color: "#5e6f64", textTransform: "uppercase", letterSpacing: "1px", fontFamily: sansSerifStack }}>
                Total:
              </td>
              <td align="right" style={{ padding: "16px 18px", fontWeight: "bold", fontSize: "16px", color: "#2d4c38", fontFamily: sansSerifStack }}>
                ${totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Shipping Address */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderRadius: "16px", backgroundColor: "#faf9f5", marginBottom: "28px", borderCollapse: "separate" }}>
          <tr>
            <td style={{ padding: "18px 20px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#2d4c38", fontFamily: sansSerifStack }}>Ship To</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#5e6f64", lineHeight: "1.6", fontFamily: sansSerifStack }}>
                {shippingAddress.name}<br />
                {shippingAddress.address}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
                {shippingAddress.country}<br />
                {shippingAddress.phone}
              </p>
            </td>
          </tr>
        </table>

        {/* CTA Button */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <a
            href={adminOrderUrl}
            style={{
              display: "inline-block",
              backgroundColor: "#2d4c38",
              color: "#ffffff",
              textDecoration: "none",
              padding: "14px 32px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "0.5px",
              fontFamily: sansSerifStack,
            }}
          >
            View Order in Admin →
          </a>
        </div>

      </div>
    </BaseEmailLayout>
  );
};

export default AdminNewOrderEmail;
