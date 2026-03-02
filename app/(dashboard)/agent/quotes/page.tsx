"use client";

import { useState } from "react";

export default function QuotesPage() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function generateQuote() {
    if (!brief.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/v1/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Itinerary Builder</h1>
        <p className="text-gray-500 mt-1">
          Describe the trip in plain language — AI generates a full itinerary in under 3 minutes
        </p>
      </div>

      {/* Brief input */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trip brief
        </label>
        <textarea
          rows={4}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. 10-day Bali trip for a couple, mid-July 2026, budget $6000, luxury villas preferred, interested in culture and wellness. No party scene."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Include: destination, dates, pax count, budget, style preferences
          </p>
          <button
            onClick={generateQuote}
            disabled={loading || !brief.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                Generating...
              </>
            ) : (
              "Generate itinerary ✈️"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Generated itinerary */}
      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-lg">{result.title}</h2>
              <div className="flex gap-2">
                <button className="border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                  Export PDF
                </button>
                <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700">
                  Send to client
                </button>
              </div>
            </div>

            {result.summary && (
              <p className="text-gray-500 text-sm mb-6">{result.summary}</p>
            )}

            {/* Pricing */}
            {result.pricing && (
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Net cost</p>
                  <p className="font-semibold text-gray-900">${result.pricing.net?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Markup (20%)</p>
                  <p className="font-semibold text-gray-900">${result.pricing.markup?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Client price</p>
                  <p className="font-bold text-blue-600 text-lg">${result.pricing.gross?.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Days */}
            {result.days?.map((day: any) => (
              <div key={day.dayNumber} className="border-l-2 border-blue-100 pl-4 mb-6">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                  Day {day.dayNumber} · {day.date}
                </p>
                <h3 className="font-medium text-gray-900 mb-2">{day.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{day.description}</p>
                {day.activities?.map((act: any, i: number) => (
                  <div key={i} className="flex gap-3 mb-2">
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{act.time}</span>
                    <div>
                      <p className="text-sm text-gray-800">{act.activity}</p>
                      {act.location && <p className="text-xs text-gray-400">{act.location}</p>}
                    </div>
                  </div>
                ))}
                {day.accommodation && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <span>🏨</span>
                    <span>{day.accommodation.name}</span>
                    {day.accommodation.area && <span className="text-gray-400">· {day.accommodation.area}</span>}
                  </div>
                )}
              </div>
            ))}

            {/* Hotels from RateHawk */}
            {result.hotels?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Available Hotels</h3>
                <div className="space-y-3">
                  {result.hotels.slice(0, 3).map((h: any) => (
                    <div key={h.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{h.name}</p>
                        <p className="text-xs text-gray-400">{"★".repeat(h.stars)} · {h.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{h.amenities.slice(0, 4).join(" · ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${h.pricePerNight}/night</p>
                        <p className="text-xs text-gray-400">Total: ${h.totalPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
