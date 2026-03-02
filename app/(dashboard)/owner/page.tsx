import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

async function getAgencyStats(agencyId: string) {
  const [leads, quotes, bookings, clients, aiActions] = await Promise.all([
    prisma.lead.count({ where: { agencyId } }),
    prisma.quote.count({ where: { agencyId } }),
    prisma.booking.count({ where: { agencyId } }),
    prisma.client.count({ where: { agencyId } }),
    prisma.aiAction.count({ where: { agencyId } }),
  ]);
  return { leads, quotes, bookings, clients, aiActions };
}

export default async function OwnerOverviewPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const stats = agencyId
    ? await getAgencyStats(agencyId)
    : { leads: 0, quotes: 0, bookings: 0, clients: 0, aiActions: 0 };

  const statCards = [
    { label: "Active Leads", value: stats.leads, icon: "🎯", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Quotes Sent", value: stats.quotes, icon: "✈️", color: "text-green-600", bg: "bg-green-50" },
    { label: "Confirmed Bookings", value: stats.bookings, icon: "🏨", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Clients", value: stats.clients, icon: "👥", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Agency Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">AI Autonomy</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Actions handled by AI</span>
            <span className="text-sm font-semibold text-gray-900">{stats.aiActions} total</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "82%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">82% autonomy rate — target: 85%</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/agent/quotes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span>✈️</span>
              <span className="text-sm text-gray-700">Create a new quote</span>
            </Link>
            <Link href="/agent/inbox" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span>💬</span>
              <span className="text-sm text-gray-700">Check inbox</span>
            </Link>
            <Link href="/owner/team" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span>👥</span>
              <span className="text-sm text-gray-700">Manage team</span>
            </Link>
            <Link href="/owner/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span>🔑</span>
              <span className="text-sm text-gray-700">API keys &amp; settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
