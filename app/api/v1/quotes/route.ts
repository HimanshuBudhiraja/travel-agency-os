import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { generateThreeTierItinerary } from "@/lib/ai/brain";
import { searchHotels } from "@/lib/suppliers/ratehawk";
import { z } from "zod";

const briefSchema = z.object({
  brief: z.string().min(10),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
});

// POST /api/v1/quotes — generate AI itinerary from a brief
export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  const userId = (sessionClaims?.metadata as any)?.dbUserId as string | undefined;

  if (!agencyId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = briefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { brief, leadId, clientId } = parsed.data;

  // Simple heuristic extraction from brief for hotel search
  const destinationMatch = brief.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/);
  const budgetMatch = brief.match(/\$?(\d[\d,]+)/);
  const paxMatch = brief.match(/(\d+)\s+(?:people|person|pax|travelers?|adults?)/i);
  const nightsMatch = brief.match(/(\d+)\s*(?:nights?|days?)/i);

  const destination = destinationMatch?.[1] || "destination";
  const budget = budgetMatch ? parseInt(budgetMatch[1].replace(",", "")) : 5000;
  const paxCount = paxMatch ? parseInt(paxMatch[1]) : 2;
  const nights = nightsMatch ? parseInt(nightsMatch[1]) : 7;

  const today = new Date();
  const departure = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const returnDate = new Date(departure.getTime() + nights * 24 * 60 * 60 * 1000);

  const departureStr = departure.toISOString().split("T")[0];
  const returnStr = returnDate.toISOString().split("T")[0];

  const budgetInr = budget * 83; // rough USD→INR

  // Run AI itinerary generation + hotel search in parallel
  const [tiers, hotels] = await Promise.all([
    generateThreeTierItinerary({
      destination,
      departureDate: departureStr,
      returnDate: returnStr,
      paxCount,
      budgetInr,
      travelStyle: brief.match(/luxury|adventure|family|budget|business/i)?.[0] || "flexible",
      preferences: brief,
      agencyId,
    }),
    searchHotels({
      destination,
      checkIn: departureStr,
      checkOut: returnStr,
      adults: paxCount,
      currency: "USD",
    }),
  ]);

  const recommended = tiers.recommended;
  const netCost = recommended.netCostInr / 83; // convert back to USD for DB
  const grossPrice = recommended.grossPriceInr / 83;

  // Resolve client: use provided clientId or find/create a placeholder
  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    const placeholder = await prisma.client.create({
      data: { agencyId, name: "New Client (from quote builder)" },
    });
    resolvedClientId = placeholder.id;
  }

  // Persist recommended tier as a draft quote
  const quote = await prisma.quote.create({
    data: {
      agencyId,
      clientId: resolvedClientId,
      leadId: leadId || null,
      createdById: userId,
      title: recommended.title || `${destination} Trip`,
      destination,
      departureDate: departure,
      returnDate: returnDate,
      paxCount,
      netCost,
      markup: recommended.marginPct,
      grossPrice,
      currency: "INR",
      itinerary: recommended as any,
      isAiGenerated: true,
      aiPrompt: brief,
      webLinkToken: crypto.randomUUID(),
    },
  });

  return NextResponse.json({
    quoteId: quote.id,
    tiers,
    hotels,
  });
}

// GET /api/v1/quotes — list quotes for agency
export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;

  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  const quotes = await prisma.quote.findMany({
    where: {
      agencyId,
      ...(status ? { status: status as any } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: { client: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ quotes });
}
