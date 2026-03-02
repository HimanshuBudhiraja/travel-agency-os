"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

const GRID_SVG = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40' fill='none' stroke='rgb(255 255 255 / 0.04)'%3e%3cpath d='M0 .5H39.5V40'/%3e%3c/svg%3e")`;

const stats = [
  { value: "80%", label: "Tasks automated by AI" },
  { value: "3×", label: "Faster quote turnaround" },
  { value: "40%", label: "Higher lead conversion" },
  { value: "<60s", label: "AI response time" },
];

const problems = [
  { stat: "$150K", label: "Average annual revenue lost to slow follow-ups" },
  { stat: "73%", label: "Travel leads go cold within 24 hours of inquiry" },
  { stat: "4 hrs", label: "An agent's day lost to repetitive admin tasks" },
  { stat: "8 tools", label: "Average agency cobbles together daily — none talk to each other" },
];

const modules = [
  {
    emoji: "🧠",
    title: "Agency Brain",
    tag: "AI Core",
    color: "from-violet-500/10 to-violet-500/5",
    border: "border-violet-500/20",
    tagColor: "bg-violet-500/10 text-violet-300",
    description:
      "Proprietary AI that learns your agency's unique patterns — your wins, client preferences, agent styles, and supplier relationships. Gets smarter every week.",
  },
  {
    emoji: "💬",
    title: "Omnichannel Inbox",
    tag: "Communication",
    color: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20",
    tagColor: "bg-blue-500/10 text-blue-300",
    description:
      "WhatsApp, Email, and Web Chat in one unified inbox. AI handles 80% of inquiries in under 60 seconds — 24/7, in any language.",
  },
  {
    emoji: "✈️",
    title: "AI Itinerary Builder",
    tag: "Proposals",
    color: "from-emerald-500/10 to-emerald-500/5",
    border: "border-emerald-500/20",
    tagColor: "bg-emerald-500/10 text-emerald-300",
    description:
      "Turn a one-line brief into a full day-by-day itinerary with live hotel pricing, margin calculator, PDF export, and shareable web proposal — in 3 minutes.",
  },
  {
    emoji: "🚀",
    title: "Autonomous Sales Engine",
    tag: "Revenue",
    color: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-500/20",
    tagColor: "bg-amber-500/10 text-amber-300",
    description:
      "AI follows up on every quote, detects buying signals, re-engages cold leads, and guides clients to payment — without agent intervention.",
  },
  {
    emoji: "👥",
    title: "AI-Native CRM",
    tag: "Clients",
    color: "from-pink-500/10 to-pink-500/5",
    border: "border-pink-500/20",
    tagColor: "bg-pink-500/10 text-pink-300",
    description:
      "Living client intelligence that auto-enriches profiles, scores leads, predicts conversion probability, and surfaces the right client at the right moment.",
  },
  {
    emoji: "📋",
    title: "Booking Ops Monitor",
    tag: "Operations",
    color: "from-teal-500/10 to-teal-500/5",
    border: "border-teal-500/20",
    tagColor: "bg-teal-500/10 text-teal-300",
    description:
      "Post-booking automation: flight change alerts, pre-trip comms, voucher delivery, and cancellation workflows — fully autonomous.",
  },
  {
    emoji: "🏨",
    title: "Supplier Intelligence",
    tag: "Procurement",
    color: "from-rose-500/10 to-rose-500/5",
    border: "border-rose-500/20",
    tagColor: "bg-rose-500/10 text-rose-300",
    description:
      "AI tracks supplier reliability, benchmarks rates, and routes bookings to best-performing suppliers per destination and budget tier.",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect in 10 minutes",
    desc: "Link WhatsApp Business, Gmail or Outlook, and your web chat. No engineers. No API keys to manage. Works out of the box.",
    detail: "Average setup time: 8 minutes",
  },
  {
    n: "02",
    title: "AI learns your agency",
    desc: "Upload past quotes, client history, and supplier preferences. Agency Brain builds a private intelligence model unique to your business.",
    detail: "Training completes in 24 hours",
  },
  {
    n: "03",
    title: "Watch it work",
    desc: "From the next inquiry, AI qualifies leads, builds proposals, follows up, and monitors bookings — while your team focuses on high-value relationships.",
    detail: "First AI reply within 60 seconds",
  },
];

