"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const roles = [
  {
    value: "OWNER",
    label: "Agency Owner / Manager",
    description: "I own or manage a travel agency. I want full access to analytics, team management, billing, and AI configuration.",
    icon: "🏢",
  },
  {
    value: "AGENT",
    label: "Travel Agent",
    description: "I work with clients day-to-day — leads, quotes, and relationships are my focus.",
    icon: "✈️",
  },
  {
    value: "OPS",
    label: "Operations Manager",
    description: "I handle bookings, suppliers, and post-sale workflows for the agency.",
    icon: "📋",
  },
];

const plans = [
  { value: "starter", label: "Starter", price: "$299/mo", note: "Solo agents" },
  { value: "agency", label: "Agency", price: "$799/mo", note: "2–10 agents — Most popular" },
  { value: "enterprise", label: "Enterprise", price: "Custom", note: "Chains & franchises" },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [plan, setPlan] = useState("agency");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    if (!agencyName.trim() || !role) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName, agencyWebsite, role, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      router.push(role === "OWNER" ? "/owner" : role === "OPS" ? "/ops" : "/agent");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl text-gray-900">TravelOS</span>
          </div>
          <p className="text-gray-500 text-sm">Let&apos;s set up your agency in 2 minutes</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-gray-200"}`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Step 1: Agency details */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your agency</h2>
              <p className="text-sm text-gray-500 mb-6">Tell us a little about your business</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency name *</label>
                  <input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. Sunwave Travel"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                  <input
                    value={agencyWebsite}
                    onChange={(e) => setAgencyWebsite(e.target.value)}
                    placeholder="https://sunwavetravel.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!agencyName.trim()}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Role selection */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your role</h2>
              <p className="text-sm text-gray-500 mb-6">This determines your dashboard and permissions</p>
              <div className="space-y-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full text-left border-2 rounded-xl p-4 transition-all ${role === r.value ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{r.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.description}</p>
                      </div>
                      {role === r.value && <span className="ml-auto text-blue-600 flex-shrink-0">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!role}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plan selection */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Choose your plan</h2>
              <p className="text-sm text-gray-500 mb-6">All plans include a 30-day free trial</p>
              <div className="space-y-3 mb-6">
                {plans.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlan(p.value)}
                    className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all flex items-center justify-between ${plan === p.value ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{p.price}</p>
                      {plan === p.value && <span className="text-blue-600 text-xs">Selected</span>}
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={finish}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Setting up..." : "Launch my dashboard →"}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">No credit card required for trial</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Logged in as {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
