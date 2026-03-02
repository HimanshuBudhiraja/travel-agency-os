"use client";

import { useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/hotels/search",
    tag: "Hotels",
    summary: "Search hotels",
    description: "Search for available hotels by destination and dates. Returns live pricing from RateHawk or mock data in sandbox mode.",
    body: {
      destination: "Bali",
      checkIn: "2026-07-15",
      checkOut: "2026-07-22",
      adults: 2,
      currency: "USD"
    },
    response: {
      results: [
        { id: "rh-1234", name: "Grand Villa Bali", stars: 5, rating: 9.2, pricePerNight: 280, totalPrice: 1960, currency: "USD", amenities: ["WiFi", "Pool", "Spa", "Breakfast"] }
      ],
      count: 1,
      source: "mock"
    }
  },
  {
    method: "POST",
    path: "/api/v1/flights/search",
    tag: "Flights",
    summary: "Search flights",
    description: "Search flights between two airports using IATA codes. Uses Duffel API for live results.",
    body: {
      origin: "LHR",
      destination: "DPS",
      departureDate: "2026-07-15",
      returnDate: "2026-07-25",
      adults: 2,
      cabinClass: "economy"
    },
    response: {
      results: [
        { id: "duf-5678", airline: "Emirates", airlineCode: "EK", departureTime: "2026-07-15T08:00:00", arrivalTime: "2026-07-15T23:30:00", stops: 1, price: 850, currency: "USD", cabinClass: "economy" }
      ],
      count: 1,
      source: "mock"
    }
  },
  {
    method: "POST",
    path: "/api/v1/quotes",
    tag: "Quotes",
    summary: "Generate AI quote",
    description: "Provide a plain-language trip brief. Agency Brain generates a complete day-by-day itinerary with live pricing, margin calculation, and shareable proposal link.",
    body: {
      brief: "10-day Bali trip for 2 people, July 2026, budget $6000, luxury villas, wellness focus",
      clientId: "clnt_abc123"
    },
    response: {
      quoteId: "qt_xyz789",
      title: "Bali Luxury Wellness Escape — 10 Nights",
      summary: "A curated 10-night journey through Bali's finest wellness retreats, cultural landmarks, and hidden temples.",
      pricing: { net: 4200, markup: 840, gross: 5040 },
      days: [{ dayNumber: 1, date: "2026-07-15", title: "Arrival & Seminyak", description: "Check-in and evening at beach club" }]
    }
  },
  {
    method: "GET",
    path: "/api/v1/quotes",
    tag: "Quotes",
    summary: "List quotes",
    description: "Returns all quotes for the authenticated agency, optionally filtered by status or client.",
    params: [
      { name: "status", type: "string", values: "DRAFT | SENT | OPENED | APPROVED | REJECTED | EXPIRED" },
      { name: "clientId", type: "string", values: "Client ID" }
    ],
    response: {
      quotes: [
        { id: "qt_xyz789", title: "Bali Luxury Escape", status: "SENT", grossPrice: 5040, clientId: "clnt_abc123" }
      ]
    }
  },
  {
    method: "POST",
    path: "/api/v1/bookings",
    tag: "Bookings",
    summary: "Create booking",
    description: "Confirm a quote as a booking. Automatically updates lead stage, increments client LTV, and triggers post-booking AI monitoring.",
    body: {
      quoteId: "qt_xyz789",
      clientId: "clnt_abc123",
      destination: "Bali",
      departureDate: "2026-07-15",
      returnDate: "2026-07-25",
      paxCount: 2,
      totalCost: 5040,
      currency: "USD"
    },
    response: {
      booking: { id: "bk_111", reference: "TOS-M3X9K2", status: "PENDING", totalCost: 5040, currency: "USD" }
    }
  },
  {
    method: "GET",
    path: "/api/v1/bookings",
    tag: "Bookings",
    summary: "List bookings",
    description: "Returns all bookings for the authenticated agency.",
    params: [
      { name: "status", type: "string", values: "PENDING | CONFIRMED | CANCELLED | COMPLETED" },
      { name: "clientId", type: "string", values: "Client ID" }
    ],
    response: {
      bookings: [{ id: "bk_111", reference: "TOS-M3X9K2", status: "CONFIRMED", destination: "Bali", totalCost: 5040 }]
    }
  },
  {
    method: "GET",
    path: "/api/v1/clients",
    tag: "Clients",
    summary: "List clients",
    description: "Returns all clients in the agency CRM. Supports full-text search across name, email, and phone.",
    params: [{ name: "q", type: "string", values: "Search query" }],
    response: {
      clients: [{ id: "clnt_abc123", name: "Sarah Mitchell", email: "sarah@example.com", travelStyle: "luxury", lifetimeValue: 12500, bookingCount: 3 }]
    }
  },
  {
    method: "POST",
    path: "/api/v1/clients",
    tag: "Clients",
    summary: "Create client",
    description: "Add a new client to the CRM. Automatically deduplicates by email.",
    body: {
      name: "James Okafor",
      email: "james@example.com",
      phone: "+44 7700 900123",
      country: "UK",
      travelStyle: "adventure",
      budgetRange: "$3000-$8000"
    },
    response: {
      client: { id: "clnt_def456", name: "James Okafor", email: "james@example.com", lifetimeValue: 0 },
      duplicate: false
    }
  }
];

const tagColors: Record<string, string> = {
  Hotels: "bg-blue-100 text-blue-700",
  Flights: "bg-indigo-100 text-indigo-700",
  Quotes: "bg-emerald-100 text-emerald-700",
  Bookings: "bg-orange-100 text-orange-700",
  Clients: "bg-purple-100 text-purple-700",
};

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  PATCH: "bg-yellow-100 text-yellow-700",
};

