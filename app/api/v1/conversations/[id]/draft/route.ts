import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { generateDraftReply } from "@/lib/ai/brain";

// POST /api/v1/conversations/[id]/draft — generate AI draft reply for agent review
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

  if (!agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // Validate conversation belongs to this agency + fetch context
  const conversation = await prisma.conversation.findFirst({
    where: { id, agencyId },
    include: {
      client: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { direction: true, content: true, createdAt: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Fetch agency metadata for persona
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { name: true, aiPersonaName: true },
  });

  // Build conversation history string (oldest first)
  const historyMessages = [...(conversation.messages ?? [])].reverse();
  const lastInbound = historyMessages.filter((m) => m.direction === "INBOUND").at(-1);
  const conversationHistory = historyMessages
    .map((m) => `[${m.direction}] ${m.content}`)
    .join("\n");

  const draft = await generateDraftReply({
    message: lastInbound?.content ?? "",
    clientName: conversation.client?.name ?? "Customer",
    conversationHistory,
    agencyName: agency?.name ?? "Our Agency",
    aiPersonaName: agency?.aiPersonaName ?? "Aria",
    agencyId,
  });

  return NextResponse.json({ draft });
}
