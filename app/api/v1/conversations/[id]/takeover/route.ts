import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

// POST /api/v1/conversations/[id]/takeover — agent takes over from AI
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

  // Validate conversation belongs to this agency
  const existing = await prisma.conversation.findFirst({
    where: { id, agencyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const conversation = await prisma.conversation.update({
    where: { id },
    data: {
      agentTookOver: true,
      isAiManaged: false,
    },
    include: {
      client: {
        select: { id: true, name: true, phone: true, whatsapp: true },
      },
    },
  });

  return NextResponse.json(conversation);
}