const testimonials = [
  {
    quote:
      "We used to spend 8+ hours a week on WhatsApp alone. TravelOS cut that to 30 minutes. Aria handles the first touch and qualifies every lead before we even see it.",
    name: "Priya Sharma",
    title: "Co-founder, Wanderlux Travel",
    location: "London, UK",
    avatar: "PS",
    metric: "8hrs → 30min on WhatsApp",
  },
  {
    quote:
      "First month on TravelOS: we generated 3× more quotes with the same team. The AI itinerary builder alone is worth the price — what took us 2 hours now takes 4 minutes.",
    name: "Khalid Al-Rasheed",
    title: "CEO, Horizon Journeys",
    location: "Dubai, UAE",
    avatar: "KA",
    metric: "3× more quotes, same team",
  },
  {
    quote:
      "I was skeptical about AI. But TravelOS is genuinely different — it knows our clients, our suppliers, our pricing. It&apos;s not generic AI. It&apos;s our agency&apos;s AI.",
    name: "Maria Fernández",
    title: "Owner, Sol & Luna Travel",
    location: "Miami, FL",
    avatar: "MF",
    metric: "40% conversion lift",
  },
];

const faqs = [
  {
    q: "How does the 30-day free trial work?",
    a: "Full access to all features on your chosen plan for 30 days — no credit card, no commitment. If you love it, you subscribe. If not, your account pauses and you keep your data.",
  },
  {
    q: "How long does it take to go live?",
    a: "Most agencies are live in under 10 minutes. Connect your WhatsApp and email, upload existing client data (optional), and your AI is already working on the next inquiry.",
  },
  {
    q: "Is my data shared with other agencies?",
    a: "Never. Each agency is a completely isolated tenant. Your clients, quotes, conversations, and supplier data are never shared with or used to train models for other agencies.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes, at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle.",
  },
  {
    q: "Does TravelOS work with our existing WhatsApp Business number?",
    a: "Yes. We connect directly to your existing WhatsApp Business API account via Twilio. You keep your existing number and all conversation history.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export everything — clients, quotes, bookings, and conversation history — at any time. After cancellation, data is retained for 90 days then permanently deleted.",
  },
];

