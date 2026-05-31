import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2022-11-15" as any, // Ensure compatibility with key versions
    })
  : null;

export interface CreateCheckoutSessionParams {
  orderId: string;
  items: Array<{
    name: string;
    price: number; // in USD
    quantity: number;
    images?: string[];
  }>;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Creates a Stripe Checkout Session for order payments
 */
export async function createCheckoutSession({
  orderId,
  items,
  customerEmail,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  if (!stripe) {
    // If Stripe is not configured, simulate success path or throw
    console.warn("Stripe is not configured. Simulating checkout url.");
    return {
      id: `sim_session_${Date.now()}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/order-confirmation?session_id=sim_session_${Date.now()}&order_id=${orderId}`,
    };
  }

  const lineItems = items.map((item) => {
    // Determine image URL - if it starts with /cdn or /images, construct full public URL so Stripe can fetch it
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const imageUrl = item.images?.[0]
      ? item.images[0].startsWith("http")
        ? item.images[0]
        : `${appUrl}${item.images[0]}`
      : undefined;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: imageUrl ? [imageUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    customer_email: customerEmail,
    client_reference_id: orderId,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      orderId,
    },
  });

  return {
    id: session.id,
    url: session.url,
  };
}

/**
 * Validates Stripe webhook payload signatures
 */
export function verifyStripeWebhook(payload: string, signature: string) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe or Stripe Webhook Secret is not configured");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
