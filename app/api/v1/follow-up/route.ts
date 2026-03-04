import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateFollowUp } from "@/lib/ai/brain";
import { sendWhatsApp } from "@/lib/messaging/twilio";

// ─── POST /api/v1/follow-up ───────────────────────────────────────────────────
// Trigger a follow-up message for an existing quote

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { quoteId } = body;

    if (!quoteId || typeof quoteId !== "string") {
      return NextResponse.json(
        { error: "quoteId is required" },
        { status: 400 }
      );
    }

    // Find quote with client and agency
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, agencyId },
      include: {
        client: true,
        agency: {
          select: {
            id: true,
            name: true,
            aiPersonaName: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (!quote.client.whatsapp) {
      return NextResponse.json(
        { error: "Client has no WhatsApp number on file" },
        { status: 400 }
      );
    }

    // Count previous follow-ups for this quote
    const previousFollowUps = await prisma.aiAction.count({
      where: {
        agencyId,
        type: "FOLLOW_UP_SEND",
        entityId: quoteId,
      },
    });

    // Calculate days since quote was sent
    const daysSinceSent = quote.sentAt
      ? Math.floor(
          (Date.now() - new Date(quote.sentAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    // Generate follow-up message via AI
    const message = await generateFollowUp({
      clientName: quote.client.name,
      destination: quote.destination || "your upcoming trip",
      quoteTitle: quote.title,
      daysSinceSent,
      previousFollowUps,
      agencyName: quote.agency.name,
      aiPersonaName: quote.agency.aiPersonaName,
      agencyId,
    });

    // Send via WhatsApp (Twilio)
    await sendWhatsApp(quote.client.whatsapp, message);

    // Log the action in AiAction table
    await prisma.aiAction.create({
      data: {
        agencyId,
        type: "FOLLOW_UP_SEND",
        entityType: "Quote",
        entityId: quoteId,
        input: {
          quoteId,
          clientName: quote.client.name,
          daysSinceSent,
          previousFollowUps,
        },
        output: { message },
        confidence: 0.95,
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (error: any) {
    console.error("[POST /api/v1/follow-up]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
