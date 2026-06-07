import * as React from "react";
import { BaseEmailLayout } from "./BaseEmailLayout";
import { EMAIL_ASSETS } from "./assets";

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
  const sansSerifStack = "Verdana, Geneva, sans-serif";

  return (
    <BaseEmailLayout title="Order Confirmed | Naturalist" previewText="Thank you for your purchase from Naturalist!">
      <div style={{ fontFamily: sansSerifStack, color: "#141f19" }}>
        
        {/* Title / Heading Image */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.confirmOrderHeader} 
            alt="Confirm your order" 
            width="280" 
            style={{ maxWidth: "100%", height: "auto", display: "inline-block", border: 0 }} 
          />
        </div>

        {/* Hero Image */}
        <div style={{ marginBottom: "24px" }}>
          <img 
            src={EMAIL_ASSETS.plantGifts} 
            alt="Thank you for your purchase" 
            style={{ width: "100%", height: "auto", borderRadius: "12px", border: "1px solid #eae5db", display: "block" }} 
          />
        </div>

        <p style={{ fontSize: "14px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
          Hi <strong>{name}</strong>,
        </p>

        <p style={{ fontSize: "14px", margin: "0 0 24px 0", lineHeight: "1.6" }}>
          We have successfully received your order and our botanical specialists are currently preparing your shipment. Below is your detailed receipt:
        </p>

        {/* Invoice Itemized Table */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", overflow: "hidden", marginBottom: "24px", width: "100%", borderCollapse: "separate" }}>
          <thead>
            <tr style={{ backgroundColor: "#faf9f5" }}>
              <th align="left" style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "bold", color: "#2d4c38", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2dacd", fontFamily: sansSerifStack }}>Item</th>
              <th align="center" style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "bold", color: "#2d4c38", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2dacd", width: "50px", fontFamily: sansSerifStack }}>Qty</th>
              <th align="right" style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "bold", color: "#2d4c38", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2dacd", width: "80px", fontFamily: sansSerifStack }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: "14px 18px", fontSize: "13px", color: "#141f19", borderBottom: "1px solid #f4efe6", fontFamily: sansSerifStack }}>{item.name}</td>
                <td align="center" style={{ padding: "14px 18px", fontSize: "13px", color: "#5e6f64", borderBottom: "1px solid #f4efe6", fontFamily: sansSerifStack }}>{item.quantity}</td>
                <td align="right" style={{ padding: "14px 18px", fontSize: "13px", color: "#141f19", borderBottom: "1px solid #f4efe6", fontWeight: "bold", fontFamily: sansSerifStack }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} align="right" style={{ padding: "18px 18px", fontWeight: "bold", fontSize: "12px", color: "#5e6f64", textTransform: "uppercase", letterSpacing: "1px", fontFamily: sansSerifStack }}>
                Total Paid:
              </td>
              <td align="right" style={{ padding: "18px 18px", fontWeight: "bold", fontSize: "16px", color: "#2d4c38", fontFamily: sansSerifStack }}>
                ${totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Shipping Address Detail Box */}
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ border: "1px solid #e2dacd", borderRadius: "16px", padding: "20px", backgroundColor: "#ffffff" }}>
          <tr>
            <td>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#2d4c38", fontWeight: "bold" }}>
                Delivery Address
              </h4>
              <p style={{ margin: "0", fontSize: "13px", color: "#5e6f64", lineHeight: "1.5", fontFamily: sansSerifStack }}>
                <strong>{name}</strong><br />
                {shippingAddress.address}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
                {shippingAddress.country}
              </p>
            </td>
          </tr>
        </table>

        <p style={{ fontSize: "13px", color: "#5e6f64", margin: "24px 0 0 0", textAlign: "center", lineHeight: "1.5" }}>
          You will receive a shipment notification email containing a tracking number once your package has left our apothecary warehouse.
        </p>

      </div>
    </BaseEmailLayout>
  );
};

export default OrderConfirmationEmail;
