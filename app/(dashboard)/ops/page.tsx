import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export default async function OpsOverviewPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const [confirmed, pending, cancelled, suppliers] = await Promise.all([
    agencyId ? prisma.booking.count({ where: { agencyId, status: "CONFIRMED" } }) : Promise.resolve(0),
    agencyId ? prisma.booking.count({ where: { agencyId, status: "PENDING" } }) : Promise.resolve(0),
    agencyId ? prisma.booking.count({ where: { agencyId, status: "CANCELLED" } }) : Promise.resolve(0),
    agencyId ? prisma.supplier.count({ where: { agencyId } }) : Promise.resolve(0),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Operations Overview</h1>
        <p className="text-gray-500 mt-1">Monitor bookings and supplier performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Confirmed", value: confirmed, icon: "✅", color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending", value: pending, icon: "⏳", color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Cancelled", value: cancelled, icon: "❌", color: "text-red-500", bg: "bg-red-50" },
          { label: "Suppliers", value: suppliers, icon: "🤝", color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Link href="/ops/bookings" className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-sm transition-all block">
          <h2 className="font-semibold text-gray-900 mb-2">🏨 Bookings Monitor</h2>
          <p className="text-sm text-gray-500">
            AI monitors all active bookings for flight changes, supplier confirmations, and pre-trip milestones
          </p>
          <p className="text-sm text-blue-600 mt-4">View all bookings →</p>
        </Link>
        <Link href="/ops/suppliers" className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-sm transition-all block">
          <h2 className="font-semibold text-gray-900 mb-2">🤝 Supplier Intelligence</h2>
          <p className="text-sm text-gray-500">
            AI tracks supplier reliability, benchmarks rates, and flags underperforming partners
          </p>
          <p className="text-sm text-blue-600 mt-4">View suppliers →</p>
        </Link>
      </div>
    </div>
  );
}
