import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/suppliers/duffel";
import { z } from "zod";

const schema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().min(1).max(9),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const flights = await searchFlights(parsed.data);

  return NextResponse.json({
    results: flights,
    count: flights.length,
    source: process.env.DUFFEL_API_KEY ? "live" : "mock",
  });
}
