"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayActivity {
  time: string;
  activity: string;
  location?: string;
}

interface DayPlan {
  dayNumber: number;
  date: string;
  title: string;
  description: string;
  activities: DayActivity[];
  accommodation: { name: string; area: string; stars: number } | null;
}

interface Hotel {
  name: string;
  stars: number;
  area: string;
  pricePerNightInr: number;
}

interface QuoteTier {
  tier: "budget" | "recommended" | "premium";
  title: string;
  summary: string;
  netCostInr: number;
  grossPriceInr: number;
  marginPct: number;
  days: DayPlan[];
  included: string[];
  excluded: string[];
  hotels: Hotel[];
  flights: string;
  highlights: string[];
}

interface ThreeTiers {
  budget: QuoteTier;
  recommended: QuoteTier;
  premium: QuoteTier;
}

type Step = "brief" | "loading" | "tiers" | "send";

const TRAVEL_STYLES = ["Luxury", "Adventure", "Family", "Budget", "Honeymoon", "Business"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function calcGross(net: number, marginPct: number): number {
  return Math.round(net / (1 - marginPct / 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(Math.min(stars, 5))}
      {"☆".repeat(Math.max(0, 5 - stars))}
    </span>
  );
}

function AccordionDay({ day }: { day: DayPlan }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
            {day.dayNumber}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">{day.title}</p>
            <p className="text-xs text-gray-400">{day.date}</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <p className="text-xs text-gray-500 my-3">{day.description}</p>
          <div className="space-y-2 mb-3">
            {day.activities.map((act, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs text-blue-500 w-14 flex-shrink-0 pt-0.5 font-medium">{act.time}</span>
                <div>
                  <p className="text-xs text-gray-800">{act.activity}</p>
                  {act.location && <p className="text-xs text-gray-400">{act.location}</p>}
                </div>
              </div>
            ))}
          </div>
          {day.accommodation && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-400 text-xs">Stay:</span>
              <span className="text-xs font-medium text-gray-700">{day.accommodation.name}</span>
              <StarRating stars={day.accommodation.stars} />
              <span className="text-xs text-gray-400">{day.accommodation.area}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TierCard({
  data,
  onSelect,
  isSelected,
}: {
  data: QuoteTier;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const defaultMargin = Math.round((data.marginPct || 0.18) * 100);
  const [margin, setMargin] = useState(defaultMargin);
  const grossPrice = calcGross(data.netCostInr, margin);

  const badgeConfig = {
    budget: {
      label: "Budget",
      sub: null,
      headerBg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    },
    recommended: {
      label: "Recommended",
      sub: "Most Popular",
      headerBg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-300",
    },
    premium: {
      label: "Premium",
      sub: null,
      headerBg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-300",
    },
  }[data.tier];

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl border-2 transition-all overflow-hidden ${
        isSelected ? "border-blue-500 shadow-xl shadow-blue-100" : badgeConfig.border
      }`}
    >
      {/* Header */}
      <div className={`${badgeConfig.headerBg} px-5 py-4`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-bold uppercase tracking-widest ${badgeConfig.text}`}>
            {badgeConfig.label}
          </span>
          {badgeConfig.sub && (
            <span className="text-xs bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-semibold">
              {badgeConfig.sub}
            </span>
          )}
        </div>
        <h3 className="font-bold text-gray-900 text-base leading-snug">{data.title}</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{data.summary}</p>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-5">
        {/* Pricing */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 font-medium">Your cost</span>
            <span className="text-sm font-semibold text-gray-700">{inr(data.netCostInr)}</span>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Your margin</span>
              <span className="text-xs font-bold text-blue-600">{margin}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={35}
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-0.5">
              <span>10%</span>
              <span>35%</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-0.5">Client sees</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{inr(grossPrice)}</p>
          </div>
        </div>

        {/* Flights */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Flights</p>
          <p className="text-xs text-gray-700 bg-blue-50 rounded-lg px-3 py-2 leading-relaxed">{data.flights}</p>
        </div>

        {/* Hotels */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hotels</p>
          <div className="space-y-2">
            {(data.hotels || []).slice(0, 3).map((hotel, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{hotel.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating stars={hotel.stars} />
                    <span className="text-xs text-gray-400 truncate">{hotel.area}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-700 flex-shrink-0 ml-2">
                  {inr(hotel.pricePerNightInr)}
                  <span className="text-gray-400 font-normal">/n</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Highlights</p>
          <ul className="space-y-1.5">
            {(data.highlights || []).map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Included / Excluded */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-green-700 mb-1.5">Included</p>
            <ul className="space-y-1">
              {(data.included || []).slice(0, 6).map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-green-500 flex-shrink-0 font-bold">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-500 mb-1.5">Excluded</p>
            <ul className="space-y-1">
              {(data.excluded || []).slice(0, 6).map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-red-400 flex-shrink-0 font-bold">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Day-by-day accordion */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Day-by-Day Itinerary
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
            {(data.days || []).map((day) => (
              <AccordionDay key={day.dayNumber} day={day} />
            ))}
          </div>
        </div>

        {/* Select button */}
        <button
          onClick={onSelect}
          className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isSelected
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
          }`}
        >
          {isSelected ? "Selected" : "Select this tier"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const [step, setStep] = useState<Step>("brief");

  // Brief form
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [paxCount, setPaxCount] = useState(2);
  const [budgetInr, setBudgetInr] = useState("");
  const [travelStyle, setTravelStyle] = useState("Luxury");
  const [preferences, setPreferences] = useState("");

  // Tiers
  const [tiers, setTiers] = useState<ThreeTiers | null>(null);
  const [selectedTier, setSelectedTier] = useState<"budget" | "recommended" | "premium" | null>(null);

  // Send
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);

  // Errors
  const [error, setError] = useState("");

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!destination.trim() || !departureDate || !returnDate || !budgetInr) {
      setError("Please fill in Destination, Departure Date, Return Date and Budget.");
      return;
    }
    if (new Date(returnDate) <= new Date(departureDate)) {
      setError("Return date must be after departure date.");
      return;
    }
    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/v1/quotes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: destination.trim(),
          departureDate,
          returnDate,
          paxCount,
          budgetInr: parseInt(budgetInr.replace(/[^0-9]/g, "")),
          travelStyle,
          preferences: preferences.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quote");
      setTiers(data);
      setSelectedTier(null);
      setStep("tiers");
    } catch (e: any) {
      setError(e.message);
      setStep("brief");
    }
  }, [destination, departureDate, returnDate, paxCount, budgetInr, travelStyle, preferences]);

  // ── Send via WhatsApp ────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!clientName.trim() || !clientWhatsapp.trim() || !selectedTier || !tiers) return;
    setSending(true);
    try {
      await fetch("/api/v1/quotes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tiers[selectedTier],
          clientName: clientName.trim(),
          clientWhatsapp: clientWhatsapp.trim(),
        }),
      });
      setSendSuccess(true);
    } finally {
      setSending(false);
    }
  }, [clientName, clientWhatsapp, selectedTier, tiers]);

  // ── Copy link ────────────────────────────────────────────────────────────────

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ── Save draft ───────────────────────────────────────────────────────────────

  const handleSaveDraft = useCallback(async () => {
    if (!selectedTier || !tiers) return;
    await fetch("/api/v1/quotes/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: tiers[selectedTier] }),
    });
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2000);
  }, [selectedTier, tiers]);

  // ── Reset ────────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setStep("brief");
    setTiers(null);
    setSelectedTier(null);
    setError("");
    setSendSuccess(false);
    setCopied(false);
    setSavedDraft(false);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Quote Builder</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Generate 3-tier packages with live INR pricing in under 2 minutes
            </p>
          </div>
          {/* Step breadcrumb */}
          <div className="flex items-center gap-2">
            {(["brief", "tiers", "send"] as const).map((s, idx) => {
              const labels = ["Brief", "Packages", "Send"];
              const active = step === s || (step === "loading" && s === "brief");
              const done =
                (s === "brief" && (step === "tiers" || step === "send")) ||
                (s === "tiers" && step === "send");
              return (
                <div key={s} className="flex items-center gap-2">
                  {idx > 0 && <div className="w-6 h-px bg-gray-200" />}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        done
                          ? "bg-blue-600 text-white"
                          : active
                          ? "bg-blue-100 text-blue-700 ring-2 ring-blue-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>
                      {labels[idx]}
                    </span>
                  </div>
                </div>
              );
            })}
            {step !== "brief" && step !== "loading" && (
              <button
                onClick={handleReset}
                className="ml-4 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Start over
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* ── STEP: BRIEF ───────────────────────────────────────────────────── */}
        {step === "brief" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                <p className="text-white font-bold text-base">Step 1 — Trip Brief</p>
                <p className="text-blue-200 text-sm mt-0.5">
                  Fill in the details and AI will craft 3 tailored packages
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Bali, Indonesia"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Departure Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Return Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Pax + Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={paxCount}
                      onChange={(e) => setPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Budget (INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        &#8377;
                      </span>
                      <input
                        type="text"
                        value={budgetInr}
                        onChange={(e) => setBudgetInr(e.target.value)}
                        placeholder="2,00,000"
                        className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travel Style</label>
                  <div className="flex flex-wrap gap-2">
                    {TRAVEL_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setTravelStyle(style)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          travelStyle === style
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Additional Preferences
                  </label>
                  <textarea
                    rows={3}
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="e.g. Vegetarian meals, private villa, wellness retreats, no beach clubs, anniversary celebration..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate 3 Package Options
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: LOADING ─────────────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md w-full">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                AI is building 3 package options...
              </h2>
              <p className="text-sm text-gray-500 mb-7">
                Crafting Budget, Recommended and Premium tiers for{" "}
                <span className="font-semibold text-gray-700">{destination}</span>
              </p>
              <div className="space-y-2.5 text-left">
                {[
                  "Analysing destination & travel dates",
                  "Researching hotel and flight options",
                  "Building detailed day-by-day itineraries",
                  "Calculating 3 pricing tiers",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                    <div
                      className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                      style={{ animationDelay: `${i * 0.25}s` }}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: TIERS ───────────────────────────────────────────────────── */}
        {step === "tiers" && tiers && (
          <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  3 Packages for {destination}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Adjust margins live with the slider. Select a tier to continue.
                </p>
              </div>
              {selectedTier && (
                <button
                  onClick={() => setStep("send")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
                >
                  Continue with {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {(["budget", "recommended", "premium"] as const).map((tier) => (
                <TierCard
                  key={tier}
                  data={tiers[tier]}
                  isSelected={selectedTier === tier}
                  onSelect={() => setSelectedTier(tier)}
                />
              ))}
            </div>

            {selectedTier && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setStep("send")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-200 flex items-center gap-2"
                >
                  Send to Client
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: SEND ────────────────────────────────────────────────────── */}
        {step === "send" && selectedTier && tiers && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                <p className="text-white font-bold text-base">Step 3 — Send to Client</p>
                <p className="text-blue-200 text-sm mt-0.5 truncate">
                  {tiers[selectedTier].title}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Selected tier summary card */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Selected Package</p>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {tiers[selectedTier].title}
                    </p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{selectedTier} tier</p>
                  </div>
                  <button
                    onClick={() => setStep("tiers")}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Change
                  </button>
                </div>

                {sendSuccess ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1.5">Quote sent successfully!</p>
                    <p className="text-sm text-gray-500">
                      WhatsApp message delivered to {clientWhatsapp}
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Build another quote
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Client WhatsApp Number
                      </label>
                      <div className="flex">
                        <span className="flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-500 font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={clientWhatsapp}
                          onChange={(e) => setClientWhatsapp(e.target.value)}
                          placeholder="98765 43210"
                          className="flex-1 border border-gray-200 rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      {/* Send via WhatsApp */}
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !clientName.trim() || !clientWhatsapp.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-green-200"
                      >
                        {sending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                            Send via WhatsApp
                          </>
                        )}
                      </button>

                      {/* Copy + Save Draft */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          {copied ? (
                            <>
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy web link
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          {savedDraft ? (
                            <>
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              Save as draft
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
