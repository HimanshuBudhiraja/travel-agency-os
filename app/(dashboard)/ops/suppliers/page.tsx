import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export default async function SuppliersPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const suppliers = agencyId
    ? await prisma.supplier.findMany({
        where: { agencyId },
        orderBy: { reliabilityScore: "desc" },
      })
    : [];

  function scoreColor(score: number) {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-500";
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Intelligence</h1>
          <p className="text-gray-500 mt-1">{suppliers.length} suppliers tracked by AI</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add supplier
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Supplier", "Type", "Destination", "Reliability", "Response Avg", "Preferred", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No suppliers yet. Add your hotel and airline contacts to start AI tracking.
                </td>
              </tr>
            ) : (
              suppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{s.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{s.destination || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${scoreColor(s.reliabilityScore)}`}>
                      {s.reliabilityScore.toFixed(1)}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {s.responseTimeAvg ? `${s.responseTimeAvg}h` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {s.isPreferred ? <span className="text-green-600">✓ Yes</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
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
