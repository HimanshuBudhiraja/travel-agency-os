import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

const planDetails: Record<string, { label: string; price: string; features: string[] }> = {
  starter: {
    label: "Starter",
    price: "$299/mo",
    features: ["1 seat", "50 AI quotes/mo", "WhatsApp + Email inbox", "Basic CRM"],
  },
  agency: {
    label: "Agency",
    price: "$799/mo",
    features: ["10 seats", "Unlimited AI quotes", "All channels", "Booking monitor", "API access"],
  },
  enterprise: {
    label: "Enterprise",
    price: "Custom",
    features: ["Unlimited seats", "Custom AI training", "White-label", "Dedicated support"],
  },
  cancelled: {
    label: "Cancelled",
    price: "—",
    features: [],
  },
};

export default async function BillingPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const agency = agencyId
    ? await prisma.agency.findUnique({ where: { id: agencyId } })
    : null;

  const current = planDetails[agency?.plan || "starter"];
  const isTrialing = agency?.trialEndsAt && new Date(agency.trialEndsAt) > new Date();
  const trialDaysLeft = agency?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(agency.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Billing</h1>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Current plan</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{current.label}</span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-blue-600">{current.price}</span>
            </div>
          </div>
          {isTrialing && (
            <div className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              Trial · {trialDaysLeft}d left
            </div>
          )}
        </div>
        <ul className="space-y-1.5 mb-6">
          {current.features.map((f) => (
            <li key={f} className="text-sm text-gray-500 flex items-center gap-2">
              <span className="text-blue-500">✓</span> {f}
            </li>
          ))}
        </ul>
        {agency?.plan !== "enterprise" && (
          <Link
            href="#upgrade"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade plan
          </Link>
        )}
      </div>

      {/* Upgrade options */}
      <div id="upgrade" className="grid md:grid-cols-3 gap-4 mb-6">
        {["starter", "agency", "enterprise"].map((p) => {
          const d = planDetails[p];
          const isCurrent = agency?.plan === p;
          return (
            <div key={p} className={`bg-white rounded-2xl border p-5 ${isCurrent ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100"}`}>
              <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
              <p className="text-xl font-bold text-blue-600 mb-3">{d.price}</p>
              <ul className="space-y-1 mb-4">
                {d.features.map((f) => (
                  <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <span className="text-xs text-blue-600 font-medium">Current plan</span>
              ) : p === "enterprise" ? (
                <a href="mailto:sales@travelosapp.com" className="block text-center bg-gray-900 text-white text-xs py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  Contact sales
                </a>
              ) : (
                <button className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Switch to {d.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">This month&apos;s usage</h2>
        <div className="space-y-4">
          {[
            { label: "AI quotes generated", used: 12, limit: agency?.plan === "starter" ? 50 : null },
            { label: "API requests", used: 340, limit: null },
            { label: "WhatsApp messages sent", used: 87, limit: null },
          ].map((u) => (
            <div key={u.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{u.label}</span>
                <span className="font-medium text-gray-900">
                  {u.used}{u.limit ? ` / ${u.limit}` : ""}
                </span>
              </div>
              {u.limit && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