export default function DocsPage() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const tags = [...new Set(endpoints.map((e) => e.tag))];
  const filtered = activeTag ? endpoints.filter((e) => e.tag === activeTag) : endpoints;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <nav className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <span className="font-bold text-white">TravelOS</span>
            </Link>
            <span className="text-white/20">|</span>
            <span className="text-sm text-white/50 font-medium">API Reference</span>
            <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">v1</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/sign-up" className="bg-white text-[#0a0a0a] text-sm px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors">
              Get API key
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Authentication</p>
            <div className="border border-white/10 bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-xs text-white/40 mb-2">Pass your API key in every request:</p>
              <code className="text-xs text-blue-400 break-all">x-api-key: tos_live_...</code>
            </div>

            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Endpoints</p>
            <button
              onClick={() => setActiveTag(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeTag ? "bg-white/10 text-white font-medium" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
            >
              All endpoints
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTag === tag ? "bg-white/10 text-white font-medium" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
              >
                {tag}
              </button>
            ))}

            <div className="pt-6">
              <a href="/openapi.json" target="_blank" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                Download OpenAPI spec →
              </a>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">API Reference</h1>
            <p className="text-white/50">
              The TravelOS REST API lets you integrate AI-powered travel search, quote generation, booking management, and client intelligence into any tool or workflow.
            </p>
          </div>

          {/* Base URL */}
          <div className="bg-[#111] border border-white/10 rounded-xl p-4 mb-8">
            <p className="text-xs text-white/30 mb-1 font-medium uppercase tracking-wider">Base URL</p>
            <code className="text-green-400 text-sm">https://your-agency.travelosapp.com/api/v1</code>
          </div>

          {/* Auth callout */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex gap-3">
            <span className="text-xl">🔑</span>
            <div>
              <p className="font-medium text-amber-300 text-sm mb-1">Authentication required</p>
              <p className="text-amber-200/70 text-sm">
                Include your API key in the{" "}
                <code className="bg-amber-500/10 px-1 rounded text-amber-300">x-api-key</code> header on every request.
                Generate keys from <strong className="text-amber-200">Owner Dashboard → Settings → API Keys</strong>.
              </p>
            </div>
          </div>

          {/* Endpoints */}
          <div className="space-y-4">
            {filtered.map((ep, i) => {
              const key = `${ep.method}-${ep.path}`;
              const isOpen = expanded === key;
              return (
                <div key={i} className="border border-white/10 bg-white/3 rounded-2xl overflow-hidden">
                  <button
                    className="w-full px-6 py-5 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                    onClick={() => setExpanded(isOpen ? null : key)}
                  >
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg w-14 text-center ${methodColors[ep.method] || "bg-white/10 text-white/70"}`}>
                      {ep.method}
                    </span>
                    <code className="text-sm text-white/80 flex-1 font-mono">{ep.path}</code>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[ep.tag] || ""}`}>
                      {ep.tag}
                    </span>
                    <span className="text-sm text-white/40 hidden md:block">{ep.summary}</span>
                    <span className="text-white/30 ml-2 text-sm">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-6 py-6 space-y-6">
                      <p className="text-white/60 text-sm leading-relaxed">{ep.description}</p>

                      {ep.params && (
                        <div>
                          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Query Parameters</p>
                          <div className="border border-white/10 rounded-xl overflow-hidden">
                            {ep.params.map((p) => (
                              <div key={p.name} className="flex gap-4 px-4 py-3 border-b border-white/5 last:border-0">
                                <code className="text-sm text-blue-400 w-32 flex-shrink-0">{p.name}</code>
                                <span className="text-xs text-white/30 w-16">{p.type}</span>
                                <span className="text-sm text-white/50">{p.values}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {ep.body && (
                        <div>
                          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Request Body</p>
                          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                            <pre className="text-green-300 text-xs overflow-x-auto leading-relaxed">
                              {JSON.stringify(ep.body, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Response 200</p>
                        <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-4">
                          <pre className="text-blue-300 text-xs overflow-x-auto leading-relaxed">
                            {JSON.stringify(ep.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Webhooks section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-4">Webhooks</h2>
            <p className="text-white/50 mb-6">
              TravelOS sends webhook events to your endpoint when key events occur. Configure your webhook URL in Owner Dashboard → Settings.
            </p>
            <div className="space-y-3">
              {[
                { event: "booking.confirmed", description: "Triggered when a booking is confirmed by a supplier" },
                { event: "booking.cancelled", description: "Triggered when a booking is cancelled" },
                { event: "quote.approved", description: "Triggered when a client approves a proposal" },
                { event: "quote.opened", description: "Triggered when a client opens a proposal link" },
                { event: "lead.created", description: "Triggered when AI creates a new lead from an inbound message" },
                { event: "payment.received", description: "Triggered when a client payment is confirmed via Stripe" },
              ].map((w) => (
                <div key={w.event} className="border border-white/10 bg-white/3 rounded-xl px-5 py-4 flex items-start gap-4">
                  <code className="text-sm text-violet-400 font-mono flex-shrink-0 w-48">{w.event}</code>
                  <p className="text-sm text-white/50">{w.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div className="mt-12 border border-white/10 bg-white/3 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Rate Limits</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { plan: "Starter", limit: "100 req/min", note: "50 AI calls/day" },
                { plan: "Agency", limit: "500 req/min", note: "Unlimited AI calls" },
                { plan: "Enterprise", limit: "Custom", note: "Dedicated infrastructure" },
              ].map((r) => (
                <div key={r.plan} className="border border-white/10 rounded-xl p-4">
                  <p className="font-medium text-white mb-1">{r.plan}</p>
                  <p className="text-2xl font-bold text-blue-400 mb-1">{r.limit}</p>
                  <p className="text-xs text-white/30">{r.note}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
