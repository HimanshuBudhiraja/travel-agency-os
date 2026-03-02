import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ProposalPage({ params }: PageProps) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { webLinkToken: token },
    include: { client: true, agency: true },
  });

  if (!quote) notFound();

  // Mark as opened
  if (!quote.openedAt) {
    await prisma.quote.update({ where: { id: quote.id }, data: { openedAt: new Date() } });
  }

  const itinerary = quote.itinerary as any;
  const components = quote.components as any[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agency branded header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: quote.agency.primaryColor }}>
              <span className="text-white text-sm font-bold">{quote.agency.name.charAt(0)}</span>
            </div>
            <span className="font-bold text-gray-900">{quote.agency.name}</span>
          </div>
          <span className="text-xs text-gray-400">Private proposal</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="bg-white rounded-3xl border border-gray-100 p-10 mb-6 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-3">Your personalised travel proposal</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {quote.title}
          </h1>
          {itinerary?.summary && (
            <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">{itinerary.summary}</p>
          )}

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-500">
            {quote.destination && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{quote.destination}</span>
              </div>
            )}
            {quote.departureDate && (
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>
                  {new Date(quote.departureDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  {quote.returnDate && ` — ${new Date(quote.returnDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
                </span>
              </div>
            )}
            {quote.paxCount && (
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span>{quote.paxCount} {quote.paxCount === 1 ? "traveller" : "travellers"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing card */}
        <div className="bg-blue-600 rounded-3xl p-8 mb-6 text-white">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-blue-200 text-sm mb-1">Package includes</p>
              <p className="text-2xl font-bold">
                {quote.currency} {quote.grossPrice.toLocaleString()}
              </p>
              <p className="text-blue-200 text-xs mt-1">Total for {quote.paxCount} traveller{quote.paxCount > 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Per person</p>
              <p className="text-2xl font-bold">
                {quote.currency} {Math.round(quote.grossPrice / (quote.paxCount || 1)).toLocaleString()}
              </p>
              <p className="text-blue-200 text-xs mt-1">All-inclusive</p>
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">Valid until</p>
              <p className="text-2xl font-bold">
                {quote.expiresAt
                  ? new Date(quote.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                  : "Open"}
              </p>
              <p className="text-blue-200 text-xs mt-1">Prices subject to availability</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              ✓ I approve this proposal
            </button>
            <button className="border border-blue-400 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Request changes
            </button>
          </div>
        </div>

        {/* Day-by-day itinerary */}
        {itinerary?.days?.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your itinerary</h2>
            <div className="space-y-8">
              {itinerary.days.map((day: any) => (
                <div key={day.dayNumber} className="flex gap-6">
                  <div className="flex-shrink-0 w-14 text-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-blue-600 font-bold text-sm">{day.dayNumber}</span>
                    </div>
                    {day.dayNumber < itinerary.days.length && (
                      <div className="w-0.5 h-full bg-blue-100 mx-auto mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-xs text-gray-400 mb-1">{day.date}</p>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{day.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{day.description}</p>
                    {day.activities?.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {day.activities.map((act: any, i: number) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <span className="text-gray-300 w-14 flex-shrink-0">{act.time}</span>
                            <div>
                              <span className="text-gray-700">{act.activity}</span>
                              {act.location && <span className="text-gray-400"> · {act.location}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {day.accommodation && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-lg">🏨</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{day.accommodation.name}</p>
                          {day.accommodation.area && <p className="text-xs text-gray-400">{day.accommodation.area}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Included / Excluded */}
        {(itinerary?.included?.length > 0 || itinerary?.excluded?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {itinerary.included?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">✅ What&apos;s included</h3>
                <ul className="space-y-2">
                  {itinerary.included.map((item: string) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {itinerary.excluded?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">❌ Not included</h3>
                <ul className="space-y-2">
                  {itinerary.excluded.map((item: string) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-1">
            Prepared by <strong className="text-gray-600">{quote.agency.name}</strong>
          </p>
          {quote.agency.email && (
            <p className="text-sm text-blue-600">{quote.agency.email}</p>
          )}
          <p className="text-xs text-gray-300 mt-4">Powered by TravelOS · Proposal #{quote.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