const integrations = [
  "WhatsApp Business",
  "Gmail",
  "Outlook",
  "Stripe",
  "RateHawk",
  "Duffel Airlines",
  "Twilio",
  "SendGrid",
  "Pinecone",
  "OpenAI GPT-4o",
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    description: "Solo agents & freelancers",
    highlight: false,
    badge: null,
    features: [
      "1 user seat",
      "WhatsApp + Email inbox",
      "AI itinerary builder (50/mo)",
      "CRM — up to 500 clients",
      "Automated follow-up sequences",
      "PDF + web proposal export",
      "Standard email support",
    ],
    cta: "Start free trial",
    href: "/sign-up",
  },
  {
    name: "Agency",
    price: "$799",
    period: "/mo",
    description: "Teams of 2–10 agents",
    highlight: true,
    badge: "Most popular",
    features: [
      "Up to 10 user seats",
      "All channels incl. Instagram DMs",
      "Unlimited AI itineraries",
      "Full CRM — unlimited clients",
      "Booking operations monitor",
      "Supplier intelligence module",
      "REST API access + webhooks",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/sign-up",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Chains, franchises & networks",
    highlight: false,
    badge: null,
    features: [
      "Unlimited seats",
      "Agency-specific AI fine-tuning",
      "White-label — custom domain + brand",
      "Multi-branch management dashboard",
      "Custom AI persona name & style",
      "Dedicated success manager",
      "99.9% uptime SLA",
      "On-premise deployment option",
    ],
    cta: "Talk to sales",
    href: "mailto:sales@travelosapp.com",
  },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">TravelOS</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#product" className="text-sm text-white/60 hover:text-white transition-colors">
                Product
              </Link>
              <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors">
                API Docs
              </Link>
              <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors">
                Sign in
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/sign-up"
                className="bg-white text-[#0a0a0a] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            <button
              className="md:hidden p-2 text-white/60"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-5 space-y-1.5">
                <div
                  className={`h-0.5 bg-current transition-transform duration-200 ${
                    mobileOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <div
                  className={`h-0.5 bg-current transition-opacity duration-200 ${
                    mobileOpen ? "opacity-0" : ""
                  }`}
                />
                <div
                  className={`h-0.5 bg-current transition-transform duration-200 ${
                    mobileOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0a0a0a] px-4 py-6 flex flex-col gap-5">
            <Link href="#product" className="text-sm text-white/70">Product</Link>
            <Link href="/pricing" className="text-sm text-white/70">Pricing</Link>
            <Link href="/docs" className="text-sm text-white/70">API Docs</Link>
            <Link href="/sign-in" className="text-sm text-white/70">Sign in</Link>
            <Link
              href="/sign-up"
              className="bg-white text-[#0a0a0a] px-4 py-2.5 rounded-lg text-sm font-semibold text-center"
            >
              Start free trial
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={{ backgroundImage: GRID_SVG }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 rounded-full px-4 py-1.5 mb-10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs text-white/70 font-medium">
              Now in early access — 30 days free, no credit card required
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-8 max-w-4xl mx-auto">
            The OS for{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #c084fc 100%)",
              }}
            >
              AI-native
            </span>{" "}
            travel agencies
          </h1>

          <p className="text-xl text-white/50 leading-relaxed mb-12 max-w-2xl mx-auto">
            Agency Brain responds to WhatsApp in under 60 seconds. Itineraries built in 3
            minutes. Bookings monitored 24/7. Your agents focus on closing — AI handles
            everything else.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
            <Link
              href="/sign-up"
              className="bg-white text-[#0a0a0a] px-8 py-4 rounded-xl text-base font-semibold hover:bg-white/90 transition-all shadow-xl shadow-white/10"
            >
              Start your free trial →
            </Link>
            <Link
              href="/docs"
              className="border border-white/15 text-white/70 px-8 py-4 rounded-xl text-base font-medium hover:border-white/30 hover:text-white transition-all"
            >
              View API docs
            </Link>
          </div>

          {/* Terminal demo */}
          <div className="max-w-3xl mx-auto text-left rounded-2xl border border-white/10 bg-[#111]/60 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-white/30 font-mono">agency-brain — live</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-3">
              <div className="text-white/30 text-xs">// WhatsApp inbound — 02:14 AM</div>
              <div className="flex gap-3">
                <span className="text-blue-400 flex-shrink-0">client</span>
                <span className="text-white/70">
                  &quot;Hi, looking for Bali trip for 4 people, 10 days in July, budget around $8000&quot;
                </span>
              </div>
              <div className="text-white/20 text-xs border-t border-white/5 pt-3">
                // Agency Brain processing — 3.2s
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 flex-shrink-0">intent</span>
                <span className="text-white/60">
                  destination=Bali · dates=July 2026 · budget=$8k · pax=4
                </span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 flex-shrink-0">score</span>
                <span className="text-emerald-400 font-semibold">HOT</span>
                <span className="text-white/40">· estimated value $7,600 · confidence 0.94</span>
              </div>
              <div className="flex gap-3">
                <span className="text-yellow-400 flex-shrink-0">actions</span>
                <span className="text-white/50">create_lead · enrich_profile · send_reply</span>
              </div>
              <div className="text-white/20 text-xs border-t border-white/5 pt-3">
                // Aria replied in 38 seconds
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 flex-shrink-0">aria</span>
                <span className="text-white/70">
                  &quot;Hi! Bali in July for 4 — love it. I&apos;ve got some stunning options in that
                  range. Are you thinking villas or resort, and do you prefer Seminyak or
                  Ubud?&quot;
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-5xl font-bold text-[#0a0a0a] mb-2">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-4">
              The broken status quo
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Legacy agency tools
              <br />
              are costing you a fortune
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((p) => (
              <div key={p.stat} className="border border-white/8 rounded-2xl p-6 bg-white/3">
                <p className="text-4xl font-bold text-red-400 mb-3">{p.stat}</p>
                <p className="text-white/60 text-sm leading-relaxed">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution banner ───────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-3xl sm:text-4xl font-bold text-white leading-snug">
            TravelOS replaces 8 disconnected tools with one
            <br className="hidden sm:block" /> AI-native operating system.
          </p>
        </div>
      </section>

      {/* ── Modules ───────────────────────────────────────────────────────────── */}
      <section id="product" className="bg-[#0a0a0a] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
              7 integrated modules
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Everything your agency needs.
              <br />
              In one platform.
            </h2>
            <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto">
              Each module is powerful alone. Together, they transform how you operate.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((m) => (
              <div
                key={m.title}
                className={`relative rounded-2xl border ${m.border} bg-gradient-to-b ${m.color} p-6 hover:border-white/20 transition-all`}
              >
                <span
                  className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full mb-4 ${m.tagColor}`}
                >
                  {m.tag}
                </span>
                <div className="text-3xl mb-3">{m.emoji}</div>
                <h3 className="font-semibold text-white mb-2 text-base">{m.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">
              Setup
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#0a0a0a]">Live in 48 hours</h2>
            <p className="mt-4 text-lg text-gray-500">
              No 6-month implementation. No developers required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="text-8xl font-bold text-gray-100 mb-4 leading-none">{s.n}</div>
                <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{s.desc}</p>
                <p className="text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full">
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ──────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-center mb-8">
            Integrations
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {integrations.map((item) => (
              <span key={item} className="text-sm font-medium text-gray-400">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">
              Results
            </p>
            <h2 className="text-4xl font-bold text-[#0a0a0a]">
              What agencies say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="border border-gray-100 rounded-2xl p-8">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
                  <span className="text-blue-700 font-bold text-xs">{t.metric}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a0a0a] text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">
                      {t.title} · {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-24 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: GRID_SVG, backgroundColor: "#0a0a0a" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
              Pricing
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-white/40">
              30-day free trial. No minimum commitment. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
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
                <div className="mb-6">
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
                    className={`text-sm ${
                      plan.highlight ? "text-gray-500" : "text-white/40"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span
                        className={`flex-shrink-0 mt-0.5 font-medium ${
                          plan.highlight ? "text-blue-600" : "text-blue-400"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={plan.highlight ? "text-gray-700" : "text-white/60"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
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

          <p className="text-center text-sm text-white/30 mt-8">
            Optional add-on: 0.5% transaction fee on bookings processed through TravelOS
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0a0a0a]">Frequently asked questions</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  className="w-full flex items-center justify-between gap-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#0a0a0a] text-sm">{faq.q}</span>
                  <span
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-gray-500 text-sm leading-relaxed pr-8">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section
        className="py-32 px-4 sm:px-6 lg:px-8 text-center"
        style={{ backgroundImage: GRID_SVG, backgroundColor: "#0a0a0a" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to hire your agency&apos;s
            <br />
            first AI employee?
          </h2>
          <p className="text-xl text-white/40 mb-12">
            Join agencies that have already cut response time to under 60 seconds and 3×
            their quote output — with the same team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-white text-[#0a0a0a] px-10 py-4 rounded-xl text-base font-semibold hover:bg-white/90 transition-all shadow-xl shadow-white/10"
            >
              Start 30-day free trial
            </Link>
            <Link
              href="/docs"
              className="border border-white/15 text-white/60 px-10 py-4 rounded-xl text-base font-medium hover:border-white/30 hover:text-white transition-all"
            >
              Explore the API
            </Link>
          </div>
          <p className="text-white/30 text-sm mt-6">
            No credit card. No commitment. Live in 10 minutes.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="font-bold text-white">TravelOS</span>
              </Link>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                The operating system for AI-native travel agencies. Replace 8 tools with one
                intelligent platform.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Product
              </p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li>
                  <Link href="#product" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white transition-colors">
                    API Docs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Solutions
              </p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li>Solo Agents</li>
                <li>Agency Teams</li>
                <li>Enterprise Chains</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                Company
              </p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li>About</li>
                <li>
                  <a
                    href="mailto:sales@travelosapp.com"
                    className="hover:text-white transition-colors"
                  >
                    Contact sales
                  </a>
                </li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/30">© 2026 TravelOS, Inc. All rights reserved.</p>
            <p className="text-sm text-white/20">Built for AI-native travel agencies worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
