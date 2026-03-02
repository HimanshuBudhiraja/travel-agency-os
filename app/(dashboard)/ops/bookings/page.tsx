import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

const statusBadge: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export default async function BookingsPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const bookings = agencyId
    ? await prisma.booking.findMany({
        where: { agencyId },
        include: { client: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings Monitor</h1>
        <p className="text-gray-500 mt-1">AI is monitoring {bookings.filter((b) => b.status === "CONFIRMED").length} active bookings</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Reference", "Client", "Destination", "Departure", "Status", "Total", "Actions"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No bookings yet. Confirmed quotes will appear here.
                </td>
              </tr>
            ) : (
              bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{b.reference}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.client.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.destination || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {b.departureDate ? new Date(b.departureDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[b.status] || ""}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${b.totalCost.toLocaleString()} {b.currency}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs text-blue-600 hover:text-blue-800">View</button>
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
