"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

// ─── SVG Grid Background ──────────────────────────────────────────────────────
const GRID_SVG = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' width='40' height='40' fill='none' stroke='rgb(255 255 255 / 0.04)'%3e%3cpath d='M0 .5H39.5V40'/%3e%3c/svg%3e")`;

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "90 sec", label: "Quote generation" },
  { value: "3×", label: "More quotes per agent" },
  { value: "100%", label: "Follow-up rate" },
  { value: "₹0", label: "Setup cost" },
];

const problems = [
  {
    icon: "💬",
    title: "WhatsApp chaos",
    desc: "Leads scattered across personal phones. No visibility. Enquiries lost in group chats.",
  },
  {
    icon: "📄",
    title: "3-hour Word docs",
    desc: "Agents spend hours building proposals manually. Copy-paste errors. No consistency.",
  },
  {
    icon: "🔔",
    title: "Forgotten follow-ups",
    desc: "Hot leads go cold because no one remembered to follow up on day 3 or day 7.",
  },
  {
    icon: "📊",
    title: "No visibility",
    desc: "Owners have zero real-time data. No pipeline. No revenue forecast. No clarity.",
  },
];

const features = [
  {
    emoji: "🤖",
    title: "AI Quote Builder",
    desc: "3 package tiers in 90 seconds",
    color: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    emoji: "📱",
    title: "WhatsApp Inbox",
    desc: "All leads in one place",
    color: "from-green-500/10 to-green-500/5",
    border: "border-green-500/20",
    iconBg: "bg-green-500/10 text-green-400",
  },
  {
    emoji: "📊",
    title: "Lead Pipeline",
    desc: "Kanban from enquiry to booking",
    color: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  {
    emoji: "🔁",
    title: "Auto Follow-ups",
    desc: "Day 1, 3, 7, 14 — never miss a follow-up",
    color: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/10 text-orange-400",
  },
  {
    emoji: "📄",
    title: "Branded Proposals",
    desc: "Beautiful shareable web proposals",
    color: "from-pink-500/10 to-pink-500/5",
    border: "border-pink-500/20",
    iconBg: "bg-pink-500/10 text-pink-400",
  },
  {
    emoji: "📈",
    title: "Agency Analytics",
    desc: "Real-time dashboard for owners",
    color: "from-cyan-500/10 to-cyan-500/5",
    border: "border-cyan-500/20",
    iconBg: "bg-cyan-500/10 text-cyan-400",
  },
];

const steps = [
  {
    num: "01",
    title: "Client WhatsApps",
    desc: "A lead sends a message. Our AI reads the intent — destination, dates, budget, group size — instantly and creates a lead.",
  },
  {
    num: "02",
    title: "AI builds 3 quotes in 90s",
    desc: "TravelOS generates Budget, Recommended, and Premium packages with full day-by-day itineraries and INR pricing.",
  },
  {
    num: "03",
    title: "Agent approves & sends",
    desc: "Your agent reviews in one click, approves, and the beautiful proposal lands straight in the client's WhatsApp.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "/mo",
    desc: "Perfect for solo agents getting started",
    features: [
      "1 agent seat",
      "50 AI quotes per month",
      "WhatsApp inbox",
      "Lead pipeline (Kanban)",
      "Branded proposals",
      "Email support",
    ],
    popular: false,
    cta: "Start free trial",
  },
  {
    name: "Agency",
    price: "₹14,999",
    period: "/mo",
    desc: "For growing agencies that need scale",
    features: [
      "Up to 15 agent seats",
      "Unlimited AI quotes",
      "WhatsApp inbox + auto-reply",
      "Lead pipeline + analytics",
      "Auto follow-ups (Day 1/3/7/14)",
      "Branded proposals",
      "Priority support",
    ],
    popular: true,
    cta: "Start free trial",
  },
  {
    name: "Enterprise",
    price: "₹34,999",
    period: "/mo",
    desc: "For large agencies with custom needs",
    features: [
      "Unlimited agent seats",
      "Unlimited AI quotes",
      "Custom AI training on your data",
      "Dedicated account manager",
      "API access",
      "SLA-backed support",
      "White-label proposals",
    ],
    popular: false,
    cta: "Book a demo",
  },
];

const faqs = [
  {
    q: "Do I need the WhatsApp Business API?",
    a: "Yes — TravelOS uses the official WhatsApp Business API via Twilio. We handle the full setup for you at no extra cost. Most agencies are live within 48 hours of signing up.",
  },
  {
    q: "How accurate is the AI for Indian travel packages?",
    a: "Our AI is trained specifically on premium Indian travel packages — Rajasthan, Goa, Himachal, Kerala, and popular international destinations like Bali, Europe, and Southeast Asia. Every quote is reviewed by your agent before it goes to clients.",
  },
  {
    q: "Can I use TravelOS alongside my existing tools?",
    a: "Absolutely. TravelOS integrates with your current workflow. We have import tools for client lists from Excel/CSV, and our API connects with popular booking platforms.",
  },
  {
    q: "What happens after my free trial?",
    a: "Your 14-day trial includes full access to all Starter features. No credit card required to start. You only pay when you are ready to upgrade.",
  },
  {
    q: "Is my client data safe and stored in India?",
    a: "Yes. TravelOS is hosted on AWS Mumbai (ap-south-1) for low latency and data residency in India. All data is encrypted at rest and in transit. We never sell your data to third parties.",
  },
];

// ─── FAQ Item Component ───────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm sm:text-base font-medium text-white pr-4">{q}</span>
        <span
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/10 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Terminal Mockup ──────────────────────────────────────────────────────────

function TerminalMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-3xl" />
      <div className="relative bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0d0d0d]">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-gray-600 font-mono">TravelOS — AI Engine</span>
        </div>

        {/* Content */}
        <div className="p-5 font-mono text-sm space-y-3">
          {/* Incoming WA message */}
          <div className="flex items-start gap-3">
            <span className="text-green-400 flex-shrink-0">📱</span>
            <div>
              <div className="text-gray-500 text-xs mb-1">WhatsApp · Rahul Sharma</div>
              <div className="text-white text-xs leading-relaxed">
                &quot;Hi, planning Bali trip for 2 from 15 April to 22 April.
                Budget ~₹1.5L per person&quot;
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 text-gray-600">
            <div className="flex-1 border-t border-dashed border-white/10" />
            <span className="text-xs">AI processing…</span>
            <div className="flex-1 border-t border-dashed border-white/10" />
          </div>

          {/* Intent extracted */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1">
            <div className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Intent extracted
            </div>
            <div className="text-gray-300 text-xs">
              destination: <span className="text-white">Bali</span>
            </div>
            <div className="text-gray-300 text-xs">
              dates: <span className="text-white">15 Apr – 22 Apr (7 nights)</span>
            </div>
            <div className="text-gray-300 text-xs">
              pax: <span className="text-white">2 adults</span>
            </div>
            <div className="text-gray-300 text-xs">
              budget: <span className="text-white">₹3,00,000 total</span>
            </div>
            <div className="text-gray-300 text-xs">
              score:{" "}
              <span className="text-red-400 font-semibold">🔥 HOT</span>
            </div>
          </div>

          {/* Tiers generated */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-400 text-xs">
                3 package tiers generated in
              </span>
              <span className="text-green-400 font-semibold text-xs">2.1s</span>
            </div>
            <div className="pl-4 space-y-1">
              <div className="text-xs text-gray-500">
                • Budget:{" "}
                <span className="text-gray-200">Bali Escape — ₹2,40,000</span>
              </div>
              <div className="text-xs text-gray-500">
                •{" "}
                <span className="text-yellow-400">★ Recommended:</span>{" "}
                <span className="text-gray-200">Bali Dream — ₹2,90,000</span>
              </div>
              <div className="text-xs text-gray-500">
                • Premium:{" "}
                <span className="text-gray-200">Bali Luxury — ₹3,80,000</span>
              </div>
            </div>
          </div>

          {/* Sent confirmation */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-green-400">✓</span>
            <span>Proposal sent to Rahul via WhatsApp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                TravelOS
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/docs"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Docs
              </Link>
            </div>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Start free trial
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-white/60"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 space-y-1.5">
              <div
                className={`h-0.5 bg-current transition-transform duration-200 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
              />
              <div
                className={`h-0.5 bg-current transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`}
              />
              <div
                className={`h-0.5 bg-current transition-transform duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0a0a0a] px-4 py-6 flex flex-col gap-4">
            <a href="#features" className="text-sm text-white/70">Features</a>
            <a href="#pricing" className="text-sm text-white/70">Pricing</a>
            <Link href="/docs" className="text-sm text-white/70">Docs</Link>
            <Link href="/sign-in" className="text-sm text-white/70">Sign in</Link>
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center"
            >
              Start free trial
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ backgroundImage: GRID_SVG }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(59,130,246,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Built for premium Indian travel agencies
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
                Your agency&apos;s first{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  AI employee.
                </span>
                <br />
                Works 24/7.
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                AI handles inquiry-to-quote in 90 seconds. Automated follow-ups.
                WhatsApp-native CRM. Your agents focus on closing.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Start free trial
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </Link>
                <Link
                  href="/sign-up?demo=1"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Book a demo
                </Link>
              </div>

              <p className="mt-4 text-xs text-gray-600">
                No credit card required · 14-day free trial · Cancel anytime
              </p>
            </div>

            {/* Right: terminal mockup */}
            <div className="flex-1 w-full max-w-lg">
              <TerminalMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="bg-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                {s.value}
              </div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem Section ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              The reality
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Sound familiar?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {problems.map((p) => (
              <div
                key={p.title}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:bg-white/[0.05] transition-colors"
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Everything you need
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              One platform. Zero compromises.
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              TravelOS replaces 8+ tools your agency uses today — inbox, CRM,
              quoting tool, proposal builder, analytics.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 hover:scale-[1.02] transition-transform`}
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-4 ${f.iconBg}`}
                >
                  {f.emoji}
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
              Simple workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">
              From enquiry to proposal in 3 steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+52px)] right-[calc(-50%+52px)] h-px bg-gray-200" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-2xl font-black text-blue-600 mb-4">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: GRID_SVG, backgroundColor: "#0a0a0a" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Simple pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Pricing in INR. No surprises.
            </h2>
            <p className="mt-4 text-gray-500">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border ${
                  plan.popular
                    ? "bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p
                    className={`text-sm mt-1 ${plan.popular ? "text-blue-100" : "text-gray-500"}`}
                  >
                    {plan.desc}
                  </p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-white">
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm ${plan.popular ? "text-blue-200" : "text-gray-500"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex-shrink-0 ${plan.popular ? "text-blue-200" : "text-green-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 8l3.5 3.5L13 4" />
                        </svg>
                      </span>
                      <span
                        className={plan.popular ? "text-blue-50" : "text-gray-400"}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`block w-full text-center font-semibold py-3 rounded-xl transition-colors ${
                    plan.popular
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
              Common questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="rounded-3xl p-12 border border-blue-500/20"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
            }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Ready to 10x your agency?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join hundreds of premium Indian travel agencies already using
              TravelOS to close more deals with the same team.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Start free trial
              <svg
                className="w-5 h-5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              No credit card · 14-day trial · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#080808] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  TravelOS
                </span>
              </Link>
              <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                The AI-native operating system for premium Indian travel agencies.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Product
              </h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Changelog", "Roadmap"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                {["Docs", "API Reference", "Blog", "Status"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Company
              </h4>
              <ul className="space-y-2">
                {["About", "Privacy", "Terms", "Contact"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-700">
              &copy; {new Date().getFullYear()} TravelOS. All rights reserved.
              Made in India 🇮🇳
            </p>
            <p className="text-xs text-gray-700">
              Backed by WhatsApp Business API · Hosted on AWS Mumbai
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
