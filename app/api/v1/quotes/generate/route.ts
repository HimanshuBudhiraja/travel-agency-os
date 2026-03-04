import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateThreeTierItinerary } from "@/lib/ai/brain";

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

  if (!agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    destination,
    departureDate,
    returnDate,
    paxCount,
    budgetInr,
    travelStyle,
    preferences,
  } = body;

  if (!destination || !departureDate || !returnDate || !paxCount || !budgetInr) {
    return NextResponse.json(
      { error: "Missing required fields: destination, departureDate, returnDate, paxCount, budgetInr" },
      { status: 400 }
    );
  }

  const tiers = await generateThreeTierItinerary({
    destination,
    departureDate,
    returnDate,
    paxCount: Number(paxCount),
    budgetInr: Number(budgetInr),
    travelStyle: travelStyle ?? "Luxury",
    preferences: preferences ?? "",
    agencyId,
    defaultMarginPct: 0.18,
  });

  return NextResponse.json(tiers);
}
