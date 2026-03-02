import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

const travelStyleBadge: Record<string, string> = {
  luxury: "bg-yellow-100 text-yellow-700",
  adventure: "bg-green-100 text-green-700",
  family: "bg-blue-100 text-blue-700",
  budget: "bg-gray-100 text-gray-600",
  business: "bg-purple-100 text-purple-700",
};

export default async function ClientsPage() {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  const clients: any[] = agencyId
    ? await prisma.client.findMany({
        where: { agencyId },
        orderBy: { lifetimeValue: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.length} clients in your CRM</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          + Add client
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium text-gray-900 mb-1">No clients yet</p>
            <p className="text-sm text-gray-400">
              Clients are created automatically when messages arrive via WhatsApp, email, or web chat
            </p>
          </div>
        ) : (
          clients.map((client: any) => (
            <div key={client.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-400 truncate">{client.email || client.phone || "No contact"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {client.travelStyle && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${travelStyleBadge[client.travelStyle] || "bg-gray-100 text-gray-600"}`}>
                    {client.travelStyle}
                  </span>
                )}
                {client.country && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {client.country}
                  </span>
                )}
              </div>

              <div className="border-t border-gray-50 pt-3 flex justify-between">
                <div>
                  <p className="text-xs text-gray-400">LTV</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${client.lifetimeValue.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Bookings</p>
                  <p className="text-sm font-semibold text-gray-900">{client.bookingCount}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
