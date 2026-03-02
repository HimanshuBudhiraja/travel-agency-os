"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

const GRID_SVG = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40' fill='none' stroke='rgb(255 255 255 / 0.04)'%3e%3cpath d='M0 .5H39.5V40'/%3e%3c/svg%3e")`;

const plans = [
  {
    name: "Starter",
    price: "$299",
    period: "/month",
    description: "For solo agents and freelancers",
    highlight: false,
    badge: null,
    features: [
      "1 user seat",
      "WhatsApp + Email inbox",
      "AI itinerary builder (50/mo)",
      "Basic CRM — up to 500 clients",
      "Automated follow-up sequences",
      "PDF + web proposal export",
      "Standard email support",
    ],
    notIncluded: ["Booking operations monitor", "Supplier intelligence", "API access"],
    cta: "Start free trial",
    ctaLink: "/sign-up",
  },
  {
    name: "Agency",
    price: "$799",
    period: "/month",
    description: "For teams of 2–10 agents",
    highlight: true,
    badge: "Most popular",
    features: [
      "Up to 10 user seats",
      "All channels incl. Instagram DMs",
      "Unlimited AI itinerary generation",
      "Full CRM — unlimited clients",
      "Booking operations monitor",
      "Supplier intelligence module",
      "REST API access + webhooks",
      "Priority support",
    ],
    notIncluded: ["Agency-specific AI fine-tuning", "White-label"],
    cta: "Start free trial",
    ctaLink: "/sign-up",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For chains, franchises, and networks",
    highlight: false,
    badge: null,
    features: [
      "Unlimited seats",
      "Agency-specific AI fine-tuning",
      "White-label — custom domain + brand",
      "Multi-branch management dashboard",
      "Custom AI persona name and style",
      "Dedicated customer success manager",
      "99.9% uptime SLA",
      "On-premise deployment option",
    ],
    notIncluded: [],
    cta: "Talk to sales",
    ctaLink: "mailto:sales@travelosapp.com",
  },
];

const faqs = [
  {
    q: "How does the 30-day free trial work?",
    a: "You get full access to all features on your chosen plan for 30 days. No credit card required. After 30 days, you can choose to subscribe or your account will be paused.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes — you can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.",
  },
  {
    q: "What is the 0.5% transaction fee?",
    a: "The optional transaction add-on charges 0.5% on bookings confirmed and paid through TravelOS's built-in payment processing. You can also use your own payment processor with no transaction fee.",
  },
  {
    q: "How does AI get smarter over time?",
    a: "The Agency Brain continuously learns from your agency's data — quote outcomes, client preferences, agent overrides, and supplier performance. Each week it improves its predictions and recommendations for your specific market.",
  },
  {
    q: "Is my agency data shared with other agencies?",
    a: "Never. Each agency is a completely isolated tenant. Your clients, quotes, and operational data are never shared with or used to train models for other agencies.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export all your data at any time — clients, quotes, bookings, and conversation history. After cancellation, your data is retained for 90 days then permanently deleted.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">TravelOS</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
              API Docs
            </Link>
            <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-white text-[#0a0a0a] text-sm px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="pt-20 pb-16 text-center px-6"
        style={{ backgroundImage: GRID_SVG }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
            Pricing
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-white/50 max-w-xl mx-auto">
            30-day free trial on all plans. No minimum commitment. No credit card required.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlight
                  ? "bg-white text-[#0a0a0a]"
                  : "border border-white/10 bg-white/5"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              <p
                className={`text-sm font-medium mb-1 ${
                  plan.highlight ? "text-gray-500" : "text-white/50"
                }`}
              >
                {plan.name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span
                  className={`text-5xl font-bold ${
                    plan.highlight ? "text-[#0a0a0a]" : "text-white"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-sm mb-1.5 ${
                    plan.highlight ? "text-gray-400" : "text-white/40"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`text-sm mb-6 ${
                  plan.highlight ? "text-gray-500" : "text-white/40"
                }`}
              >
                {plan.description}
              </p>

              <div className="mb-6">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                    plan.highlight ? "text-gray-400" : "text-white/30"
                  }`}
                >
                  Included
                </p>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex-shrink-0 font-medium ${
                          plan.highlight ? "text-blue-600" : "text-blue-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={plan.highlight ? "text-gray-700" : "text-white/60"}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                {plan.notIncluded.length > 0 && (
                  <ul className="space-y-2 mt-3">
                    {plan.notIncluded.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2.5 text-sm opacity-40`}
                      >
                        <span className="mt-0.5 flex-shrink-0">✕</span>
                        <span
                          className={plan.highlight ? "text-gray-500" : "text-white/50"}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href={plan.ctaLink}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlight
                    ? "bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]"
                    : "bg-white text-[#0a0a0a] hover:bg-white/90"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Transaction add-on */}
        <div className="mt-8 border border-white/10 rounded-2xl p-6 text-center">
          <p className="font-semibold text-white mb-1">Optional: Performance add-on</p>
          <p className="text-white/50 text-sm">
            Add a <strong className="text-white">0.5% transaction fee</strong> on bookings
            processed through TravelOS payments — only pay when you earn. Available on all plans.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-[#0f0f0f] border-t border-white/10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Compare plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left pb-4 text-white/40 font-medium">Feature</th>
                  <th className="text-center pb-4 text-white/60 font-semibold">Starter</th>
                  <th className="text-center pb-4 text-blue-400 font-semibold">Agency</th>
                  <th className="text-center pb-4 text-white/60 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["User seats", "1", "Up to 10", "Unlimited"],
                  ["WhatsApp + Email inbox", "✓", "✓", "✓"],
                  ["Instagram DMs", "—", "✓", "✓"],
                  ["AI itinerary builder", "50/mo", "Unlimited", "Unlimited"],
                  ["CRM clients", "500", "Unlimited", "Unlimited"],
                  ["Booking ops monitor", "—", "✓", "✓"],
                  ["Supplier intelligence", "—", "✓", "✓"],
                  ["REST API + webhooks", "—", "✓", "✓"],
                  ["Agency AI fine-tuning", "—", "—", "✓"],
                  ["White-label", "—", "—", "✓"],
                  ["SLA uptime", "99%", "99.5%", "99.9%"],
                  ["Support", "Email", "Priority", "Dedicated CSM"],
                ].map(([feature, starter, agency, enterprise]) => (
                  <tr key={feature}>
                    <td className="py-3 text-white/50">{feature}</td>
                    <td className="py-3 text-center text-white/50">{starter}</td>
                    <td className="py-3 text-center text-blue-400 font-medium">{agency}</td>
                    <td className="py-3 text-center text-white/50">{enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#0a0a0a] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-white/10">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  className="w-full flex items-center justify-between gap-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-white text-sm">{faq.q}</span>
                  <span
                    className={`text-white/40 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-white/50 text-sm leading-relaxed pr-8">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 text-center px-6 border-t border-white/10"
        style={{ backgroundImage: GRID_SVG }}
      >
        <h2 className="text-4xl font-bold text-white mb-4">Ready to try it?</h2>
        <p className="text-white/50 mb-8 text-lg">
          30 days free. No credit card. Cancel anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="bg-white text-[#0a0a0a] px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors inline-block"
          >
            Start your free trial
          </Link>
          <a
            href="mailto:sales@travelosapp.com"
            className="border border-white/15 text-white/60 px-8 py-4 rounded-xl font-medium hover:border-white/30 hover:text-white transition-all inline-block"
          >
            Talk to sales
          </a>
        </div>
      </section>
    </div>
  );
}
