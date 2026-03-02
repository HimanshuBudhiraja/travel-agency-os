import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractTravelIntent, generateAutoReply } from "@/lib/ai/brain";
import { sendWhatsApp, validateTwilioSignature } from "@/lib/messaging/twilio";

export async function POST(req: NextRequest) {
  // Validate Twilio signature in production
  if (process.env.NODE_ENV === "production") {
    const signature = req.headers.get("x-twilio-signature") || "";
    const url = process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/twilio";
    const params = Object.fromEntries(await req.formData() as any);
    if (!validateTwilioSignature(signature, url, params)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const formData = await req.formData();
  const from = formData.get("From")?.toString() || "";
  const body = formData.get("Body")?.toString() || "";
  const messageSid = formData.get("MessageSid")?.toString() || "";

  if (!from || !body) {
    return NextResponse.json({ ok: true });
  }

  // Strip the "whatsapp:" prefix
  const phone = from.replace("whatsapp:", "");

  // Find or create agency by matching Twilio number (in production, map by agency)
  // For now, use the first agency (single-tenant dev mode)
  const agency = await prisma.agency.findFirst();
  if (!agency) return NextResponse.json({ error: "No agency found" }, { status: 404 });

  // Find or create client
  let client = await prisma.client.findFirst({ where: { agencyId: agency.id, whatsapp: phone } });
  if (!client) {
    client = await prisma.client.create({
      data: { agencyId: agency.id, name: phone, whatsapp: phone },
    });
  }

  // Find or create open conversation
  let conversation = await prisma.conversation.findFirst({
    where: { agencyId: agency.id, clientId: client.id, channel: "WHATSAPP", isOpen: true },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { agencyId: agency.id, clientId: client.id, channel: "WHATSAPP" },
    });
  }

  // Save inbound message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      channel: "WHATSAPP",
      content: body,
      externalId: messageSid,
    },
  });

  // Extract intent using Agency Brain
  const intent = await extractTravelIntent(body, agency.id);

  // Update conversation with extracted intent
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      intentDestination: intent.destination ?? conversation.intentDestination,
      intentDates: intent.dates ?? conversation.intentDates,
      intentBudget: intent.budget ?? conversation.intentBudget,
      intentGroupSize: intent.groupSize ?? conversation.intentGroupSize,
      intentSentiment: intent.sentiment,
      updatedAt: new Date(),
    },
  });

  // Auto-create or update client profile from intent
  if (intent.groupSize) {
    await prisma.client.update({
      where: { id: client.id },
      data: { groupSize: intent.groupSize, lastContactAt: new Date() },
    });
  }

  // Create lead if this looks like a travel inquiry
  if (intent.destination && intent.confidence > 0.6) {
    const existingLead = await prisma.lead.findFirst({
      where: { agencyId: agency.id, clientId: client.id, conversationId: conversation.id },
    });
    if (!existingLead) {
      await prisma.lead.create({
        data: {
          agencyId: agency.id,
          clientId: client.id,
          conversationId: conversation.id,
          destination: intent.destination,
          paxCount: intent.groupSize,
          notes: intent.summary,
          score: intent.confidence > 0.8 ? "HOT" : "WARM",
          conversionProb: intent.confidence,
        },
      });
    }
  }

  // Generate and send auto-reply if AI is managing this conversation
  if (conversation.isAiManaged && intent.confidence >= agency.aiAutonomyThreshold) {
    const { reply } = await generateAutoReply({
      clientName: client.name !== phone ? client.name : undefined,
      intent,
      agencyName: agency.name,
      aiPersonaName: agency.aiPersonaName,
      channel: "WHATSAPP",
      agencyId: agency.id,
    });

    try {
      const sid = await sendWhatsApp(phone, reply);
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "OUTBOUND",
          channel: "WHATSAPP",
          content: reply,
          isAiGenerated: true,
          externalId: sid,
        },
      });
    } catch (err) {
      console.error("Failed to send WhatsApp reply:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
