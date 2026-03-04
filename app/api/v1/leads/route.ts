import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// ─── GET /api/v1/leads ────────────────────────────────────────────────────────
// Returns all leads with client for the authenticated agency

export async function GET(_req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leads = await prisma.lead.findMany({
      where: { agencyId },
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
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("[GET /api/v1/leads]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/v1/leads ───────────────────────────────────────────────────────
// Creates a new lead. If no clientId, creates a Client first using clientName.

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId: rawClientId,
      clientName,
      destination,
      notes,
      estimatedValue,
      score,
      assignedToId,
    } = body;

    let clientId: string = rawClientId;

    // If no clientId provided, create a new Client using clientName
    if (!clientId) {
      if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
        return NextResponse.json(
          { error: "clientName is required when clientId is not provided" },
          { status: 400 }
        );
      }

      const newClient = await prisma.client.create({
        data: {
          agencyId,
          name: clientName.trim(),
        },
      });

      clientId = newClient.id;
    }

    const lead = await prisma.lead.create({
      data: {
        agencyId,
        clientId,
        destination: destination?.trim() || null,
        notes: notes?.trim() || null,
        stage: "NEW",
        score: score || "WARM",
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        assignedToId: assignedToId || null,
      },
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

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/v1/leads]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
