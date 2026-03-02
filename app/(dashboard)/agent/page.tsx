import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

const stageBadge: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  QUALIFIED: "bg-yellow-100 text-yellow-700",
  QUOTED: "bg-orange-100 text-orange-700",
  NEGOTIATING: "bg-purple-100 text-purple-700",
  BOOKED: "bg-green-100 text-green-700",
  POST_TRIP: "bg-gray-100 text-gray-600",
  LOST: "bg-red-100 text-red-600",
};

const scoreBadge: Record<string, string> = {
  HOT: "🔥",
  WARM: "🌤️",
  COLD: "❄️",
};

export default async function AgentDashboardPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  const userId = (sessionClaims?.metadata as any)?.dbUserId as string | undefined;

  const leads: any[] = agencyId
    ? await prisma.lead.findMany({
        where: { agencyId },
        include: { client: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      })
    : [];

  const myLeads = leads.filter((l) => l.assignedToId === userId);
  const hotLeads = leads.filter((l) => l.score === "HOT");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
          <p className="text-gray-500 mt-1">{leads.length} active leads</p>
        </div>
        <Link
          href="/agent/quotes"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New quote
        </Link>
      </div>

      {/* Hot leads alert */}
      {hotLeads.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-medium text-orange-900">{hotLeads.length} hot lead{hotLeads.length > 1 ? "s" : ""} need attention</p>
            <p className="text-sm text-orange-700">AI has detected high-intent signals. Review and approve AI-drafted quotes.</p>
          </div>
        </div>
      )}

      {/* Lead pipeline */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Deal Pipeline</h2>
          <div className="flex gap-2 text-xs text-gray-400">
            <span>All leads</span>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Client</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Destination</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Stage</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Value</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No leads yet. AI will create leads automatically from incoming messages.
                </td>
              </tr>
            ) : (
              leads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                        {lead.client.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{lead.client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.destination || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${stageBadge[lead.stage] || ""}`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{scoreBadge[lead.score]}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
