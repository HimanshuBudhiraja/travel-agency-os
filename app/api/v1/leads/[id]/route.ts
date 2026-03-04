import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// ─── GET /api/v1/leads/[id] ───────────────────────────────────────────────────
// Returns a single lead with client and quotes

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sessionClaims } = await auth();
    const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, agencyId },
      include: {
        client: true,
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("[GET /api/v1/leads/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/v1/leads/[id] ─────────────────────────────────────────────────
// Update lead fields. Validates lead belongs to agency.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { sessionClaims } = await auth();
    const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify lead belongs to this agency
    const existing = await prisma.lead.findFirst({
      where: { id, agencyId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      stage,
      score,
      estimatedValue,
      destination,
      notes,
      assignedToId,
      departureDate,
      returnDate,
      paxCount,
      budget,
      lostReason,
      conversionProb,
    } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (stage !== undefined) updateData.stage = stage;
    if (score !== undefined) updateData.score = score;
    if (estimatedValue !== undefined)
      updateData.estimatedValue = estimatedValue !== null ? Number(estimatedValue) : null;
    if (destination !== undefined) updateData.destination = destination;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (departureDate !== undefined)
      updateData.departureDate = departureDate ? new Date(departureDate) : null;
    if (returnDate !== undefined)
      updateData.returnDate = returnDate ? new Date(returnDate) : null;
    if (paxCount !== undefined) updateData.paxCount = paxCount ? Number(paxCount) : null;
    if (budget !== undefined) updateData.budget = budget !== null ? Number(budget) : null;
    if (lostReason !== undefined) updateData.lostReason = lostReason;
    if (conversionProb !== undefined)
      updateData.conversionProb = conversionProb !== null ? Number(conversionProb) : null;

    // Auto-set closedAt when moving to WON or LOST
    if (stage === "WON" || stage === "LOST") {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH /api/v1/leads/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
