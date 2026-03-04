import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { sendWhatsApp } from "@/lib/messaging/twilio";

// POST /api/v1/conversations/[id]/send — send a message from agent
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;
  const dbUserId = (sessionClaims?.metadata as any)?.dbUserId as string | undefined;

  if (!agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const content: string = body.content?.trim();

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  // Validate conversation belongs to this agency
  const conversation = await prisma.conversation.findFirst({
    where: { id, agencyId },
    include: {
      client: { select: { whatsapp: true, phone: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Create the message record
  const message = await prisma.message.create({
    data: {
      conversationId: id,
      direction: "OUTBOUND",
      channel: conversation.channel,
      content,
      isAiGenerated: false,
      sentByAgentId: dbUserId ?? null,
      mediaUrls: [],
    },
  });

  // Update conversation updatedAt
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  // Send via WhatsApp if channel is WHATSAPP
  if (conversation.channel === "WHATSAPP") {
    const to = conversation.client?.whatsapp ?? conversation.client?.phone;
    if (to) {
      try {
        await sendWhatsApp(to, content);
      } catch (err) {
        // Non-blocking: message is already recorded, log the error
        console.error("[send] Twilio error:", err);
      }
    }
  }

  return NextResponse.json({ ok: true, messageId: message.id });
}
