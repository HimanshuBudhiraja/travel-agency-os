import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createSchema = z.object({
  quoteId: z.string(),
  clientId: z.string(),
  destination: z.string().optional(),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  paxCount: z.number().int().min(1),
  totalCost: z.number(),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reference = `TOS-${Date.now().toString(36).toUpperCase()}`;

  const booking = await prisma.booking.create({
    data: {
      agencyId,
      clientId: parsed.data.clientId,
      quoteId: parsed.data.quoteId,
      reference,
      destination: parsed.data.destination,
      departureDate: parsed.data.departureDate ? new Date(parsed.data.departureDate) : undefined,
      returnDate: parsed.data.returnDate ? new Date(parsed.data.returnDate) : undefined,
      paxCount: parsed.data.paxCount,
      totalCost: parsed.data.totalCost,
      currency: parsed.data.currency,
      notes: parsed.data.notes,
    },
    include: { client: true },
  });

  // Update lead stage if linked via quote
  const quote = await prisma.quote.findUnique({ where: { id: parsed.data.quoteId } });
  if (quote?.leadId) {
    await prisma.lead.update({
      where: { id: quote.leadId },
      data: { stage: "BOOKED", closedAt: new Date() },
    });
  }

  // Update client LTV
  await prisma.client.update({
    where: { id: parsed.data.clientId },
    data: {
      lifetimeValue: { increment: parsed.data.totalCost },
      bookingCount: { increment: 1 },
    },
  });

  return NextResponse.json({ booking }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string | undefined;
  if (!agencyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  const bookings = await prisma.booking.findMany({
    where: {
      agencyId,
      ...(status ? { status: status as any } : {}),
      ...(clientId ? { clientId } : {}),
    },
    include: { client: true, supplierBookings: { include: { supplier: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ bookings });
}
