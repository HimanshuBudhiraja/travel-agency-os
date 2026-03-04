import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/v1/conversations/[id]/messages — returns all messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { sessionClaims } = await auth();
  const agencyId = (sessionClaims?.metadata as any)?.agencyId as string;

  if (!agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // Validate conversation belongs to this agency
  const conversation = await prisma.conversation.findFirst({
    where: { id, agencyId },
    select: { id: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: {
      sentByAgent: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  return NextResponse.json({ messages });
}
