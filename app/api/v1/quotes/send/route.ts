import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";
import { sendWhatsApp } from "@/lib/messaging/twilio";
import type { QuoteTier } from "@/lib/ai/brain";

// ─── POST /api/v1/quotes/send ─────────────────────────────────────────────────
// Send a quote to a client via WhatsApp and persist the Quote record

export async function POST(req: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const agencyId =
      ((sessionClaims?.metadata as any)?.agencyId as string) ||
      undefined;

    const body = await req.json();
    const {
      tier,
      clientName,
      clientWhatsapp,
      destination,
      agencyId: bodyAgencyId,
    }: {
      tier: QuoteTier;
      clientName: string;
      clientWhatsapp: string;
      destination: string;
      agencyId?: string;
    } = body;

    // Resolve agencyId from session claims or request body
    const resolvedAgencyId: string = agencyId || bodyAgencyId || "";

    if (!resolvedAgencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!tier || !clientName || !clientWhatsapp || !destination) {
      return NextResponse.json(
        { error: "tier, clientName, clientWhatsapp, and destination are required" },
        { status: 400 }
      );
    }

    // Fetch the agency for the AI persona name (used in some messaging)
    const agency = await prisma.agency.findUnique({
      where: { id: resolvedAgencyId },
      select: { id: true, name: true, aiPersonaName: true },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // Fetch the authenticated user to use as createdBy
    const userId = (sessionClaims?.metadata as any)?.dbUserId as string | undefined;

    // Find or create Client by WhatsApp number
    let client = await prisma.client.findFirst({
      where: { agencyId: resolvedAgencyId, whatsapp: clientWhatsapp },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          agencyId: resolvedAgencyId,
          name: clientName,
          whatsapp: clientWhatsapp,
        },
      });
    } else if (client.name !== clientName) {
      // Update name if it differs (use most recent)
      client = await prisma.client.update({
        where: { id: client.id },
        data: { name: clientName },
      });
    }

    // Resolve a createdBy user — fall back to the first OWNER/AGENT for the agency
    let resolvedUserId: string = userId || "";
    if (!resolvedUserId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { agencyId: resolvedAgencyId },
        select: { id: true },
      });
      resolvedUserId = fallbackUser?.id || "";
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        { error: "No agent found for this agency" },
        { status: 500 }
      );
    }

    // Generate a unique web link token
    const webLinkToken = nanoid(10);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.travelagencyos.com";
    const webLink = `${appUrl}/proposal/${webLinkToken}`;

    const grossPrice = tier.grossPriceInr;
    const netCost = tier.netCostInr;

    // Format price en-IN style
    const formattedPrice = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(grossPrice);

    // Build highlights (first two from tier.highlights)
    const highlight1 = tier.highlights?.[0] || "Handpicked experiences";
    const highlight2 = tier.highlights?.[1] || "Expert local guides";

    // Build WhatsApp message
    const whatsappMessage =
      `Hi ${clientName}! 🌟 Your personalised travel proposal for ${destination} is ready.\n\n` +
      `Package: ${tier.title}\n` +
      `💰 Total: ${formattedPrice}\n` +
      `✨ ${highlight1}\n` +
      `✨ ${highlight2}\n\n` +
      `View full itinerary: ${webLink}\n\n` +
      `Valid for 7 days. Let me know if you'd like any changes! 🙏`;

    // Create Quote record in DB
    const quote = await prisma.quote.create({
      data: {
        agencyId: resolvedAgencyId,
        clientId: client.id,
        createdById: resolvedUserId,
        status: "SENT",
        sentAt: new Date(),
        webLinkToken,
        webLink,
        grossPrice,
        netCost,
        markup: tier.marginPct,
        currency: "INR",
        title: tier.title,
        destination,
        itinerary: tier as any,
        isAiGenerated: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send WhatsApp message via Twilio
    await sendWhatsApp(clientWhatsapp, whatsappMessage);

    return NextResponse.json({
      ok: true,
      quoteId: quote.id,
      webLink,
    });
  } catch (error: any) {
    console.error("[POST /api/v1/quotes/send]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
