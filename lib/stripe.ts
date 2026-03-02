import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function createCheckoutSession({
  agencyId,
  plan,
  successUrl,
  cancelUrl,
}: {
  agencyId: string;
  plan: "starter" | "agency" | "enterprise";
  successUrl: string;
  cancelUrl: string;
}) {
  const priceMap: Record<string, string> = {
    starter: "price_starter_monthly",
    agency: "price_agency_monthly",
  };

  const priceId = priceMap[plan];
  if (!priceId) throw new Error("Invalid plan");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { agencyId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
